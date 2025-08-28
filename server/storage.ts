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
  emailSettings,
  emailLogs,
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
  type EmailSetting,
  type InsertEmailSetting,
  type EmailLog,
  type InsertEmailLog,
  cartItems,
  couponUsage,
  type CartItem,
  type InsertCartItem,
  type CouponUsage,
  type InsertCouponUsage,
} from "@shared/schema";
import { getDaysRemainingIstanbul, isExpiredIstanbul, getEndOfMonthIstanbul } from './utils/dateUtils';
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
  getUserExpiredPackages(userId: string, offset: number, pageSize: number): Promise<any[]>;
  getUserExpiredPackagesCount(userId: string): Promise<number>;
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
  getPlanById(id: string): Promise<Plan | undefined>;
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
  getCoupons(): Promise<any[]>;
  getAllCoupons(): Promise<any[]>;
  getCouponByCode(code: string): Promise<any | undefined>;
  getCouponById(id: string): Promise<any | undefined>;
  createCoupon(coupon: any): Promise<any>;
  updateCoupon(id: string, coupon: any): Promise<any | undefined>;
  deleteCoupon(id: string): Promise<void>;
  
  // Coupon usage operations
  createCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage>;
  getCouponUsageCount(couponId: string, userId?: string): Promise<number>;
  getCouponUsageCountForCompletedOrders(couponId: string): Promise<number>;
  getUserCouponUsage(userId: string, couponId: string): Promise<number>;
  getUserCouponUsageForCompletedOrders(userId: string, couponId: string): Promise<number>;

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
  getSettingsByCategory(category: string): Promise<Setting[]>;
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

  // Stock management operations
  getAvailableStock(planId: string): Promise<number>;
  getCredentialStats(planId: string): Promise<{ total: number; assigned: number; available: number }>;
  getAllCredentialStats(): Promise<{ [planId: string]: { total: number; assigned: number; available: number } }>;
  validateStockAvailability(planId: string, requestedQuantity: number): Promise<boolean>;
  reserveStock(planId: string, quantity: number, orderId: string): Promise<boolean>;
  getCredentialsForOrder(orderId: string): Promise<any[]>;

  // Statistics
  getOrderStats(): Promise<{ totalRevenue: number; activeUsers: number; activePackages: number; totalOrders: number; cancelledOrders: number; pendingOrders: number }>;
  getCancelledOrdersCount(): Promise<number>;
  getPendingOrdersCount(): Promise<number>;
  
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

  // Email operations
  getEmailSettings(): Promise<EmailSetting | null>;
  upsertEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting>;
  saveEmailSettings(settings: any): Promise<EmailSetting>;
  createEmailLog(logData: InsertEmailLog): Promise<EmailLog>;
  getEmailLogs(options?: {
    page?: number;
    pageSize?: number;
    status?: string;
    template?: string;
  }): Promise<{ logs: EmailLog[]; total: number }>;
  getOrdersByShipAndDateRange(shipId: string, startDate: Date, endDate: Date): Promise<Order[]>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

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
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    try {
      // Get active packages with assigned credentials
      const results = await db
        .select({
          credentialId: credentialPools.id,
          username: credentialPools.username,
          password: credentialPools.password,
          planName: plans.name,
          dataLimitGb: plans.dataLimitGb,
          assignedAt: credentialPools.assignedAt,
          orderId: orders.id,
          orderStatus: orders.status,
          paidAt: orders.paidAt,
          expiresAt: orders.expiresAt,
          createdAt: orders.createdAt
        })
        .from(credentialPools)
        .innerJoin(orders, eq(credentialPools.assignedToOrderId, orders.id))
        .innerJoin(plans, eq(credentialPools.planId, plans.id))
        .where(
          and(
            eq(credentialPools.assignedToUserId, userId),
            eq(credentialPools.isAssigned, true),
            or(
              eq(orders.status, 'paid'),
              eq(orders.status, 'completed')
            ),
            // Only include packages that haven't expired
            and(
              isNotNull(orders.expiresAt),
              gt(orders.expiresAt, new Date())
            )
          )
        )
        .orderBy(desc(orders.paidAt));

      console.log(`Found ${results.length} active packages for user ${userId}`);
      
      return results.map(r => {
        // Use the expires_at field directly (end of purchase month)
        const expirationDate = r.expiresAt ? new Date(r.expiresAt) : null;
        const daysRemaining = expirationDate ? getDaysRemainingIstanbul(expirationDate) : 0;
        
        return {
          credentialId: r.credentialId,
          username: r.username,
          password: r.password,
          planName: r.planName,
          dataLimitGb: r.dataLimitGb,
          assignedAt: r.assignedAt,
          paidAt: r.paidAt,
          expiresAt: expirationDate,
          expirationDate: expirationDate,
          daysRemaining: daysRemaining,
          orderStatus: r.orderStatus
        };
      });
    } catch (error) {
      console.error('Error fetching user active packages:', error);
      return [];
    }
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
      // Build update object dynamically to include only provided fields
      const updateObject: any = {};
      
      if (data.username !== undefined) updateObject.username = data.username;
      if (data.email !== undefined) updateObject.email = data.email;
      if (data.full_name !== undefined) updateObject.full_name = data.full_name;
      if (data.phone !== undefined) updateObject.phone = data.phone;
      if (data.ship_id !== undefined) updateObject.ship_id = data.ship_id;
      if (data.address !== undefined) updateObject.address = data.address;
      if (data.password_hash !== undefined) updateObject.password_hash = data.password_hash;
      
      const [updatedUser] = await db
        .update(users)
        .set(updateObject)
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async resetUserPassword(id: string): Promise<{ newPassword: string; user: User } | null> {
    try {
      // Generate new password (8 characters, alphanumeric)
      const newPassword = Math.random().toString(36).slice(2, 10);
      
      // Hash the password
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          password_hash: passwordHash,
        })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        return null;
      }
      
      return { newPassword, user: updatedUser };
    } catch (error) {
      console.error("Error resetting user password:", error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // First, unassign any credentials assigned to this user
        await tx
          .update(credentialPools)
          .set({
            isAssigned: false,
            assignedToUserId: null,
            assignedToOrderId: null,
            assignedAt: null,
            updatedAt: new Date()
          })
          .where(eq(credentialPools.assignedToUserId, id));

        // Then delete the user
        const result = await tx
          .delete(users)
          .where(eq(users.id, id));
        
        return result.rowCount > 0;
      });
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

  async getPlan(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async getActivePlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder, plans.name);
  }

  async getPlanById(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
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
        
        // Create delivery record - skip if table doesn't exist yet
        try {
          await db.insert(orderCredentials).values({
            orderId,
            credentialId: credential.id,
          });
          console.log(`Created delivery record for credential ${credential.id} in order ${orderId}`);
        } catch (error) {
          console.log('Delivery record creation skipped (table may not exist):', error.message);
        }
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

  // Coupon transformation functions
  private transformDbCouponToFrontend(dbCoupon: any): any {
    return {
      id: dbCoupon.id,
      code: dbCoupon.code,
      // Use new standardized fields, fallback to legacy if needed
      discountType: dbCoupon.discountType || dbCoupon.type,
      discountValue: parseFloat(dbCoupon.discountValue || dbCoupon.value),
      minOrderAmount: dbCoupon.minOrderAmount ? parseFloat(dbCoupon.minOrderAmount) : null,
      maxUses: dbCoupon.maxUses,
      usedCount: dbCoupon.uses,
      validFrom: dbCoupon.startsAt ? dbCoupon.startsAt.toISOString().split('T')[0] : null,
      validUntil: dbCoupon.endsAt ? dbCoupon.endsAt.toISOString().split('T')[0] : null,
      // Enhanced scope functionality
      scope: dbCoupon.scope || 'general',
      applicableShips: typeof dbCoupon.applicableShips === 'string' ? JSON.parse(dbCoupon.applicableShips) : (dbCoupon.applicableShips || []),
      applicablePlans: typeof dbCoupon.applicablePlans === 'string' ? JSON.parse(dbCoupon.applicablePlans) : (dbCoupon.applicablePlans || []),
      description: dbCoupon.description,
      // Legacy fields
      shipId: dbCoupon.shipId,
      isActive: dbCoupon.isActive,
      singleUseOnly: dbCoupon.singleUseOnly || false,
      createdAt: dbCoupon.createdAt.toISOString(),
      updatedAt: dbCoupon.updatedAt.toISOString(),
    };
  }

  private transformFrontendCouponToDb(frontendCoupon: any): any {
    const dbCoupon: any = {
      code: frontendCoupon.code.toUpperCase().trim(),
      // Store in both legacy and new fields for compatibility
      type: frontendCoupon.discountType,
      value: frontendCoupon.discountValue.toString(),
      discountType: frontendCoupon.discountType,
      discountValue: frontendCoupon.discountValue.toString(),
      minOrderAmount: frontendCoupon.minOrderAmount ? frontendCoupon.minOrderAmount.toString() : null,
      maxUses: frontendCoupon.maxUses,
      // Enhanced scope functionality
      scope: frontendCoupon.scope || 'general',
      applicableShips: JSON.stringify(frontendCoupon.applicableShips || []),
      applicablePlans: JSON.stringify(frontendCoupon.applicablePlans || []),
      description: frontendCoupon.description,
      // Legacy ship reference (deprecated but maintained)
      shipId: frontendCoupon.scope === 'ship' && frontendCoupon.applicableShips?.length === 1 
        ? frontendCoupon.applicableShips[0] : null,
      isActive: frontendCoupon.isActive,
      singleUseOnly: frontendCoupon.singleUseOnly || false,
    };

    if (frontendCoupon.validFrom) {
      dbCoupon.startsAt = new Date(frontendCoupon.validFrom);
    }
    if (frontendCoupon.validUntil) {
      dbCoupon.endsAt = new Date(frontendCoupon.validUntil);
    }

    return dbCoupon;
  }

  // Coupon operations
  async getCoupons(): Promise<any[]> {
    const dbCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return dbCoupons.map(coupon => this.transformDbCouponToFrontend(coupon));
  }

  async getAllCoupons(): Promise<any[]> {
    const dbCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return dbCoupons.map(coupon => this.transformDbCouponToFrontend(coupon));
  }

  async getCouponByCode(code: string): Promise<any | undefined> {
    // Search case-insensitively by converting both to uppercase
    const [dbCoupon] = await db.select().from(coupons).where(sql`UPPER(${coupons.code}) = UPPER(${code})`);
    return dbCoupon ? this.transformDbCouponToFrontend(dbCoupon) : undefined;
  }

  async getCouponById(id: string): Promise<any | undefined> {
    const [dbCoupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return dbCoupon ? this.transformDbCouponToFrontend(dbCoupon) : undefined;
  }

  async createCoupon(frontendCoupon: any): Promise<any> {
    const dbCouponData = this.transformFrontendCouponToDb(frontendCoupon);
    const [newDbCoupon] = await db.insert(coupons).values(dbCouponData).returning();
    return this.transformDbCouponToFrontend(newDbCoupon);
  }

  async updateCoupon(id: string, frontendCoupon: any): Promise<any | undefined> {
    const dbCouponData = this.transformFrontendCouponToDb(frontendCoupon);
    const [updatedDbCoupon] = await db
      .update(coupons)
      .set({ ...dbCouponData, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return updatedDbCoupon ? this.transformDbCouponToFrontend(updatedDbCoupon) : undefined;
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

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return db.select().from(settings).where(eq(settings.category, category));
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


  async getSetting(key: string): Promise<Setting | null> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || null;
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
      { key: 'paypalClientId', value: '', category: 'payment' },
      { key: 'paypalClientSecret', value: '', category: 'payment' },
      { key: 'paypalEnvironment', value: 'sandbox', category: 'payment' },
      
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
      { key: 'RADIUS_DB_NAME', value: '', category: 'radius' },
      
      // Email Security Settings
      { key: 'EMAIL_ENCRYPTION_KEY', value: 'AdeGloba-2024-Email-Key-Default', category: 'email_security' }
    ];

    for (const setting of defaultSettings) {
      const existing = await this.getSetting(setting.key);
      if (!existing) {
        await db.insert(settings).values(setting);
      }
    }
  }

  // Statistics
  async getOrderStats(): Promise<{ totalRevenue: number; activeUsers: number; activePackages: number; totalOrders: number; cancelledOrders: number; pendingOrders: number }> {
    try {
      // Total Revenue and Orders from completed orders only
      const [revenueStats] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'completed' THEN CAST(${orders.totalUsd} AS DECIMAL) ELSE 0 END), 0)`,
          totalOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'completed' THEN 1 END)`,
          cancelledOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`,
          pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`
        })
        .from(orders);

      // Active Users - users with at least one active package (orders with expires_at > now and status = completed)
      const [activeUsersStats] = await db
        .select({
          activeUsers: sql<number>`COUNT(DISTINCT ${orders.userId})`
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, 'completed'),
            isNotNull(orders.expiresAt),
            gt(orders.expiresAt, new Date())
          )
        );

      // Active Packages - count of active completed orders that haven't expired
      const [activePackagesStats] = await db
        .select({
          activePackages: sql<number>`COUNT(*)`
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, 'completed'),
            isNotNull(orders.expiresAt),
            gt(orders.expiresAt, new Date())
          )
        );

      return {
        totalRevenue: Number(revenueStats.totalRevenue) || 0,
        activeUsers: Number(activeUsersStats.activeUsers) || 0,
        activePackages: Number(activePackagesStats.activePackages) || 0,
        totalOrders: Number(revenueStats.totalOrders) || 0,
        cancelledOrders: Number(revenueStats.cancelledOrders) || 0,
        pendingOrders: Number(revenueStats.pendingOrders) || 0
      };
    } catch (error) {
      console.error('Error fetching order stats:', error);
      return {
        totalRevenue: 0,
        activeUsers: 0,
        activePackages: 0,
        totalOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0
      };
    }
  }

  async getCancelledOrdersCount(): Promise<number> {
    try {
      const [result] = await db
        .select({
          count: sql<number>`COUNT(*)`
        })
        .from(orders)
        .where(eq(orders.status, 'cancelled'));
      
      return Number(result.count) || 0;
    } catch (error) {
      console.error('Error fetching cancelled orders count:', error);
      return 0;
    }
  }

  async getPendingOrdersCount(): Promise<number> {
    try {
      const [result] = await db
        .select({
          count: sql<number>`COUNT(*)`
        })
        .from(orders)
        .where(eq(orders.status, 'pending'));
      
      return Number(result.count) || 0;
    } catch (error) {
      console.error('Error fetching pending orders count:', error);
      return 0;
    }
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

  async getUser(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getAllCredentials(): Promise<CredentialPool[]> {
    return db.select().from(credentialPools).orderBy(credentialPools.createdAt);
  }


  async getUsersWithOrderStats(): Promise<Array<User & { ship: Ship | undefined; orderStats: { totalOrders: number; totalAmountPaid: number; lastOrderDate: string | null } }>> {
    const allUsers = await db.select().from(users).orderBy(users.created_at);
    const allShips = await db.select().from(ships);
    const allOrders = await db.select().from(orders);

    return allUsers.map(user => {
      const ship = allShips.find(s => s.id === user.ship_id);
      const userOrders = allOrders.filter(o => o.userId === user.id && (o.status === 'paid' || o.status === 'completed'));
      
      const totalAmountPaid = userOrders.reduce((sum, order) => sum + parseFloat(order.totalUsd || '0'), 0);
      console.log(`User ${user.username} - Orders: ${userOrders.length}, Total Amount: ${totalAmountPaid}`);
      const lastOrderDate = userOrders.length > 0 
        ? userOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0].createdAt
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
        totalAmount: parseFloat(order.totalUsd || '0'),
      };
    });
  }

  // Manual package assignment
  async createManualPackageAssignment({
    userId,
    planId,
    note,
    adminId
  }: {
    userId: string;
    planId: string;
    note?: string;
    adminId: string;
  }): Promise<{
    order: Order;
    orderItem: OrderItem;
    credentials: CredentialPool[];
    orderCredentials: any[];
  }> {
    return await db.transaction(async (tx) => {
      // Get plan details
      const [plan] = await tx.select().from(plans).where(eq(plans.id, planId));
      if (!plan) {
        throw new Error("Plan not found");
      }

      // Calculate expiry date to end of current month (Istanbul timezone)
      const paidAt = new Date();
      const expiresAt = getEndOfMonthIstanbul(paidAt);

      // Create manual order
      const [order] = await tx
        .insert(orders)
        .values({
          userId,
          shipId: plan.shipId,
          status: 'paid',
          subtotalUsd: plan.priceUsd,
          totalUsd: plan.priceUsd,
          currency: 'USD',
          paidAt,
          expiresAt,
          paypalOrderId: `MANUAL_${Date.now()}_${adminId.slice(-8)}`,
          createdAt: new Date()
        })
        .returning();

      // Create order item
      const [orderItem] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          shipId: plan.shipId,
          planId,
          qty: 1,
          unitPriceUsd: plan.priceUsd,
          lineTotalUsd: plan.priceUsd,
          expiresAt
        })
        .returning();

      // Get available credentials for the plan
      const availableCredentials = await tx
        .select()
        .from(credentialPools)
        .where(
          and(
            eq(credentialPools.planId, planId),
            eq(credentialPools.isAssigned, false)
          )
        )
        .limit(1)
        .for('update');

      if (availableCredentials.length === 0) {
        throw new Error("No available credentials for this plan");
      }

      const credential = availableCredentials[0];

      // Assign credential to order
      await tx
        .update(credentialPools)
        .set({
          isAssigned: true,
          assignedToOrderId: order.id,
          assignedToUserId: userId,
          assignedAt: paidAt,
          updatedAt: new Date()
        })
        .where(eq(credentialPools.id, credential.id));

      // Create order credentials record
      const [orderCredential] = await tx
        .insert(orderCredentials)
        .values({
          orderId: order.id,
          credentialId: credential.id,
          deliveredAt: paidAt,
          expiresAt
        })
        .returning();

      return {
        order,
        orderItem,
        credentials: [credential],
        orderCredentials: [orderCredential]
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

  // Coupon usage operations
  async createCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage> {
    const [couponUsageRecord] = await db
      .insert(couponUsage)
      .values(usage)
      .returning();
    return couponUsageRecord;
  }

  async getCouponUsageCount(couponId: string, userId?: string): Promise<number> {
    let query = db
      .select({ count: sql<number>`count(*)` })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, couponId));

    if (userId) {
      query = query.where(eq(couponUsage.userId, userId));
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  async getUserCouponUsage(userId: string, couponId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(couponUsage)
      .where(and(eq(couponUsage.userId, userId), eq(couponUsage.couponId, couponId)));

    return result[0]?.count || 0;
  }

  async getUserCouponUsageForCompletedOrders(userId: string, couponId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(couponUsage)
      .innerJoin(orders, eq(couponUsage.orderId, orders.id))
      .where(and(
        eq(couponUsage.userId, userId),
        eq(couponUsage.couponId, couponId),
        eq(orders.status, 'paid')
      ));

    return result[0]?.count || 0;
  }

  async getCouponUsageCountForCompletedOrders(couponId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(couponUsage)
      .innerJoin(orders, eq(couponUsage.orderId, orders.id))
      .where(and(
        eq(couponUsage.couponId, couponId),
        eq(orders.status, 'paid')
      ));

    return result[0]?.count || 0;
  }

  // Helper method to get cart total with formatting
  async getCartTotalFormatted(userId: string): Promise<{ subtotal: number; total: number; itemCount: number; subtotalFormatted: string; totalFormatted: string }> {
    const cartTotal = await this.getCartTotal(userId);
    return {
      ...cartTotal,
      subtotalFormatted: `$${cartTotal.subtotal.toFixed(2)}`,
      totalFormatted: `$${cartTotal.total.toFixed(2)}`
    };
  }

  // Stock management operations
  async getAvailableStock(planId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(credentialPools)
      .where(and(
        eq(credentialPools.planId, planId),
        eq(credentialPools.isAssigned, false)
      ));
    
    return result[0]?.count || 0;
  }

  async getCredentialStats(planId: string): Promise<{ total: number; assigned: number; available: number }> {
    const [totalResult, assignedResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(credentialPools)
        .where(eq(credentialPools.planId, planId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(credentialPools)
        .where(and(
          eq(credentialPools.planId, planId),
          eq(credentialPools.isAssigned, true)
        ))
    ]);

    const total = totalResult[0]?.count || 0;
    const assigned = assignedResult[0]?.count || 0;
    const available = total - assigned;

    return { total, assigned, available };
  }

  async getAllCredentialStats(): Promise<{ [planId: string]: { total: number; assigned: number; available: number } }> {
    const [totalResults, assignedResults] = await Promise.all([
      db
        .select({ 
          planId: credentialPools.planId,
          count: sql<number>`count(*)` 
        })
        .from(credentialPools)
        .groupBy(credentialPools.planId),
      db
        .select({ 
          planId: credentialPools.planId,
          count: sql<number>`count(*)` 
        })
        .from(credentialPools)
        .where(eq(credentialPools.isAssigned, true))
        .groupBy(credentialPools.planId)
    ]);

    const stats: { [planId: string]: { total: number; assigned: number; available: number } } = {};

    // Initialize with totals
    for (const result of totalResults) {
      stats[result.planId] = {
        total: result.count,
        assigned: 0,
        available: result.count
      };
    }

    // Add assigned counts
    for (const result of assignedResults) {
      if (stats[result.planId]) {
        stats[result.planId].assigned = result.count;
        stats[result.planId].available = stats[result.planId].total - result.count;
      }
    }

    return stats;
  }

  async validateStockAvailability(planId: string, requestedQuantity: number): Promise<boolean> {
    const availableStock = await this.getAvailableStock(planId);
    return availableStock >= requestedQuantity;
  }

  async reserveStock(planId: string, quantity: number, orderId: string): Promise<boolean> {
    try {
      // Use a transaction to prevent race conditions
      return await db.transaction(async (tx) => {
        // Get available credentials with a lock
        const availableCredentials = await tx
          .select()
          .from(credentialPools)
          .where(and(
            eq(credentialPools.planId, planId),
            eq(credentialPools.isAssigned, false)
          ))
          .limit(quantity)
          .for('update'); // Row-level lock

        if (availableCredentials.length < quantity) {
          return false; // Not enough stock
        }

        // Mark credentials as assigned
        const credentialIds = availableCredentials.map(c => c.id);
        await tx
          .update(credentialPools)
          .set({
            isAssigned: true,
            assignedToOrderId: orderId,
            assignedAt: new Date()
          })
          .where(sql`${credentialPools.id} = ANY(${credentialIds})`);

        return true;
      });
    } catch (error) {
      console.error('Stock reservation failed:', error);
      return false;
    }
  }

  async getCredentialsForOrder(orderId: string): Promise<any[]> {
    const results = await db
      .select({
        id: credentialPools.id,
        username: credentialPools.username,
        password: credentialPools.password,
        planId: credentialPools.planId,
        assignedAt: credentialPools.assignedAt,
        deliveredAt: orderCredentials.deliveredAt,
        expiresAt: orderCredentials.expiresAt
      })
      .from(credentialPools)
      .innerJoin(orderCredentials, eq(credentialPools.id, orderCredentials.credentialId))
      .where(eq(orderCredentials.orderId, orderId));
    
    return results;
  }

  async getUserExpiredPackages(userId: string, offset: number, pageSize: number): Promise<any[]> {
    const now = new Date();
    
    try {
      const results = await db
        .select({
          credentialId: credentialPools.id,
          username: credentialPools.username,
          password: credentialPools.password,
          planName: plans.name,
          dataLimitGb: plans.dataLimitGb,
          assignedAt: credentialPools.assignedAt,
          orderId: orders.id,
          orderStatus: orders.status,
          paidAt: orders.paidAt,
          expiresAt: orders.expiresAt,
          createdAt: orders.createdAt
        })
        .from(credentialPools)
        .innerJoin(orders, eq(credentialPools.assignedToOrderId, orders.id))
        .innerJoin(plans, eq(credentialPools.planId, plans.id))
        .where(
          and(
            eq(credentialPools.assignedToUserId, userId),
            eq(credentialPools.isAssigned, true),
            or(
              eq(orders.status, 'paid'),
              eq(orders.status, 'completed')
            ),
            // Only include packages that have expired
            and(
              isNotNull(orders.expiresAt),
              lt(orders.expiresAt, now)
            )
          )
        )
        .orderBy(desc(orders.expiresAt)) // Most recently expired first
        .limit(pageSize)
        .offset(offset);

      return results.map(r => {
        const expirationDate = r.expiresAt ? new Date(r.expiresAt) : null;
        const purchaseDate = r.paidAt ? new Date(r.paidAt) : new Date(r.createdAt);
        
        return {
          credentialId: r.credentialId,
          username: r.username,
          // Mask password: show first 2 and last 2 characters, mask the middle
          maskedPassword: r.password.length > 4 
            ? r.password.substring(0, 2) + '*'.repeat(r.password.length - 4) + r.password.substring(r.password.length - 2)
            : '****',
          planName: r.planName,
          dataLimitGb: r.dataLimitGb,
          purchaseDate: purchaseDate.toISOString(),
          expiredDate: expirationDate?.toISOString() || null,
          orderId: r.orderId,
          orderStatus: r.orderStatus
        };
      });
    } catch (error) {
      console.error('Error fetching expired packages:', error);
      return [];
    }
  }

  async getUserExpiredPackagesCount(userId: string): Promise<number> {
    const now = new Date();
    
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(credentialPools)
        .innerJoin(orders, eq(credentialPools.assignedToOrderId, orders.id))
        .where(
          and(
            eq(credentialPools.assignedToUserId, userId),
            eq(credentialPools.isAssigned, true),
            or(
              eq(orders.status, 'paid'),
              eq(orders.status, 'completed')
            ),
            and(
              isNotNull(orders.expiresAt),
              lt(orders.expiresAt, now)
            )
          )
        );
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting expired packages:', error);
      return 0;
    }
  }

  // Email operations
  async getEmailSettings(): Promise<EmailSetting | null> {
    const [settings] = await db.select().from(emailSettings).limit(1);
    if (!settings) return null;
    
    // Also get admin email from settings table
    const adminEmailSetting = await this.getSetting('admin_email');
    
    return {
      ...settings,
      adminEmail: adminEmailSetting?.value || 'support@adegloba.space'
    };
  }

  async upsertEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting> {
    const existing = await this.getEmailSettings();
    
    if (existing) {
      const [updated] = await db
        .update(emailSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(emailSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(emailSettings).values(settings).returning();
      return created;
    }
  }

  async saveEmailSettings(settings: any): Promise<EmailSetting> {
    const { adminEmail, ...otherSettings } = settings;
    
    // Save admin email to settings table if provided
    if (adminEmail) {
      await this.upsertSetting('admin_email', adminEmail, 'email');
    }
    
    // Map frontend fields to database fields
    const emailSettingsData = {
      provider: otherSettings.provider || 'smtp',
      smtp_host: otherSettings.smtpHost,
      smtp_port: otherSettings.smtpPort,
      smtp_user: otherSettings.smtpUser,
      smtp_pass: otherSettings.smtpPass,
      from_email: otherSettings.fromEmail,
      from_name: otherSettings.fromName,
      reply_to: otherSettings.replyTo,
      is_active: otherSettings.isActive ?? true,
      sendgrid_key: null, // We removed SendGrid
      mailgun_domain: null, // We removed Mailgun
      mailgun_key: null, // We removed Mailgun
    };
    
    console.log('💾 Saving email settings to database:', emailSettingsData);
    
    // Save email settings
    return this.upsertEmailSettings(emailSettingsData);
  }

  async createEmailLog(logData: InsertEmailLog): Promise<EmailLog> {
    const [log] = await db.insert(emailLogs).values(logData).returning();
    return log;
  }

  async getEmailLogs(options: {
    page?: number;
    pageSize?: number;
    status?: string;
    template?: string;
  } = {}): Promise<{ logs: EmailLog[]; total: number }> {
    const { page = 1, pageSize = 50, status, template } = options;
    const offset = (page - 1) * pageSize;

    let whereConditions = [];
    if (status) {
      whereConditions.push(eq(emailLogs.status, status));
    }
    if (template) {
      whereConditions.push(eq(emailLogs.template, template));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [logs, totalResult] = await Promise.all([
      db
        .select()
        .from(emailLogs)
        .where(whereClause)
        .orderBy(desc(emailLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailLogs)
        .where(whereClause),
    ]);

    return {
      logs,
      total: Number(totalResult[0]?.count || 0),
    };
  }

  async getOrdersByShipAndDateRange(shipId: string, startDate: Date, endDate: Date): Promise<Order[]> {
    try {
      const ordersData = await db
        .select()
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .innerJoin(plans, eq(orderItems.planId, plans.id))
        .where(
          and(
            eq(plans.shipId, shipId),
            gte(orders.createdAt, startDate),
            lt(orders.createdAt, endDate)
          )
        )
        .groupBy(orders.id);

      // Extract unique orders
      const uniqueOrders = ordersData.reduce((acc, row) => {
        const order = row.orders;
        if (!acc.find(o => o.id === order.id)) {
          acc.push(order);
        }
        return acc;
      }, [] as Order[]);

      return uniqueOrders;
    } catch (error) {
      console.error('Error fetching orders by ship and date range:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
