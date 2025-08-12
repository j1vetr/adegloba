import { storage } from "../storage";
import type { IStorage } from "../storage";
import { ExpiryService } from "./expiryService";
import { CouponService } from "./couponService";

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
      } catch (error) {
        throw new Error(`Invalid coupon: ${error.message}`);
      }
    }

    const total = subtotal - discount;
    const expiryDate = this.expiryService.calculateEndOfMonthExpiry();

    // Create order
    const order = await this.storage.createOrder({
      userId,
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

    const expiryDate = this.expiryService.calculateEndOfMonthExpiry();

    return this.storage.updateOrder(orderId, {
      status: 'paid',
      paypalOrderId,
      paidAt: new Date(),
      expiresAt: expiryDate
    });
  }

  async getOrdersWithDetails(userId: string) {
    const orders = await this.storage.getOrdersByUser(userId);
    
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await this.storage.getOrderItems(order.id);
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
          this.storage.getUser(order.userId),
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
      this.storage.getUser(order.userId),
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
