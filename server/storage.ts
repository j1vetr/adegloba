import {
  users,
  admin_users,
  ships,
  plans,
  credentialPools,
  coupons,
  orders,
  orderItems,
  orderCredentials,
  settings,
  systemLogs,
  tickets,
  ticketMessages,
  ticketAttachments,
  type User,
  type InsertUser,
  type AdminUser,
  type InsertAdminUser,
  type Ship,
  type InsertShip,
  type Plan,
  type InsertPlan,
  type CredentialPool,
  type InsertCredentialPool,
  type Coupon,
  type InsertCoupon,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderCredential,
  type InsertOrderCredential,
  type Setting,
  type InsertSetting,
  type Ticket,
  type InsertTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type TicketAttachment,
  type InsertTicketAttachment,
  type SystemLog,
  type InsertSystemLog,
  cartItems,
  type CartItem,
  type InsertCartItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, isNull, isNotNull, gte, lte, or, gt, lt } from "drizzle-orm";

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
  getAllUsersWithShips(): Promise<any[]>;
  updateUser(id: string, data: any): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
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

  // Credential Pool operations
  getCredentialPoolsByShip(shipId: string): Promise<CredentialPool[]>;
  getAvailableCredentials(shipId: string): Promise<CredentialPool[]>;
  createCredentialPool(credential: InsertCredentialPool): Promise<CredentialPool>;
  createCredentialPoolBatch(credentials: InsertCredentialPool[]): Promise<CredentialPool[]>;
  assignCredentialToOrder(orderId: string, shipId: string): Promise<CredentialPool | null>;
  unassignCredential(credentialId: string): Promise<void>;
  deleteCredential(id: string): Promise<void>;

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
  getAllSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | null>;
  upsertSetting(key: string, value: string, category?: string): Promise<Setting>;

  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketsByUserId(userId: string): Promise<Ticket[]>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketById(ticketId: string): Promise<Ticket | null>;
  updateTicketStatus(ticketId: string, status: string, adminId?: string): Promise<Ticket | null>;
  updateTicketPriority(ticketId: string, priority: string): Promise<Ticket | null>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  getUnreadTicketCount(userId: string): Promise<number>;

  // Statistics
  getOrderStats(): Promise<{ totalRevenue: number; activeOrders: number; totalOrders: number }>;
  
  // System logs operations
  createSystemLog(logData: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(options?: {
    page?: number;
    pageSize?: number;
    category?: string;
    action?: string;
    search?: string;
  }): Promise<any[]>;
  deleteOldLogs(cutoffDate: Date): Promise<number>;

  // Cart operations
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, planId: string, quantity?: number): Promise<CartItem>;
  updateCartItem(userId: string, planId: string, quantity: number): Promise<CartItem>;
  removeFromCart(userId: string, planId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  getCartTotal(userId: string): Promise<{ subtotal: number; total: number; itemCount: number }>;
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

  async getUserWithShip(userId: string): Promise<(User & { ship?: Ship }) | undefined> {
    const [result] = await db
      .select({
        user: users,
        ship: ships
      })
      .from(users)
      .leftJoin(ships, eq(users.ship_id, ships.id))
      .where(eq(users.id, userId));
    
    if (!result) return undefined;
    
    return {
      ...result.user,
      ship: result.ship || undefined
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        email: userData.email,
        password_hash: userData.password_hash,
        ship_id: userData.ship_id,
        address: userData.address
      })
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
      .from(plans)
      .where(and(eq(plans.shipId, shipId), eq(plans.isActive, true)))
      .orderBy(plans.sortOrder);
    
    return results;
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

  async getAllUsers(): Promise<any[]> {
    return db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        full_name: users.full_name,
        ship_id: users.ship_id,
        ship: {
          id: ships.id,
          name: ships.name,
          slug: ships.slug,
          kitNumber: ships.kitNumber,
        }
      })
      .from(users)
      .leftJoin(ships, eq(users.ship_id, ships.id))
      .orderBy(users.username);
  }

  async getAllUsersWithShips(): Promise<any[]> {
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        full_name: users.full_name,
        shipId: users.ship_id,
        created_at: users.created_at,
        ship: ships
      })
      .from(users)
      .leftJoin(ships, eq(users.ship_id, ships.id))
      .orderBy(desc(users.created_at));
    
    return results;
  }

  async updateUser(id: string, data: any): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          ship_id: data.ship_id,
        })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
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
      .set({
        name: ship.name,
        slug: ship.slug,
        kitNumber: ship.kitNumber,
        isActive: ship.isActive
      })
      .where(eq(ships.id, id))
      .returning();
    return updatedShip;
  }

  async deleteShip(id: string): Promise<void> {
    await db.delete(ships).where(eq(ships.id, id));
  }

  // Plan operations
  async getPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder, plans.name);
  }

  async getAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder, plans.name);
  }

  async getActivePlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder, plans.name);
  }

  async getPlansForShip(shipId: string): Promise<Plan[]> {
    return db
      .select()
      .from(plans)
      .where(and(eq(plans.shipId, shipId), eq(plans.isActive, true)))
      .orderBy(plans.sortOrder, plans.name);
  }

  async getPlansByShip(shipId: string): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.shipId, shipId)).orderBy(plans.sortOrder, plans.name);
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

  // Package-specific credential operations
  async getCredentialsForPlan(planId: string): Promise<CredentialPool[]> {
    return db.select().from(credentialPools).where(eq(credentialPools.planId, planId)).orderBy(credentialPools.createdAt);
  }

  async getAvailableCredentialsForPlan(planId: string): Promise<CredentialPool[]> {
    return db.select().from(credentialPools)
      .where(and(eq(credentialPools.planId, planId), eq(credentialPools.isAssigned, false)))
      .orderBy(credentialPools.createdAt);
  }

  async createCredentialForPlan(credential: InsertCredentialPool): Promise<CredentialPool> {
    const [newCredential] = await db.insert(credentialPools).values(credential).returning();
    return newCredential;
  }

  async assignCredentialToOrder(credentialId: string, orderId: string, userId: string): Promise<CredentialPool | undefined> {
    const [updatedCredential] = await db
      .update(credentialPools)
      .set({
        isAssigned: true,
        assignedToOrderId: orderId,
        assignedToUserId: userId,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(credentialPools.id, credentialId), eq(credentialPools.isAssigned, false)))
      .returning();
    return updatedCredential;
  }

  async deliverCredentialsForOrder(orderId: string, planId: string, quantity: number): Promise<CredentialPool[]> {
    // Get available credentials for the plan
    const availableCredentials = await this.getAvailableCredentialsForPlan(planId);
    
    if (availableCredentials.length < quantity) {
      throw new Error(`Not enough credentials available for plan. Need ${quantity}, have ${availableCredentials.length}`);
    }

    const credentialsToDeliver = availableCredentials.slice(0, quantity);
    const deliveredCredentials: CredentialPool[] = [];

    // Get order details to get user ID
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    for (const credential of credentialsToDeliver) {
      // Assign credential to order
      const assignedCredential = await this.assignCredentialToOrder(credential.id, orderId, order.userId);
      if (assignedCredential) {
        deliveredCredentials.push(assignedCredential);
        
        // Create delivery record
        await db.insert(orderCredentials).values({
          orderId,
          credentialId: credential.id,
        });
      }
    }

    return deliveredCredentials;
  }

  async getOrderCredentials(orderId: string): Promise<Array<CredentialPool & { deliveredAt: Date }>> {
    const results = await db
      .select({
        id: credentialPools.id,
        planId: credentialPools.planId,
        username: credentialPools.username,
        password: credentialPools.password,
        isAssigned: credentialPools.isAssigned,
        assignedToOrderId: credentialPools.assignedToOrderId,
        assignedToUserId: credentialPools.assignedToUserId,
        assignedAt: credentialPools.assignedAt,
        createdAt: credentialPools.createdAt,
        updatedAt: credentialPools.updatedAt,
        deliveredAt: orderCredentials.deliveredAt,
      })
      .from(orderCredentials)
      .innerJoin(credentialPools, eq(orderCredentials.credentialId, credentialPools.id))
      .where(eq(orderCredentials.orderId, orderId))
      .orderBy(orderCredentials.deliveredAt);

    return results.map(r => ({
      ...r,
      deliveredAt: r.deliveredAt!,
    }));
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

  async deleteOrderItemsByOrderId(orderId: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.rowCount > 0;
  }

  // Settings operations
  async setSetting(key: string, value: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value, category: 'general' })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value }
      })
      .returning();
    return setting;
  }

  async upsertSetting(key: string, value: string, category: string = 'general'): Promise<Setting> {
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

  // User admin operations
  async getAllUsers(): Promise<(User & { ship?: Ship })[]> {
    const result = await db
      .select({
        user: users,
        ship: ships
      })
      .from(users)
      .leftJoin(ships, eq(users.ship_id, ships.id))
      .orderBy(desc(users.created_at));
      
    return result.map(row => ({
      ...row.user,
      ship: row.ship || undefined
    }));
  }

  async getRecentUsers(limit: number): Promise<(User & { ship?: Ship })[]> {
    const result = await db
      .select({
        user: users,
        ship: ships
      })
      .from(users)
      .leftJoin(ships, eq(users.ship_id, ships.id))
      .orderBy(desc(users.created_at))
      .limit(limit);
      
    return result.map(row => ({
      ...row.user,
      ship: row.ship || undefined
    }));
  }

  async getRecentOrders(limit: number): Promise<(Order & { user?: User })[]> {
    const result = await db
      .select({
        order: orders,
        user: users
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
      
    return result.map(row => ({
      ...row.order,
      user: row.user || undefined
    }));
  }

  // Order admin operations
  async getAllOrders(): Promise<(Order & { user?: User })[]> {
    const result = await db
      .select({
        order: orders,
        user: users
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
      
    return result.map(row => ({
      ...row.order,
      user: row.user || undefined
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

  async getSetting(key: string): Promise<Setting | null> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || null;
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





  // Ticket system implementation
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values({
      userId: ticketData.userId,
      shipId: ticketData.shipId,
      subject: ticketData.subject,
      priority: ticketData.priority,
      status: ticketData.status,
      assignedAdminId: ticketData.assignedAdminId
    }).returning();
    
    // Create initial message for the ticket
    await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      senderType: 'user',
      senderId: ticketData.userId,
      message: ticketData.message
    });
    
    return ticket;
  }



  async getTicketsByUserId(userId: string): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(desc(tickets.createdAt));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getAllTicketsWithUserInfo(): Promise<any[]> {
    return db.select({
      id: tickets.id,
      subject: tickets.subject,
      priority: tickets.priority,
      status: tickets.status,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      userId: tickets.userId,
      shipId: tickets.shipId,
      assignedAdminId: tickets.assignedAdminId,
      userName: users.username,
      userEmail: users.email,
      userFullName: users.full_name,
      shipName: ships.name,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .leftJoin(ships, eq(tickets.shipId, ships.id))
    .orderBy(desc(tickets.updatedAt));
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
    return ticket || null;
  }

  async getTicketWithUserInfo(ticketId: string): Promise<any | null> {
    const [ticket] = await db.select({
      id: tickets.id,
      subject: tickets.subject,
      priority: tickets.priority,
      status: tickets.status,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      userId: tickets.userId,
      shipId: tickets.shipId,
      assignedAdminId: tickets.assignedAdminId,
      userName: users.username,
      userEmail: users.email,
      userFullName: users.full_name,
      shipName: ships.name,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .leftJoin(ships, eq(tickets.shipId, ships.id))
    .where(eq(tickets.id, ticketId));
    
    return ticket || null;
  }

  async updateTicketStatus(ticketId: string, status: string, adminId?: string): Promise<Ticket | null> {
    const updateData: any = { status, updatedAt: new Date() };
    if (adminId) {
      updateData.assignedAdminId = adminId;
    }

    const [ticket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();
    
    return ticket || null;
  }

  async updateTicketPriority(ticketId: string, priority: string): Promise<Ticket | null> {
    const [ticket] = await db
      .update(tickets)
      .set({ priority, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId))
      .returning();
    
    return ticket || null;
  }

  async createTicketMessage(messageData: InsertTicketMessage): Promise<TicketMessage> {
    const [message] = await db.insert(ticketMessages).values(messageData).returning();
    return message;
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async getUnreadTicketCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(tickets)
      .where(and(
        eq(tickets.userId, userId),
        eq(tickets.status, 'Açık')
      ));
    return Number(result[0]?.count || 0);
  }

  // Credential Pool operations
  async getCredentialPoolsByShip(shipId: string): Promise<CredentialPool[]> {
    return db.select().from(credentialPools)
      .where(eq(credentialPools.shipId, shipId))
      .orderBy(credentialPools.createdAt);
  }

  async getAvailableCredentials(shipId: string): Promise<CredentialPool[]> {
    return db.select().from(credentialPools)
      .where(and(
        eq(credentialPools.shipId, shipId),
        eq(credentialPools.isAssigned, false)
      ))
      .orderBy(credentialPools.createdAt);
  }

  async createCredentialPool(credential: InsertCredentialPool): Promise<CredentialPool> {
    const [result] = await db.insert(credentialPools).values(credential).returning();
    return result;
  }

  async createCredentialPoolBatch(credentials: InsertCredentialPool[]): Promise<CredentialPool[]> {
    return db.insert(credentialPools).values(credentials).returning();
  }

  async assignCredentialToOrder(orderId: string, shipId: string): Promise<CredentialPool | null> {
    // Get the order to check its ship
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return null;

    // Find an available credential for the ship
    const [credential] = await db.select().from(credentialPools)
      .where(and(
        eq(credentialPools.shipId, shipId),
        eq(credentialPools.isAssigned, false)
      ))
      .limit(1);

    if (!credential) return null;

    // Assign the credential
    const [assignedCredential] = await db.update(credentialPools)
      .set({
        isAssigned: true,
        assignedToOrderId: orderId,
        assignedAt: new Date()
      })
      .where(eq(credentialPools.id, credential.id))
      .returning();

    // Update the order with the assigned credential
    await db.update(orders)
      .set({ assignedCredentialId: assignedCredential.id })
      .where(eq(orders.id, orderId));

    return assignedCredential;
  }

  async unassignCredential(credentialId: string): Promise<void> {
    const [credential] = await db.update(credentialPools)
      .set({
        isAssigned: false,
        assignedToOrderId: null,
        assignedAt: null
      })
      .where(eq(credentialPools.id, credentialId))
      .returning();

    // Also update any orders that had this credential assigned
    if (credential) {
      await db.update(orders)
        .set({ assignedCredentialId: null })
        .where(eq(orders.assignedCredentialId, credentialId));
    }
  }

  async deleteCredential(id: string): Promise<void> {
    await db.delete(credentialPools).where(eq(credentialPools.id, id));
  }
  // Enhanced User Management Methods
  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getUser(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getAllCredentials(): Promise<CredentialPool[]> {
    return db.select().from(credentialPools).orderBy(credentialPools.createdAt);
  }

  async getCredentialsForPlan(planId: string): Promise<CredentialPool[]> {
    return db.select().from(credentialPools).where(eq(credentialPools.planId, planId));
  }

  async getUsersWithOrderStats(): Promise<Array<User & { ship: Ship | undefined; orderStats: { totalOrders: number; totalAmountPaid: number; lastOrderDate: string | null } }>> {
    const allUsers = await db.select().from(users).orderBy(users.created_at);
    const allShips = await db.select().from(ships);
    const allOrders = await db.select().from(orders);

    return allUsers.map(user => {
      const ship = allShips.find(s => s.id === user.ship_id);
      const userOrders = allOrders.filter(o => o.userId === user.id && o.status === 'paid');
      
      const totalAmountPaid = userOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const lastOrderDate = userOrders.length > 0 
        ? userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      return {
        ...user,
        ship,
        orderStats: {
          totalOrders: userOrders.length,
          totalAmountPaid,
          lastOrderDate,
        }
      };
    });
  }

  async getUserOrderHistory(userId: string): Promise<Array<Order & { orderItems: OrderItem[]; ship: Ship | undefined; totalAmount: number }>> {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(orders.createdAt);
    const allOrderItems = await db.select().from(orderItems);
    const allShips = await db.select().from(ships);

    return userOrders.map(order => {
      const items = allOrderItems.filter(item => item.orderId === order.id);
      const ship = allShips.find(s => s.id === order.shipId);
      
      return {
        ...order,
        orderItems: items,
        ship,
        totalAmount: parseFloat(order.totalAmount),
      };
    });
  }

  // System logs implementation
  async createSystemLog(logData: InsertSystemLog): Promise<SystemLog> {
    const [log] = await db.insert(systemLogs).values(logData).returning();
    return log;
  }

  async getSystemLogs(options?: {
    page?: number;
    pageSize?: number;
    category?: string;
    action?: string;
    search?: string;
  }): Promise<any[]> {
    const { page = 1, pageSize = 50, category, action, search } = options || {};
    const offset = (page - 1) * pageSize;

    let query = db
      .select({
        id: systemLogs.id,
        category: systemLogs.category,
        action: systemLogs.action,
        userId: systemLogs.userId,
        adminId: systemLogs.adminId,
        entityType: systemLogs.entityType,
        entityId: systemLogs.entityId,
        details: systemLogs.details,
        ipAddress: systemLogs.ipAddress,
        userAgent: systemLogs.userAgent,
        createdAt: systemLogs.createdAt,
        userName: users.username,
        adminName: admin_users.username,
      })
      .from(systemLogs)
      .leftJoin(users, eq(systemLogs.userId, users.id))
      .leftJoin(admin_users, eq(systemLogs.adminId, admin_users.id));

    if (category && category !== 'all') {
      query = query.where(eq(systemLogs.category, category));
    }

    if (action && action !== 'all') {
      query = query.where(eq(systemLogs.action, action));
    }

    if (search) {
      query = query.where(
        or(
          sql`${systemLogs.action} ILIKE ${'%' + search + '%'}`,
          sql`${users.username} ILIKE ${'%' + search + '%'}`,
          sql`${admin_users.username} ILIKE ${'%' + search + '%'}`,
          sql`${systemLogs.ipAddress} ILIKE ${'%' + search + '%'}`
        )
      );
    }

    return query
      .orderBy(desc(systemLogs.createdAt))
      .limit(pageSize)
      .offset(offset);
  }

  async deleteOldLogs(cutoffDate: Date): Promise<number> {
    const result = await db
      .delete(systemLogs)
      .where(lt(systemLogs.createdAt, cutoffDate));
    
    return result.rowCount || 0;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItem[]> {
    const items = await db
      .select({
        cartItem: cartItems,
        plan: plans,
      })
      .from(cartItems)
      .leftJoin(plans, eq(cartItems.planId, plans.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(cartItems.createdAt);

    return items.map(item => ({
      ...item.cartItem,
      plan: item.plan
    })) as CartItem[];
  }

  async addToCart(userId: string, planId: string, quantity: number = 1): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.planId, planId)));

    if (existingItem) {
      // Update existing item quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date()
        })
        .where(and(eq(cartItems.userId, userId), eq(cartItems.planId, planId)))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db
        .insert(cartItems)
        .values({
          userId,
          planId,
          quantity
        })
        .returning();
      return newItem;
    }
  }

  async updateCartItem(userId: string, planId: string, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date()
      })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.planId, planId)))
      .returning();
    return updatedItem;
  }

  async removeFromCart(userId: string, planId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.planId, planId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  async getCartTotal(userId: string): Promise<{ subtotal: number; total: number; itemCount: number }> {
    const items = await db
      .select({
        quantity: cartItems.quantity,
        price: plans.priceUsd,
      })
      .from(cartItems)
      .leftJoin(plans, eq(cartItems.planId, plans.id))
      .where(eq(cartItems.userId, userId));

    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      const price = parseFloat(item.price || '0');
      subtotal += price * item.quantity;
      itemCount += item.quantity;
    }

    return {
      subtotal,
      total: subtotal, // No tax for now
      itemCount
    };
  }
}

export const storage = new DatabaseStorage();
