import { OrdersController } from '@paypal/paypal-server-sdk';
import { createPayPalClient } from '../paypal';
import type { DatabaseStorage } from '../storage';
import type { OrderService } from './orderService';
import type { CouponService } from './couponService';

/**
 * Payment Orchestrator — the SINGLE authority for completing a payment.
 *
 * Both user-facing completion routes (/api/cart/complete-payment and
 * /api/orders/:orderId/complete) delegate here, so verification, capture,
 * amount checks, order lookup, recovery and fulfillment happen in exactly
 * one place. The webhook and the reconciliation service continue to call
 * orderService.processPaymentCompletion directly — they operate on
 * PayPal-verified capture facts and never trust client input.
 *
 * Trust rules enforced here (server-side, non-negotiable):
 *  1. 'manual-payment' (no PayPal order) can only fulfil a FREE order (total ≤ 0).
 *  2. The PayPal order's amount+currency MUST match the DB order total before
 *     fulfillment. Mismatch → block + CRITICAL admin log (possible tampering).
 *  3. Any order found by any lookup layer MUST belong to the calling user.
 *  4. Order marked paid only after PayPal confirms the capture COMPLETED.
 */

export interface CompletePaymentInput {
  userId: string;
  rawPaypalOrderId?: string | null;
  /** Explicit DB order id (body dbOrderId or the :orderId route param). */
  dbOrderId?: string | null;
  /** true → dbOrderId must exist & belong to user (404/403), no fuzzy fallback beyond it. */
  requireExplicitOrder?: boolean;
  couponCode?: string | null;
  ip: string;
  userAgent: string;
  route: string;
}

export interface CompletePaymentResult {
  httpStatus: number;
  body: any;
}

const AMOUNT_TOLERANCE = 0.011; // cents-level float tolerance

export class PaymentOrchestrator {
  constructor(
    private storage: DatabaseStorage,
    private orderService: OrderService,
    private couponService: CouponService,
  ) {}

  private event(data: Record<string, any>): void {
    this.storage.createPaymentEvent(data as any).catch(() => {});
  }

  private syslog(data: Record<string, any>): void {
    this.storage.createSystemLog(data as any).catch(() => {});
  }

  async completePayment(input: CompletePaymentInput): Promise<CompletePaymentResult> {
    const t0 = Date.now();
    const { userId, dbOrderId, couponCode, ip, userAgent, route } = input;

    // ── Normalise ─────────────────────────────────────────────────────────
    const paypalOrderId = (input.rawPaypalOrderId && String(input.rawPaypalOrderId).trim())
      ? String(input.rawPaypalOrderId).trim()
      : 'manual-payment';
    const isPaypal = paypalOrderId !== 'manual-payment';

    console.log(`💳 orchestrator(${route}): user=${userId} paypalOrderId=${paypalOrderId} dbOrderId=${dbOrderId || 'none'}`);

    try {
      // ── 1. Idempotency ──────────────────────────────────────────────────
      if (isPaypal) {
        const existing = await this.storage.getOrdersByPaypalOrderId(paypalOrderId);
        const alreadyPaid = existing.find(o => o.status === 'paid');
        if (alreadyPaid) {
          // Ownership FIRST — never leak another user's order via idempotent replay
          if (alreadyPaid.userId !== userId) {
            console.error(`🚨 SECURITY: user ${userId} probed paid PayPal order ${paypalOrderId} owned by ${alreadyPaid.userId}`);
            this.syslog({
              category: 'security', action: 'idempotency_ownership_violation',
              entityType: 'order', entityId: alreadyPaid.id,
              details: { paypalOrderId, callerUserId: userId, ownerUserId: alreadyPaid.userId, route },
              ipAddress: ip, userAgent,
            });
            return { httpStatus: 403, body: { message: 'Forbidden' } };
          }
          console.log(`🔁 IDEMPOTENCY: ${paypalOrderId} already paid → DB order ${alreadyPaid.id}`);
          this.event({
            eventType: 'duplicate_attempt_blocked', paypalOrderId, dbOrderId: alreadyPaid.id,
            userId, status: 'blocked', durationMs: Date.now() - t0,
            ipAddress: ip, userAgent, metadata: { route, reason: 'paypalOrderId already paid' },
          });
          // Minimal payload — no credentials, no full order object
          return { httpStatus: 200, body: {
            id: alreadyPaid.id, orderId: alreadyPaid.id,
            success: true, message: 'Order already completed',
            totalUsd: String(alreadyPaid.totalUsd ?? ''),
          }};
        }
      }

      this.event({
        eventType: 'complete_request', paypalOrderId, dbOrderId: dbOrderId || null,
        userId, status: 'ok', ipAddress: ip, userAgent, metadata: { route },
      });

      // ── 2. Find the DB order (all layers enforce ownership) ─────────────
      const found = await this.findOrder(userId, paypalOrderId, dbOrderId ?? null,
        !!input.requireExplicitOrder, ip, userAgent);
      if ('error' in found) return found.error;
      const order = found.order;

      // ── 3. Trust rule: free orders only for manual-payment ──────────────
      const orderTotal = parseFloat(String(order.totalUsd ?? '0'));
      if (!isPaypal && orderTotal > 0) {
        console.error(`🚨 SECURITY: manual-payment attempted on non-free order ${order.id} (total=${orderTotal}) by user ${userId}`);
        this.syslog({
          category: 'security', action: 'manual_payment_on_paid_order_blocked',
          entityType: 'order', entityId: order.id,
          details: { userId, orderTotal, route },
          ipAddress: ip, userAgent,
        });
        this.event({
          eventType: 'complete_failed', paypalOrderId, dbOrderId: order.id, userId,
          status: 'blocked', errorMessage: 'manual-payment on non-free order',
          durationMs: Date.now() - t0, ipAddress: ip, userAgent, metadata: { route },
        });
        return { httpStatus: 400, body: { message: 'Bu sipariş için ödeme gereklidir.' } };
      }

      // ── 4. Verify + amount check + capture (PayPal orders only) ─────────
      if (isPaypal) {
        const verify = await this.verifyAndCapture(paypalOrderId, order, orderTotal, userId, ip, userAgent, route, t0);
        if (verify) return verify; // non-null → error response
      }

      // ── 5. Coupon (non-fatal after capture) ─────────────────────────────
      let total = orderTotal;
      if (couponCode && !order.couponId) {
        try {
          const user = await this.storage.getUserById(userId);
          const cartTotal = await this.storage.getCartTotal(userId);
          const subtotal = cartTotal?.subtotal ?? orderTotal;
          if (user?.ship_id) {
            const cr = await this.couponService.validateAndCalculateDiscount(couponCode, subtotal, user.ship_id, userId);
            total = cr.new_total;
            this.couponService.recordCouponUsage(cr.coupon.id, userId, order.id, cr.discount_amount).catch(() => {});
          }
        } catch (_) { /* coupon errors must never block a captured payment */ }
      }

      // ── 6. Fulfil (atomic, idempotent; loyalty handled inside) ──────────
      const result = await this.orderService.processPaymentCompletion(order.id, paypalOrderId);

      if (!result.success) {
        this.event({
          eventType: 'complete_failed', paypalOrderId, dbOrderId: order.id, userId,
          status: 'error', errorMessage: 'processPaymentCompletion returned success=false',
          durationMs: Date.now() - t0, ipAddress: ip, userAgent, metadata: { route },
        });
        return { httpStatus: 400, body: { message: 'Failed to complete order' } };
      }

      this.event({
        eventType: 'complete_success', paypalOrderId, dbOrderId: order.id, userId,
        amountUsd: String(total.toFixed(2)), status: 'ok', durationMs: Date.now() - t0,
        ipAddress: ip, userAgent,
        metadata: { route, credentialCount: result.assignedCredentials?.length ?? 0 },
      });

      return { httpStatus: 200, body: {
        id: order.id, orderId: order.id, order: result.order,
        assignedCredentials: result.assignedCredentials, success: true,
        message: 'Order completed and credentials assigned',
        totalUsd: total.toFixed(2),
      }};

    } catch (error: any) {
      console.error(`❌ orchestrator(${route}) error:`, error);
      this.event({
        eventType: 'complete_failed', paypalOrderId, dbOrderId: dbOrderId || null,
        userId, status: 'error', errorMessage: error?.message || String(error),
        durationMs: Date.now() - t0, ipAddress: ip, userAgent, metadata: { route },
      });
      return { httpStatus: 500, body: { message: 'Ödeme tamamlanamadı. Lütfen destek ekibiyle iletişime geçin.' } };
    }
  }

  // ── Order lookup: 4 deterministic layers, ownership enforced on all ─────
  private async findOrder(
    userId: string, paypalOrderId: string, dbOrderId: string | null,
    requireExplicit: boolean, ip: string, userAgent: string,
  ): Promise<{ order: any } | { error: CompletePaymentResult }> {
    const isPaypal = paypalOrderId !== 'manual-payment';

    // Layer 0 (explicit route param): strict 404/403 semantics
    if (requireExplicit && dbOrderId) {
      const target = await this.storage.getOrderById(dbOrderId);
      if (!target) return { error: { httpStatus: 404, body: { message: 'Order not found' } } };
      if (target.userId !== userId) {
        console.error(`🚨 SECURITY: user ${userId} attempted to complete order ${dbOrderId} owned by ${target.userId}`);
        this.syslog({
          category: 'security', action: 'order_complete_ownership_violation',
          entityType: 'order', entityId: dbOrderId,
          details: { attemptingUserId: userId, ownerUserId: target.userId },
          ipAddress: ip, userAgent,
        });
        return { error: { httpStatus: 403, body: { message: 'Forbidden' } } };
      }
      // Link paypalOrderId for webhook/future lookups
      if (isPaypal && !target.paypalOrderId) {
        await this.storage.updateOrder(target.id, { paypalOrderId });
      }
      return { order: { ...target, paypalOrderId: target.paypalOrderId || paypalOrderId } };
    }

    // Layer 1: by paypalOrderId (must belong to this user)
    if (isPaypal) {
      const byPaypal = await this.storage.getOrdersByPaypalOrderId(paypalOrderId);
      const candidate = byPaypal.find(o => o.status === 'pending')
                     || byPaypal.find(o => o.status === 'cancelled')
                     || byPaypal.find(o => o.status === 'failed')
                     || null;
      if (candidate) {
        if (candidate.userId !== userId) {
          console.error(`🚨 SECURITY: PayPal order ${paypalOrderId} maps to order of user ${candidate.userId}, but caller is ${userId}`);
          this.syslog({
            category: 'security', action: 'paypal_order_ownership_mismatch',
            entityType: 'order', entityId: candidate.id,
            details: { paypalOrderId, callerUserId: userId, ownerUserId: candidate.userId },
            ipAddress: ip, userAgent,
          });
          return { error: { httpStatus: 403, body: { message: 'Forbidden' } } };
        }
        return { order: candidate };
      }
    }

    // Layer 2: explicit body dbOrderId (ownership enforced)
    if (dbOrderId) {
      const direct = await this.storage.getOrderById(dbOrderId);
      if (direct && direct.userId === userId
          && (direct.status === 'pending' || direct.status === 'cancelled' || direct.status === 'failed')) {
        console.log(`🎯 orchestrator: found order directly by dbOrderId=${dbOrderId} (status=${direct.status})`);
        if (isPaypal && !direct.paypalOrderId) {
          await this.storage.updateOrder(direct.id, { paypalOrderId });
        }
        return { order: { ...direct, paypalOrderId: direct.paypalOrderId || paypalOrderId } };
      }
    }

    // Layer 3: user's current pending order
    const userOrders = await this.storage.getUserOrders(userId);
    const pending = userOrders.find(o => o.status === 'pending');
    if (pending) {
      if (isPaypal && !pending.paypalOrderId) {
        await this.storage.updateOrder(pending.id, { paypalOrderId });
      }
      return { order: pending };
    }

    // Layer 4: cancelled-order recovery — deterministic only
    if (isPaypal) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const exact = userOrders.find(o => o.status === 'cancelled' && o.paypalOrderId === paypalOrderId);
      const unlinked = userOrders.filter(o =>
        o.status === 'cancelled' && !o.paypalOrderId
        && o.createdAt && new Date(o.createdAt) > twoHoursAgo);

      let recovered: any = exact || null;
      let reason = 'Reactivated — PayPal order already linked';

      if (!recovered && unlinked.length === 1) {
        recovered = unlinked[0];
        reason = 'Reactivated — auto-cancelled before early-link; unique candidate';
      } else if (!recovered && unlinked.length > 1) {
        console.error(`🚨 AMBIGUOUS RECOVERY: ${unlinked.length} candidates for user ${userId} — refusing to guess`);
        this.syslog({
          category: 'payment_error', action: 'ambiguous_recovery_blocked',
          entityType: 'order', entityId: paypalOrderId,
          details: {
            paypalOrderId, candidateOrderIds: unlinked.map(o => o.id),
            severity: 'CRITICAL_NEEDS_ADMIN_ACTION',
            reason: 'Multiple cancelled orders could match this captured payment — manual resolution required',
          },
          ipAddress: ip, userAgent,
        });
      }

      if (recovered) {
        console.log(`🔄 Recovery: reactivating cancelled order ${recovered.id} (${reason})`);
        await this.storage.updateOrder(recovered.id, { status: 'pending', paypalOrderId });
        this.syslog({
          category: 'payment', action: 'order_recovery_reactivated', entityType: 'order',
          entityId: recovered.id,
          details: { reason, paypalOrderId, hadPaypalOrderId: !!recovered.paypalOrderId },
          ipAddress: ip, userAgent,
        });
        return { order: { ...recovered, status: 'pending', paypalOrderId } };
      }
    }

    console.error(`❌ No order found — user=${userId} paypalOrderId=${paypalOrderId}`);
    this.event({
      eventType: 'complete_failed', paypalOrderId, userId, status: 'error',
      errorMessage: 'No pending order found — possibly captured but no DB order',
      ipAddress: ip, userAgent, metadata: { critical: true },
    });
    return { error: { httpStatus: 400, body: {
      message: 'Sipariş bulunamadı. Ödemeniz alındıysa destek ekibi bilgilendirildi — mutabakat servisi 10 dakika içinde otomatik düzeltir.',
    }}};
  }

  // ── PayPal verify + amount/currency check + capture ─────────────────────
  // Returns null on success, or an error CompletePaymentResult.
  private async verifyAndCapture(
    paypalOrderId: string, order: any, orderTotal: number,
    userId: string, ip: string, userAgent: string, route: string, t0: number,
  ): Promise<CompletePaymentResult | null> {
    const ppClient = await createPayPalClient();
    const ppOrders = new OrdersController(ppClient);

    const { body: getBody } = await ppOrders.getOrder({ id: paypalOrderId });
    const ppOrder = JSON.parse(String(getBody));
    const ppStatus = ppOrder.status;
    console.log(`🔍 PayPal order ${paypalOrderId} status: ${ppStatus}`);

    // ── Amount + currency MUST match the DB order ─────────────────────────
    const pu = ppOrder.purchase_units?.[0];
    const ppAmount = parseFloat(String(pu?.amount?.value ?? 'NaN'));
    const ppCurrency = String(pu?.amount?.currency_code || '');
    const amountOk = Number.isFinite(ppAmount) && Math.abs(ppAmount - orderTotal) <= AMOUNT_TOLERANCE;
    const currencyOk = ppCurrency === (order.currency || 'USD');

    if (!amountOk || !currencyOk) {
      const alreadyCaptured = ppStatus === 'COMPLETED';
      console.error(`🚨 AMOUNT MISMATCH: PayPal ${paypalOrderId} = ${ppCurrency} ${ppAmount}, DB order ${order.id} = ${order.currency || 'USD'} ${orderTotal} (captured=${alreadyCaptured})`);
      this.syslog({
        category: 'security', action: 'payment_amount_mismatch',
        entityType: 'order', entityId: order.id,
        details: {
          paypalOrderId, paypalAmount: ppAmount, paypalCurrency: ppCurrency,
          orderTotal, orderCurrency: order.currency || 'USD',
          paypalStatus: ppStatus, alreadyCaptured, userId,
          severity: 'CRITICAL_NEEDS_ADMIN_ACTION',
        },
        ipAddress: ip, userAgent,
      });
      this.event({
        eventType: 'complete_failed', paypalOrderId, dbOrderId: order.id, userId,
        status: 'blocked', errorMessage: `Amount mismatch: PayPal ${ppCurrency} ${ppAmount} vs order ${orderTotal}`,
        durationMs: Date.now() - t0, ipAddress: ip, userAgent, metadata: { route },
      });
      return { httpStatus: 400, body: {
        message: alreadyCaptured
          ? 'Ödeme tutarı sipariş tutarıyla eşleşmiyor. Destek ekibi bilgilendirildi, manuel olarak incelenecek.'
          : 'Ödeme tutarı sipariş tutarıyla eşleşmiyor. Lütfen sayfayı yenileyip tekrar deneyin.',
      }};
    }

    if (ppStatus === 'APPROVED') {
      this.event({
        eventType: 'capture_attempt', paypalOrderId, dbOrderId: order.id, userId,
        status: 'ok', ipAddress: ip, userAgent, metadata: { route },
      });
      try {
        const { body: captureBody } = await ppOrders.captureOrder({ id: paypalOrderId, prefer: 'return=minimal' });
        const captureResult = JSON.parse(String(captureBody));
        const captureStatus = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.status;

        if (captureResult.status !== 'COMPLETED' || (captureStatus && captureStatus !== 'COMPLETED')) {
          this.event({
            eventType: 'capture_failed', paypalOrderId, dbOrderId: order.id, userId,
            status: 'error', errorMessage: `${captureResult.status}/${captureStatus}`,
            durationMs: Date.now() - t0, ipAddress: ip, userAgent, metadata: { route },
          });
          return { httpStatus: 400, body: { message: `Ödeme tamamlanamadı (${captureStatus || captureResult.status})` } };
        }

        this.event({
          eventType: 'capture_success', paypalOrderId, dbOrderId: order.id, userId,
          status: 'ok', durationMs: Date.now() - t0, ipAddress: ip, userAgent,
          metadata: { route, captureStatus: captureResult.status },
        });
        console.log(`✅ PayPal order ${paypalOrderId} captured`);
      } catch (captureErr: any) {
        const alreadyCaptured = String(captureErr?.body || captureErr?.message || '').includes('ORDER_ALREADY_CAPTURED');
        if (!alreadyCaptured) {
          this.event({
            eventType: 'capture_failed', paypalOrderId, dbOrderId: order.id, userId,
            status: 'error', errorMessage: captureErr?.message || String(captureErr),
            durationMs: Date.now() - t0, ipAddress: ip, userAgent, metadata: { route },
          });
          throw captureErr;
        }
        console.log(`ℹ️  ORDER_ALREADY_CAPTURED for ${paypalOrderId} — proceeding to fulfil`);
      }
    } else if (ppStatus !== 'COMPLETED') {
      return { httpStatus: 400, body: {
        message: `Ödeme geçerli bir durumda değil (PayPal durumu: ${ppStatus})`,
        paypalStatus: ppStatus, verified: false,
      }};
    }

    return null; // verified + captured
  }
}
