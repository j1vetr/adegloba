import { storage } from "../storage";
import type { IStorage } from "../storage";
import { ExpiryService } from "./expiryService";
import { CouponService } from "./couponService";
import { getEndOfMonthIstanbul } from "../utils/dateUtils";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
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
}
