import { DatabaseStorage } from '../storage';
import { db } from '../db';
import { orders } from '@shared/schema';
import { and, asc, gt, isNotNull, sql } from 'drizzle-orm';
import { OrdersController } from '@paypal/paypal-server-sdk';
import { createPayPalClient } from '../paypal';
import { OrderService } from './orderService';

/**
 * Payment Reconciliation Service ("para mutabakatı")
 *
 * The FINAL safety net for "money captured but no package" incidents.
 *
 * No matter where the client flow breaks — create-order 500 after PayPal
 * charged the card, capture timeout, browser closed before complete-payment,
 * missed webhook — this service finds the mismatch and fixes it:
 *
 *   every 10 minutes:
 *     1. Find recent (48h) orders that have a paypalOrderId but are NOT paid
 *        (status: pending / cancelled / failed)
 *     2. Ask PayPal for the real status of each order
 *     3. If PayPal says the money was captured (COMPLETED) →
 *        processPaymentCompletion() marks the order paid and assigns
 *        credentials (idempotent — safe even if webhook/complete-payment
 *        already succeeded in the meantime)
 *     4. Every recovery is logged as a payment_event (eventType:
 *        'reconciliation_recovered') and a system log so admins can see
 *        exactly what was auto-fixed.
 */
export class PaymentReconciliationService {
  private storage: DatabaseStorage;
  private orderService: OrderService;
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  // Process at most this many orders per run to keep PayPal API usage sane
  private static readonly MAX_ORDERS_PER_RUN = 20;
  private static readonly LOOKBACK_HOURS = 48;
  private static readonly INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(storage: DatabaseStorage, orderService: OrderService) {
    this.storage = storage;
    this.orderService = orderService;
  }

  async reconcile(): Promise<{ checked: number; recovered: number }> {
    if (this.running) {
      console.log('⏭️  Reconciliation already running — skipping this tick');
      return { checked: 0, recovered: 0 };
    }
    this.running = true;
    let checked = 0;
    let recovered = 0;

    try {
      const lookback = new Date(Date.now() - PaymentReconciliationService.LOOKBACK_HOURS * 60 * 60 * 1000);

      // paypalOrderId set + not paid + recent.
      // NOTE: use sql`IN` instead of or() inside and() — drizzle or() pitfall.
      const candidates = await db
        .select()
        .from(orders)
        .where(and(
          isNotNull(orders.paypalOrderId),
          gt(orders.createdAt, lookback),
          sql`${orders.status} IN ('pending', 'cancelled', 'failed')`,
        ))
        // Oldest first — deterministic ordering so no candidate is starved out
        // of the batch by newer arrivals; everything ages through the queue.
        .orderBy(asc(orders.createdAt))
        .limit(PaymentReconciliationService.MAX_ORDERS_PER_RUN);

      if (candidates.length === 0) {
        return { checked: 0, recovered: 0 };
      }

      console.log(`🔎 Reconciliation: checking ${candidates.length} unpaid PayPal-linked orders against PayPal…`);

      const client = await createPayPalClient();
      const ordersController = new OrdersController(client);

      for (const order of candidates) {
        checked++;
        try {
          const { body } = await ordersController.getOrder({ id: order.paypalOrderId! });
          const ppOrder = JSON.parse(String(body));

          const capture = ppOrder?.purchase_units?.[0]?.payments?.captures?.[0];
          const moneyCaptured = ppOrder?.status === 'COMPLETED' && capture?.status === 'COMPLETED';

          if (!moneyCaptured) continue; // not captured — nothing to fix

          // 💰 PayPal has the money but our order is not paid → recover now.
          console.log(`🚑 Reconciliation: order ${order.id} (status=${order.status}) has CAPTURED PayPal payment ${order.paypalOrderId} — recovering`);

          const result = await this.orderService.processPaymentCompletion(order.id, order.paypalOrderId!);
          recovered++;

          this.storage.createPaymentEvent({
            eventType: 'reconciliation_recovered',
            paypalOrderId: order.paypalOrderId!,
            userId: order.userId,
            status: 'ok',
            errorMessage: null as any,
            durationMs: 0,
            ipAddress: 'system',
            userAgent: 'PaymentReconciliationService',
            metadata: {
              previousStatus: order.status,
              captureId: capture?.id,
              amount: `${capture?.amount?.currency_code} ${capture?.amount?.value}`,
              credentialsAssigned: result.assignedCredentials.length,
            },
          } as any).catch(() => {});

          await this.storage.createSystemLog({
            category: 'payment',
            action: 'reconciliation_recovered',
            entityType: 'order',
            entityId: order.id,
            details: {
              paypalOrderId: order.paypalOrderId,
              previousStatus: order.status,
              captureId: capture?.id,
              credentialsAssigned: result.assignedCredentials.length,
              reason: 'PayPal reports payment CAPTURED but order was not paid — auto-recovered',
            },
            ipAddress: 'system',
            userAgent: 'PaymentReconciliationService',
          });

        } catch (orderErr: any) {
          // 404 / expired PayPal order → normal for abandoned checkouts, skip quietly
          const msg = String(orderErr?.message || orderErr);
          if (msg.includes('404') || msg.includes('RESOURCE_NOT_FOUND')) continue;
          console.error(`⚠️  Reconciliation: error checking order ${order.id}:`, msg);
        }

        // Gentle pacing between PayPal API calls
        await new Promise(r => setTimeout(r, 500));
      }

      if (recovered > 0) {
        console.log(`✅ Reconciliation: recovered ${recovered}/${checked} orders`);
      }
      return { checked, recovered };

    } catch (err) {
      console.error('❌ Reconciliation service error:', err);
      return { checked, recovered };
    } finally {
      this.running = false;
    }
  }

  start(): void {
    if (this.intervalId) {
      console.log('⚠️  Payment reconciliation service is already running');
      return;
    }
    console.log('🚀 Starting payment reconciliation service — checking every 10 minutes');

    // First run shortly after startup (give the server a moment to settle)
    setTimeout(() => this.reconcile(), 30 * 1000);

    this.intervalId = setInterval(() => this.reconcile(), PaymentReconciliationService.INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Payment reconciliation service stopped');
    }
  }
}
