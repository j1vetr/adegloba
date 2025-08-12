import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Regular users table for customer authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull().unique(),
  password_hash: varchar("password_hash").notNull(),
  full_name: varchar("full_name"), // İsim Soyisim field
  ship_id: varchar("ship_id").references(() => ships.id),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow(),
});

// Admin users table for admin panel access
export const admin_users = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  password_hash: varchar("password_hash").notNull(),
  role: varchar("role").notNull().default('admin'),
  created_at: timestamp("created_at").defaultNow(),
});

export const ships = pgTable("ships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  kitNumber: varchar("kit_number"), // Admin-only KIT Numarası field
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  gbAmount: integer("gb_amount").notNull(),
  speedNote: text("speed_note"),
  validityNote: text("validity_note"),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shipPlans = pgTable("ship_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipId: varchar("ship_id").notNull().references(() => ships.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  unique().on(table.shipId, table.planId)
]);

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  type: varchar("type").notNull(), // 'percent' or 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  shipId: varchar("ship_id").references(() => ships.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default('pending'), // 'pending', 'paid', 'failed', 'refunded', 'expired'
  currency: varchar("currency").notNull().default('USD'),
  subtotalUsd: decimal("subtotal_usd", { precision: 10, scale: 2 }).notNull(),
  discountUsd: decimal("discount_usd", { precision: 10, scale: 2 }).notNull().default('0'),
  totalUsd: decimal("total_usd", { precision: 10, scale: 2 }).notNull(),
  couponId: varchar("coupon_id").references(() => coupons.id),
  paypalOrderId: varchar("paypal_order_id"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  expiresAt: timestamp("expires_at"),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  shipId: varchar("ship_id").notNull().references(() => ships.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull().default(1),
  unitPriceUsd: decimal("unit_price_usd", { precision: 10, scale: 2 }).notNull(),
  lineTotalUsd: decimal("line_total_usd", { precision: 10, scale: 2 }).notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  category: varchar("category").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket system tables
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shipId: varchar("ship_id").references(() => ships.id),
  subject: varchar("subject").notNull(),
  priority: varchar("priority").notNull().default('Orta'), // 'Düşük', 'Orta', 'Yüksek'
  status: varchar("status").notNull().default('Açık'), // 'Açık', 'Beklemede', 'Kapalı'
  assignedAdminId: varchar("assigned_admin_id").references(() => admin_users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  senderType: varchar("sender_type").notNull(), // 'user' | 'admin'
  senderId: varchar("sender_id").notNull(), // user_id or admin_user_id
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ticketAttachments = pgTable("ticket_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  messageId: varchar("message_id").references(() => ticketMessages.id, { onDelete: "cascade" }),
  fileUrl: varchar("file_url").notNull(),
  filename: varchar("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  ship: one(ships, {
    fields: [users.ship_id],
    references: [ships.id],
  }),
  orders: many(orders),
}));

export const shipsRelations = relations(ships, ({ many }) => ({
  shipPlans: many(shipPlans),
  orderItems: many(orderItems),
  coupons: many(coupons),
  users: many(users),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  shipPlans: many(shipPlans),
  orderItems: many(orderItems),
}));

export const shipPlansRelations = relations(shipPlans, ({ one }) => ({
  ship: one(ships, {
    fields: [shipPlans.shipId],
    references: [ships.id],
  }),
  plan: one(plans, {
    fields: [shipPlans.planId],
    references: [plans.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  ship: one(ships, {
    fields: [coupons.shipId],
    references: [ships.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  ship: one(ships, {
    fields: [orderItems.shipId],
    references: [ships.id],
  }),
  plan: one(plans, {
    fields: [orderItems.planId],
    references: [plans.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  ship: one(ships, {
    fields: [tickets.shipId],
    references: [ships.id],
  }),
  assignedAdmin: one(admin_users, {
    fields: [tickets.assignedAdminId],
    references: [admin_users.id],
  }),
  messages: many(ticketMessages),
  attachments: many(ticketAttachments),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one, many }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  attachments: many(ticketAttachments),
}));

export const ticketAttachmentsRelations = relations(ticketAttachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAttachments.ticketId],
    references: [tickets.id],
  }),
  message: one(ticketMessages, {
    fields: [ticketAttachments.messageId],
    references: [ticketMessages.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const registerSchema = createInsertSchema(users, {
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password_hash: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  ship_id: z.string().min(1, "Gemi seçimi gerekli"),
  address: z.string().min(10, "Adres en az 10 karakter olmalı"),
}).omit({
  id: true,
  created_at: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const insertShipSchema = createInsertSchema(ships).omit({
  id: true,
  slug: true, // Auto-generated from name
  createdAt: true,
  updatedAt: true,
}).extend({
  kitNumber: z.string().optional(),
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipPlanSchema = createInsertSchema(shipPlans).omit({
  id: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  uses: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  paidAt: true,
  expiresAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types  
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type AdminUser = typeof admin_users.$inferSelect;
export type InsertAdminUser = typeof admin_users.$inferInsert;
export type LoginData = z.infer<typeof loginSchema>;
export type InsertShip = z.infer<typeof insertShipSchema>;
export type Ship = typeof ships.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertShipPlan = z.infer<typeof insertShipPlanSchema>;
export type ShipPlan = typeof shipPlans.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert & { message: string };
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;

// Ticket system schemas and types
export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertTicketAttachmentSchema = createInsertSchema(ticketAttachments).omit({
  id: true,
  createdAt: true,
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = z.infer<typeof insertTicketAttachmentSchema>;
