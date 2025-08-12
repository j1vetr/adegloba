import {
  users,
  admin_users,
  ships,
  plans,
  shipPlans,
  coupons,
  orders,
  orderItems,
  settings,
  type User,
  type InsertUser,
  type AdminUser,
  type InsertAdminUser,
  type Ship,
  type InsertShip,
  type Plan,
  type InsertPlan,
  type ShipPlan,
  type InsertShipPlan,
  type Coupon,
  type InsertCoupon,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, isNull, isNotNull, gte, lte, or, gt } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (internal authentication)  
  getUserById(id: string): Promise<User | undefined>;
  getUserWithShip(id: string): Promise<(User & { ship?: Ship }) | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]>;
  getUserActivePackages(userId: string): Promise<any[]>;
  getShipPlans(shipId: string): Promise<Plan[]>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<(User & { ship?: Ship })[]>;
  getRecentUsers(limit: number): Promise<(User & { ship?: Ship })[]>;
  getRecentOrders(limit: number): Promise<(Order & { user?: User })[]>;
  
  // Admin User operations
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

  // Ship operations
  getShips(): Promise<Ship[]>;
  getAllShips(): Promise<Ship[]>;
  getActiveShips(): Promise<Ship[]>;
  getShipBySlug(slug: string): Promise<Ship | undefined>;
  createShip(ship: InsertShip): Promise<Ship>;
  updateShip(id: string, ship: Partial<InsertShip>): Promise<Ship | undefined>;
  deleteShip(id: string): Promise<void>;

  // Plan operations
  getPlans(): Promise<Plan[]>;
  getAllPlans(): Promise<Plan[]>;
  getActivePlans(): Promise<Plan[]>;
  getPlansForShip(shipId: string): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: string, plan: Partial<InsertPlan>): Promise<Plan | undefined>;
  deletePlan(id: string): Promise<void>;

  // Ship-Plan relations
  assignPlanToShip(shipId: string, planId: string, isActive?: boolean, sortOrder?: number): Promise<ShipPlan>;
  updateShipPlan(shipId: string, planId: string, updates: Partial<InsertShipPlan>): Promise<void>;
  removeShipPlan(shipId: string, planId: string): Promise<void>;

  // Coupon operations
  getCoupons(): Promise<Coupon[]>;
  getAllCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Order Item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  
  // User admin operations
  getAllUsers(): Promise<(User & { ship?: Ship })[]>;
  getRecentUsers(limit: number): Promise<(User & { ship?: Ship })[]>;
  getRecentOrders(limit: number): Promise<(Order & { user?: User })[]>;
  
  // Order admin operations
  getAllOrders(): Promise<(Order & { user?: User })[]>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;

  // Settings operations
  getAllSettings(): Promise<Setting[]>;

  // Statistics
  getOrderStats(): Promise<{ totalRevenue: number; activeOrders: number; totalOrders: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (internal authentication)
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserWithShip(id: string): Promise<any> {
    const [result] = await db
      .select()
      .from(users)
      .leftJoin(ships, eq(users.ship_id, ships.id))
      .where(eq(users.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.users,
      ship: result.ships
    };
  }

  async getShipPlans(shipId: string): Promise<Plan[]> {
    const results = await db
      .select()
      .from(shipPlans)
      .innerJoin(plans, eq(shipPlans.planId, plans.id))
      .where(and(eq(shipPlans.shipId, shipId), eq(shipPlans.isActive, true), eq(plans.isActive, true)))
      .orderBy(shipPlans.sortOrder, plans.sortOrder);
    
    return results.map(r => r.plans);
  }

  async getUserOrders(userId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(plans, eq(orderItems.planId, plans.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    // Group order items by order
    const ordersMap = new Map();
    results.forEach(r => {
      if (!ordersMap.has(r.orders.id)) {
        ordersMap.set(r.orders.id, {
          ...r.orders,
          orderItems: []
        });
      }
      if (r.order_items) {
        ordersMap.get(r.orders.id).orderItems.push({
          ...r.order_items,
          plan: r.plans
        });
      }
    });
    
    return Array.from(ordersMap.values());
  }

  async getUserActivePackages(userId: string): Promise<any[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(plans, eq(orderItems.planId, plans.id))
      .where(and(
        eq(orders.userId, userId),
        isNotNull(orders.paidAt),
        gt(orders.expiresAt, now)
      ))
      .orderBy(desc(orders.expiresAt));
    
    return results.map(r => ({
      ...r.plans,
      expiresAt: r.orders.expiresAt
    }));
  }

  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(admin_users).where(eq(admin_users.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(admin_users).where(eq(admin_users.username, username));
    return user;
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db
      .insert(admin_users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Ship operations
  async getShips(): Promise<Ship[]> {
    return db.select().from(ships).orderBy(ships.name);
  }

  async getAllShips(): Promise<Ship[]> {
    return db.select().from(ships).orderBy(ships.name);
  }

  async getActiveShips(): Promise<Ship[]> {
    return db.select().from(ships).where(eq(ships.isActive, true)).orderBy(ships.name);
  }

  async getShipBySlug(slug: string): Promise<Ship | undefined> {
    const [ship] = await db.select().from(ships).where(eq(ships.slug, slug));
    return ship;
  }

  async createShip(ship: InsertShip): Promise<Ship> {
    const [newShip] = await db.insert(ships).values({
      ...ship,
      sortOrder: ship.sortOrder || 0
    }).returning();
    return newShip;
  }

  async updateShip(id: string, ship: Partial<InsertShip>): Promise<Ship | undefined> {
    const [updatedShip] = await db
      .update(ships)
      .set({ ...ship, updatedAt: new Date() })
      .where(eq(ships.id, id))
      .returning();
    return updatedShip;
  }

  async deleteShip(id: string): Promise<void> {
    await db.delete(ships).where(eq(ships.id, id));
  }

  // Plan operations
  async getPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder, plans.title);
  }

  async getAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder, plans.title);
  }

  async getActivePlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder, plans.title);
  }

  async getPlansForShip(shipId: string): Promise<Plan[]> {
    return db
      .select({
        id: plans.id,
        title: plans.title,
        gbAmount: plans.gbAmount,
        speedNote: plans.speedNote,
        validityNote: plans.validityNote,
        priceUsd: plans.priceUsd,
        isActive: plans.isActive,
        sortOrder: plans.sortOrder,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      })
      .from(plans)
      .innerJoin(shipPlans, eq(plans.id, shipPlans.planId))
      .where(and(eq(shipPlans.shipId, shipId), eq(shipPlans.isActive, true)))
      .orderBy(shipPlans.sortOrder, plans.title);
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: string, plan: Partial<InsertPlan>): Promise<Plan | undefined> {
    const [updatedPlan] = await db
      .update(plans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    await db.delete(plans).where(eq(plans.id, id));
  }

  // Ship-Plan relations
  async assignPlanToShip(shipId: string, planId: string, isActive: boolean = true, sortOrder: number = 0): Promise<ShipPlan> {
    const [shipPlan] = await db
      .insert(shipPlans)
      .values({ shipId, planId, isActive, sortOrder })
      .onConflictDoUpdate({
        target: [shipPlans.shipId, shipPlans.planId],
        set: { isActive, sortOrder }
      })
      .returning();
    return shipPlan;
  }

  async updateShipPlan(shipId: string, planId: string, updates: Partial<InsertShipPlan>): Promise<void> {
    await db
      .update(shipPlans)
      .set(updates)
      .where(and(eq(shipPlans.shipId, shipId), eq(shipPlans.planId, planId)));
  }

  async removeShipPlan(shipId: string, planId: string): Promise<void> {
    await db
      .delete(shipPlans)
      .where(and(eq(shipPlans.shipId, shipId), eq(shipPlans.planId, planId)));
  }

  // Coupon operations
  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values(coupon).returning();
    return newCoupon;
  }

  async updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [updatedCoupon] = await db
      .update(coupons)
      .set({ ...coupon, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return updatedCoupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value }
      })
      .returning();
    return setting;
  }

  // User admin operations
  async getAllUsers(): Promise<(User & { ship?: Ship })[]> {
    return db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        shipId: users.shipId,
        created_at: users.createdAt,
        ship: {
          id: ships.id,
          name: ships.name,
          slug: ships.slug,
        }
      })
      .from(users)
      .leftJoin(ships, eq(users.shipId, ships.id))
      .orderBy(desc(users.createdAt));
  }

  async getAllUsers(): Promise<(User & { ship?: Ship })[]> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(ships, eq(users.shipId, ships.id))
      .orderBy(desc(users.createdAt));
      
    return result.map(row => ({
      ...row.users,
      ship: row.ships || undefined
    }));
  }

  async getRecentUsers(limit: number): Promise<(User & { ship?: Ship })[]> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(ships, eq(users.shipId, ships.id))
      .orderBy(desc(users.createdAt))
      .limit(limit);
      
    return result.map(row => ({
      ...row.users,
      ship: row.ships || undefined
    }));
  }

  async getRecentOrders(limit: number): Promise<(Order & { user?: User })[]> {
    const result = await db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
      
    return result.map(row => ({
      ...row.orders,
      user: row.users || undefined
    }));
  }

  // Order admin operations
  async getAllOrders(): Promise<(Order & { user?: User })[]> {
    const result = await db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
      
    return result.map(row => ({
      ...row.orders,
      user: row.users || undefined
    }));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: status as 'pending' | 'paid' | 'expired' | 'cancelled' })
      .where(eq(orders.id, orderId));
  }

  // Settings operations
  async getAllSettings(): Promise<Setting[]> {
    return db.select().from(settings).orderBy(settings.key);
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return db.select().from(settings).where(eq(settings.category, category)).orderBy(settings.key);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string, category: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value, category })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, category, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      // General Settings
      { key: 'SITE_NAME', value: 'AdeGloba Starlink System', category: 'general' },
      { key: 'CONTACT_EMAIL', value: 'info@adegloba.com', category: 'general' },
      { key: 'DEFAULT_LANGUAGE', value: 'tr', category: 'general' },
      { key: 'TIMEZONE', value: 'Europe/Istanbul', category: 'general' },
      { key: 'LOGO_URL', value: '', category: 'general' },
      
      // Payment Settings
      { key: 'PAYPAL_CLIENT_ID', value: '', category: 'payment' },
      { key: 'PAYPAL_CLIENT_SECRET', value: '', category: 'payment' },
      { key: 'PAYPAL_ENV', value: 'sandbox', category: 'payment' },
      
      // Support Settings
      { key: 'WHATSAPP_NUMBER', value: '', category: 'support' },
      { key: 'SUPPORT_EMAIL', value: 'destek@adegloba.com', category: 'support' },
      
      // Captive Portal Settings
      { key: 'CAPTIVE_LOGIN_URL', value: '', category: 'captive_portal' },
      { key: 'CAPTIVE_PORTAL_MODE', value: 'off', category: 'captive_portal' },
      { key: 'WALLED_GARDEN_HINT', value: '', category: 'captive_portal' },
      
      // RADIUS Settings
      { key: 'RADIUS_DB_HOST', value: '', category: 'radius' },
      { key: 'RADIUS_DB_PORT', value: '3306', category: 'radius' },
      { key: 'RADIUS_DB_USER', value: '', category: 'radius' },
      { key: 'RADIUS_DB_PASS', value: '', category: 'radius' },
      { key: 'RADIUS_DB_NAME', value: '', category: 'radius' }
    ];

    for (const setting of defaultSettings) {
      const existing = await this.getSetting(setting.key);
      if (!existing) {
        await db.insert(settings).values(setting);
      }
    }
  }

  // Statistics
  async getOrderStats(): Promise<{ totalRevenue: number; activeOrders: number; totalOrders: number }> {
    const [stats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'paid' THEN total_usd ELSE 0 END), 0)`,
        activeOrders: sql<number>`COUNT(CASE WHEN status = 'paid' AND expires_at > NOW() THEN 1 END)`,
        totalOrders: sql<number>`COUNT(*)`
      })
      .from(orders);

    return {
      totalRevenue: Number(stats.totalRevenue) || 0,
      activeOrders: Number(stats.activeOrders) || 0,
      totalOrders: Number(stats.totalOrders) || 0
    };
  }
}

export const storage = new DatabaseStorage();
