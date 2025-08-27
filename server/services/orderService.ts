import { storage } from "../storage";
import type { IStorage } from "../storage";
import { ExpiryService } from "./expiryService";
import { CouponService } from "./couponService";
import { emailService } from "../emailService";
import { getEndOfMonthIstanbul } from "../utils/dateUtils";
import { db } from "../db";
import { eq, and, isNull, or } from "drizzle-orm";
import { orders, orderItems, credentialPools, orderCredentials } from "@shared/schema";

export class OrderService {
  private expiryService: ExpiryService;
  private couponService: CouponService;

  constructor(private storage: IStorage) {
    this.expiryService = new ExpiryService(storage);
    this.couponService = new CouponService(storage);
  }

  async createOrder(userId: string, shipId: string, planId: string, couponCode?: string) {
    // Get ship and plan
    const [ship, plan] = await Promise.all([
      this.storage.getShips().then(ships => ships.find(s => s.id === shipId)),
      this.storage.getPlansForShip(shipId).then(plans => plans.find(p => p.id === planId))
    ]);

    if (!ship) {
      throw new Error("Ship not found");
    }

    if (!plan) {
      throw new Error("Plan not found for this ship");
    }

    let subtotal = Number(plan.priceUsd);
    let discount = 0;
    let couponId = null;

    // Apply coupon if provided
    if (couponCode) {
      try {
        const coupon = await this.couponService.validateCoupon(couponCode, shipId);
        if (coupon.type === 'percent') {
          discount = subtotal * (Number(coupon.value) / 100);
        } else {
          discount = Number(coupon.value);
        }
        discount = Math.min(discount, subtotal); // Don't exceed subtotal
        couponId = coupon.id;
      } catch (error: any) {
        throw new Error(`Invalid coupon: ${error.message}`);
      }
    }

    const total = subtotal - discount;

    // Create order
    const order = await this.storage.createOrder({
      userId,
      shipId,
      status: 'pending',
      currency: 'USD',
      subtotalUsd: subtotal.toFixed(2),
      discountUsd: discount.toFixed(2),
      totalUsd: total.toFixed(2),
      couponId
    });

    // Create order item
    await this.storage.createOrderItem({
      orderId: order.id,
      shipId,
      planId,
      qty: 1,
      unitPriceUsd: plan.priceUsd,
      lineTotalUsd: plan.priceUsd
    });

    return order;
  }

  async completeOrder(orderId: string, paypalOrderId: string) {
    const order = await this.storage.getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== 'pending') {
      throw new Error("Order is not in pending status");
    }

    const paidAt = new Date();
    const expiryDate = getEndOfMonthIstanbul(paidAt);

    return this.storage.updateOrder(orderId, {
      status: 'paid',
      paypalOrderId,
      expiresAt: expiryDate
    } as any);
  }

  /**
   * Atomically process payment completion with credential assignment and package activation
   * This method ensures all operations happen in a single database transaction for consistency
   */
  async processPaymentCompletion(orderId: string, paypalOrderId: string, paymentDetails?: any): Promise<{
    order: any;
    assignedCredentials: any[];
    success: boolean;
  }> {
    try {
      return await db.transaction(async (tx) => {
        // 1. Get and validate order
        const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
        
        if (!order) {
          throw new Error("Order not found");
        }

        if (order.status === 'paid') {
          console.log(`Order ${orderId} already processed as paid`);
          // Return existing data for idempotency
          const existingCredentials = await this.storage.getCredentialsForOrder(orderId);
          return {
            order,
            assignedCredentials: existingCredentials,
            success: true
          };
        }

        if (order.status !== 'pending') {
          throw new Error(`Order status is ${order.status}, expected 'pending'`);
        }

        const paidAt = new Date();
        const expiresAt = getEndOfMonthIstanbul(paidAt);

        // 2. Update order status to paid
        const [updatedOrder] = await tx
          .update(orders)
          .set({
            status: 'paid',
            paypalOrderId,
            paidAt,
            expiresAt
          })
          .where(eq(orders.id, orderId))
          .returning();

        // 3. Update all order items with expiration date
        await tx
          .update(orderItems)
          .set({ expiresAt })
          .where(eq(orderItems.orderId, orderId));

        // 4. Get order items for credential assignment
        const orderItemsList = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        const assignedCredentials: any[] = [];

        // 5. Assign credentials for each order item
        for (const item of orderItemsList) {
          console.log(`Assigning ${item.qty} credentials for plan ${item.planId}`);
          
          // Get available credentials for this plan with row-level locking
          const availableCredentials = await tx
            .select()
            .from(credentialPools)
            .where(
              and(
                eq(credentialPools.planId, item.planId),
                eq(credentialPools.isAssigned, false)
              )
            )
            .limit(item.qty)
            .for('update'); // Row-level lock to prevent race conditions

          if (availableCredentials.length < item.qty) {
            throw new Error(
              `Insufficient credentials for plan ${item.planId}. Need ${item.qty}, available ${availableCredentials.length}`
            );
          }

          // Select credentials to assign
          const credentialsToAssign = availableCredentials.slice(0, item.qty);

          for (const credential of credentialsToAssign) {
            // 6. Update credential pool with assignment
            await tx
              .update(credentialPools)
              .set({
                isAssigned: true,
                assignedToOrderId: orderId,
                assignedToUserId: order.userId,
                assignedAt: paidAt,
                updatedAt: new Date()
              })
              .where(eq(credentialPools.id, credential.id));

            // 7. Create order credential record
            await tx
              .insert(orderCredentials)
              .values({
                orderId,
                credentialId: credential.id,
                deliveredAt: paidAt,
                expiresAt
              });

            assignedCredentials.push({
              id: credential.id,
              username: credential.username,
              password: credential.password,
              planId: credential.planId,
              assignedAt: paidAt,
              expiresAt
            });
          }
        }

        console.log(
          `✅ Payment completion processed successfully for order ${orderId}: ${assignedCredentials.length} credentials assigned`
        );

        // Send email notifications asynchronously (don't block the payment process)
        this.sendOrderNotifications(updatedOrder, orderItemsList, assignedCredentials).catch(error => {
          console.error('📧 Email notification failed for order:', orderId, error);
        });

        return {
          order: updatedOrder,
          assignedCredentials,
          success: true
        };
      });
    } catch (error) {
      console.error(`❌ Payment completion failed for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Send email notifications for order completion
   */
  private async sendOrderNotifications(order: any, orderItems: any[], assignedCredentials: any[]) {
    try {
      // Get user and ship details
      const [user, ships, plans] = await Promise.all([
        this.storage.getUserById(order.userId),
        this.storage.getShips(),
        this.storage.getPlans()
      ]);

      if (!user) {
        console.error('📧 User not found for order notifications:', order.userId);
        return;
      }

      // Get order details for email
      const orderItemsHtml = orderItems.map(item => {
        const ship = ships.find(s => s.id === item.shipId);
        const plan = plans.find(p => p.id === item.planId);
        const shipName = ship?.name || 'Bilinmeyen Gemi';
        const planName = plan?.name || 'Bilinmeyen Paket';
        const dataLimit = plan?.dataLimitGb || 0;
        const price = parseFloat(item.unitPriceUsd || '0');
        
        return `<li><strong>${shipName}</strong> - ${planName} (${dataLimit}GB) - $${price.toFixed(2)}</li>`;
      }).join('');

      const shipName = ships.find(s => s.id === orderItems[0]?.shipId)?.name || 'Bilinmeyen Gemi';

      // 1. Send order confirmation to customer
      const customerEmailSuccess = await emailService.sendEmail(
        user.email,
        'Sipariş Onayı - AdeGloba Starlink System',
        'order_confirm',
        {
          userName: user.full_name || user.username,
          orderNumber: order.id.substring(0, 8).toUpperCase(),
          orderItems: orderItemsHtml,
          totalAmount: parseFloat(order.totalUsd || '0').toFixed(2),
          dashboardUrl: process.env.BASE_URL || 'http://localhost:5000',
        }
      );

      console.log(`📧 Customer order confirmation email: ${customerEmailSuccess ? 'sent' : 'failed'} to ${user.email}`);

      // 2. Send admin notification
      const adminEmail = 'admin@adegloba.com'; // TODO: Make this configurable
      const adminEmailSuccess = await emailService.sendEmail(
        adminEmail,
        'Yeni Sipariş Bildirimi - AdeGloba Starlink System',
        'admin_new_order',
        {
          orderNumber: order.id.substring(0, 8).toUpperCase(),
          customerName: user.full_name || user.username,
          customerEmail: user.email,
          shipName,
          totalAmount: parseFloat(order.totalUsd || '0').toFixed(2),
          orderItems: orderItemsHtml,
          adminUrl: (process.env.BASE_URL || 'http://localhost:5000') + '/admin',
        }
      );

      console.log(`📧 Admin notification email: ${adminEmailSuccess ? 'sent' : 'failed'} to ${adminEmail}`);

    } catch (error) {
      console.error('📧 Error sending order notifications:', error);
    }
  }

  /**
   * Get translated order status for Turkish UI
   */
  getOrderStatusTurkish(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Beklemede',
      'paid': 'Ödendi',
      'completed': 'Tamamlandı',
      'failed': 'Başarısız',
      'refunded': 'İade Edildi',
      'expired': 'Süresi Doldu',
      'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
  }

  async getOrdersWithDetails(userId: string) {
    const orders = await this.storage.getOrdersByUser(userId);
    
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await this.storage.getOrderItems(order.id);
        const itemsWithDetails = await Promise.all(
          items.map(async (item: any) => {
            const [ships, plans] = await Promise.all([
              this.storage.getShips(),
              this.storage.getPlans()
            ]);
            
            const ship = ships.find(s => s.id === item.shipId);
            const plan = plans.find(p => p.id === item.planId);
            
            return {
              ...item,
              ship,
              plan
            };
          })
        );

        return {
          ...order,
          items: itemsWithDetails,
          daysRemaining: order.expiresAt ? 
            Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
            : null
        };
      })
    );

    return ordersWithDetails;
  }

  async getAllOrdersWithDetails() {
    const orders = await this.storage.getOrders();
    
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [user, items] = await Promise.all([
          this.storage.getUserById(order.userId),
          this.storage.getOrderItems(order.id)
        ]);

        const itemsWithDetails = await Promise.all(
          items.map(async (item: any) => {
            const [ships, plans] = await Promise.all([
              this.storage.getShips(),
              this.storage.getPlans()
            ]);
            
            const ship = ships.find(s => s.id === item.shipId);
            const plan = plans.find(p => p.id === item.planId);
            
            return {
              ...item,
              ship,
              plan
            };
          })
        );

        return {
          ...order,
          user,
          items: itemsWithDetails
        };
      })
    );

    return ordersWithDetails;
  }

  async getOrderWithDetails(orderId: string) {
    const order = await this.storage.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const [user, items] = await Promise.all([
      this.storage.getUserById(order.userId),
      this.storage.getOrderItems(order.id)
    ]);

    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const [ships, plans] = await Promise.all([
          this.storage.getShips(),
          this.storage.getPlans()
        ]);
        
        const ship = ships.find(s => s.id === item.shipId);
        const plan = plans.find(p => p.id === item.planId);
        
        return {
          ...item,
          ship,
          plan
        };
      })
    );

    return {
      ...order,
      user,
      items: itemsWithDetails,
      plan: itemsWithDetails[0]?.plan || null,
      ship: itemsWithDetails[0]?.ship || null
    };
  }

  async getRecentOrders(limit: number) {
    return this.storage.getRecentOrders(limit);
  }

  /**
   * Find orders with status='paid' but missing paid_at or expires_at
   * These are incomplete payment completions that need to be fixed
   */
  async findIncompletePaidOrders(): Promise<any[]> {
    try {
      const incompleteOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.status, 'paid'),
            or(
              isNull(orders.paidAt),
              isNull(orders.expiresAt)
            )
          )
        );
      
      console.log(`Found ${incompleteOrders.length} incomplete paid orders`);
      return incompleteOrders;
    } catch (error) {
      console.error('Error finding incomplete paid orders:', error);
      return [];
    }
  }

  /**
   * Fix incomplete paid orders by updating missing timestamps
   * This handles orders that have status='paid' and credentials assigned but missing paid_at/expires_at
   */
  async fixIncompletePaidOrder(orderId: string): Promise<{ success: boolean; message: string; order?: any }> {
    try {
      return await db.transaction(async (tx) => {
        // Get order details
        const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
        
        if (!order) {
          return { success: false, message: `Order ${orderId} not found` };
        }
        
        if (order.status !== 'paid') {
          return { success: false, message: `Order ${orderId} status is '${order.status}', not 'paid'` };
        }
        
        // Check if already complete
        if (order.paidAt && order.expiresAt) {
          return { success: true, message: `Order ${orderId} is already complete`, order };
        }
        
        // Check if credentials are assigned
        const assignedCredentials = await tx
          .select()
          .from(credentialPools)
          .where(
            and(
              eq(credentialPools.assignedToOrderId, orderId),
              eq(credentialPools.isAssigned, true)
            )
          );
        
        if (assignedCredentials.length === 0) {
          return { success: false, message: `Order ${orderId} has no assigned credentials. Use processPaymentCompletion instead.` };
        }
        
        // Use earliest credential assignment date or current time for paid_at
        const earliestAssignedAt = assignedCredentials
          .map(c => c.assignedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
        
        const paidAt = earliestAssignedAt ? new Date(earliestAssignedAt) : new Date();
        const expiresAt = getEndOfMonthIstanbul(paidAt);
        
        // Update order with missing timestamps
        const [updatedOrder] = await tx
          .update(orders)
          .set({
            paidAt: order.paidAt || paidAt,
            expiresAt: order.expiresAt || expiresAt,
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId))
          .returning();
        
        // Update order items with expiration date if missing
        await tx
          .update(orderItems)
          .set({ 
            expiresAt: expiresAt,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(orderItems.orderId, orderId),
              isNull(orderItems.expiresAt)
            )
          );
        
        // Update credential pools if assignedAt is missing
        await tx
          .update(credentialPools)
          .set({
            assignedAt: paidAt,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(credentialPools.assignedToOrderId, orderId),
              isNull(credentialPools.assignedAt)
            )
          );
        
        // Ensure order credentials records exist
        for (const credential of assignedCredentials) {
          const [existingOrderCredential] = await tx
            .select()
            .from(orderCredentials)
            .where(
              and(
                eq(orderCredentials.orderId, orderId),
                eq(orderCredentials.credentialId, credential.id)
              )
            );
          
          if (!existingOrderCredential) {
            await tx
              .insert(orderCredentials)
              .values({
                orderId,
                credentialId: credential.id,
                deliveredAt: paidAt,
                expiresAt
              });
          }
        }
        
        console.log(
          `✅ Fixed incomplete paid order ${orderId}: set paidAt=${paidAt.toISOString()}, expiresAt=${expiresAt.toISOString()}`
        );
        
        return {
          success: true,
          message: `Order ${orderId} completion fixed successfully. ${assignedCredentials.length} credentials confirmed.`,
          order: updatedOrder
        };
      });
    } catch (error) {
      console.error(`❌ Failed to fix incomplete paid order ${orderId}:`, error);
      return {
        success: false,
        message: `Failed to fix order ${orderId}: ${error.message}`
      };
    }
  }

  /**
   * Process all incomplete paid orders in batch
   */
  async fixAllIncompletePaidOrders(): Promise<{ 
    processed: number; 
    fixed: number; 
    errors: { orderId: string; error: string }[]; 
    results: any[]
  }> {
    const incompleteOrders = await this.findIncompletePaidOrders();
    const results = [];
    const errors = [];
    let fixed = 0;
    
    console.log(`🔧 Processing ${incompleteOrders.length} incomplete paid orders...`);
    
    for (const order of incompleteOrders) {
      try {
        const result = await this.fixIncompletePaidOrder(order.id);
        results.push(result);
        
        if (result.success) {
          fixed++;
          console.log(`✅ Fixed order ${order.id}`);
        } else {
          errors.push({ orderId: order.id, error: result.message });
          console.log(`❌ Failed to fix order ${order.id}: ${result.message}`);
        }
      } catch (error) {
        errors.push({ orderId: order.id, error: error.message });
        console.log(`❌ Error processing order ${order.id}:`, error);
      }
    }
    
    console.log(`🔧 Batch completion: ${fixed}/${incompleteOrders.length} orders fixed`);
    
    return {
      processed: incompleteOrders.length,
      fixed,
      errors,
      results
    };
  }
}
