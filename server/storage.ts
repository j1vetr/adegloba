import {
  users,
  ships,
  plans,
  shipPlans,
  coupons,
  orders,
  orderItems,
  settings,
  type User,
  type InsertUser,
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
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (internal authentication)
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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
    const [newShip] = await db.insert(ships).values(ship).returning();
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
