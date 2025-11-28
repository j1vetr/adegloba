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

// Session storage table for standalone authentication
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
  phone: varchar("phone"), // Telefon numarası field
  ship_id: varchar("ship_id").references(() => ships.id),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow(),
  // PCI DSS Compliance fields
  reset_required: boolean("reset_required").notNull().default(false), // Şifre sıfırlama zorunluluğu
  failed_login_attempts: integer("failed_login_attempts").notNull().default(0), // Başarısız giriş sayısı
  locked_until: timestamp("locked_until"), // Hesap kilit süresi (30 dk sonra null olur)
  last_login_at: timestamp("last_login_at"), // Son giriş tarihi
  last_activity_at: timestamp("last_activity_at"), // Son aktivite (15 dk oturum kontrolü)
  is_active: boolean("is_active").notNull().default(true), // Hesap aktifliği (90 gün inaktif = false)
  first_login_completed: boolean("first_login_completed").notNull().default(false), // İlk giriş tamamlandı mı
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
  shipId: varchar("ship_id").notNull().references(() => ships.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  dataLimitGb: integer("data_limit_gb").notNull(),
  validityDays: integer("validity_days"), // DEPRECATED: All packages now valid until end of purchase month
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Removed shipPlans table - plans are now directly associated with ships

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  // Legacy fields (keeping for backward compatibility)
  type: varchar("type").notNull(), // 'percentage' or 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  // New standardized fields
  discountType: varchar("discount_type").notNull().default('percentage'), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull().default('0'),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  // Enhanced scope functionality
  scope: varchar("scope").notNull().default('general'), // 'general', 'ship', 'package'
  applicableShips: jsonb("applicable_ships").default('[]'), // Array of ship IDs
  applicablePlans: jsonb("applicable_plans").default('[]'), // Array of plan IDs
  description: text("description"),
  // Legacy ship reference (deprecated in favor of scope + applicableShips)
  shipId: varchar("ship_id").references(() => ships.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  singleUseOnly: boolean("single_use_only").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credential pool for captive portal access per ship
// Credential Pools table - now package-specific
export const credentialPools = pgTable("credential_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  username: varchar("username").notNull(),
  password: varchar("password").notNull(),
  isAssigned: boolean("is_assigned").notNull().default(false),
  isConsumed: boolean("is_consumed").notNull().default(false), // Kalıcı kullanım işareti
  assignedToOrderId: varchar("assigned_to_order_id").references(() => orders.id, { onDelete: "set null" }),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.planId, table.username)
]);

// Order Credentials table - tracks delivered credentials per order
export const orderCredentials = pgTable("order_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  credentialId: varchar("credential_id").notNull().references(() => credentialPools.id, { onDelete: "cascade" }),
  deliveredAt: timestamp("delivered_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Expiry date: last day of purchase month at 23:59:59 Europe/Istanbul
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("idx_order_credentials_expires").on(table.expiresAt)]);

// Shopping cart tables
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.planId) // One cart item per user per plan
]);

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shipId: varchar("ship_id").notNull().references(() => ships.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default('pending'), // 'pending', 'paid', 'failed', 'refunded', 'expired'
  currency: varchar("currency").notNull().default('USD'),
  subtotalUsd: decimal("subtotal_usd", { precision: 10, scale: 2 }).notNull(),
  discountUsd: decimal("discount_usd", { precision: 10, scale: 2 }).notNull().default('0'),
  totalUsd: decimal("total_usd", { precision: 10, scale: 2 }).notNull(),
  couponId: varchar("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  paypalOrderId: varchar("paypal_order_id"),
  assignedCredentialId: varchar("assigned_credential_id"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  expiresAt: timestamp("expires_at"), // Expiry date: last day of purchase month at 23:59:59 Europe/Istanbul
}, (table) => [index("idx_orders_status_expires").on(table.status, table.expiresAt)]);

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  shipId: varchar("ship_id").notNull().references(() => ships.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull().default(1),
  unitPriceUsd: decimal("unit_price_usd", { precision: 10, scale: 2 }).notNull(),
  lineTotalUsd: decimal("line_total_usd", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at"), // Expiry date: last day of purchase month at 23:59:59 Europe/Istanbul
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  category: varchar("category").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System logs table for tracking platform events
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(), // user_action, package_creation, credential_assignment, order_processing, admin_action
  action: varchar("action").notNull(), // login, logout, create_package, assign_credential, process_order, etc.
  userId: varchar("user_id").references(() => users.id),
  adminId: varchar("admin_id").references(() => admin_users.id),
  entityType: varchar("entity_type"), // package, credential, order, user, ship
  entityId: varchar("entity_id"), // ID of the affected entity
  details: jsonb("details"), // Additional contextual data
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
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
  plans: many(plans),
  orderItems: many(orderItems),
  orders: many(orders),
  coupons: many(coupons),
  users: many(users),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  ship: one(ships, {
    fields: [plans.shipId],
    references: [ships.id],
  }),
  orderItems: many(orderItems),
  credentialPools: many(credentialPools),
}));

export const credentialPoolsRelations = relations(credentialPools, ({ one }) => ({
  plan: one(plans, {
    fields: [credentialPools.planId],
    references: [plans.id],
  }),
  assignedOrder: one(orders, {
    fields: [credentialPools.assignedToOrderId],
    references: [orders.id],
  }),
  assignedUser: one(users, {
    fields: [credentialPools.assignedToUserId],
    references: [users.id],
  }),
}));

export const orderCredentialsRelations = relations(orderCredentials, ({ one }) => ({
  order: one(orders, {
    fields: [orderCredentials.orderId],
    references: [orders.id],
  }),
  credential: one(credentialPools, {
    fields: [orderCredentials.credentialId],
    references: [credentialPools.id],
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
  ship: one(ships, {
    fields: [orders.shipId],
    references: [ships.id],
  }),
  credentials: many(orderCredentials),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  assignedCredential: one(credentialPools, {
    fields: [orders.assignedCredentialId],
    references: [credentialPools.id],
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
  created_at: true,
});

export const registerSchema = createInsertSchema(users, {
  full_name: z.string().min(2, "İsim Soyisim en az 2 karakter olmalı"),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password_hash: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  phone: z.string().min(10, "Telefon numarası en az 10 haneli olmalı").regex(/^[0-9+\-\s()]+$/, "Geçerli bir telefon numarası girin"),
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
  sortOrder: true,
  validityDays: true, // DEPRECATED: Validity is now until end of purchase month
}).extend({
  priceUsd: z.string().or(z.number()).transform(val => typeof val === 'string' ? val : val.toString()),
  dataLimitGb: z.number().int().positive(),
});

export const insertCredentialPoolSchema = createInsertSchema(credentialPools).omit({
  id: true,
  isAssigned: true,
  assignedToOrderId: true,
  assignedToUserId: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderCredentialSchema = createInsertSchema(orderCredentials).omit({
  id: true,
  deliveredAt: true,
  expiresAt: true, // Computed from order paidAt
  createdAt: true,
});

// Enhanced coupon schema with scope functionality
export const insertCouponSchema = z.object({
  code: z.string().min(1, "Kupon kodu gerekli"),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive("İndirim değeri pozitif olmalı"),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  scope: z.enum(['general', 'ship', 'package']).default('general'),
  applicableShips: z.array(z.string()).default([]),
  applicablePlans: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  singleUseOnly: z.boolean().default(false),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  paidAt: true,
  expiresAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  expiresAt: true, // Computed from order paidAt
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
export type InsertCredentialPool = z.infer<typeof insertCredentialPoolSchema>;
export type CredentialPool = typeof credentialPools.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderCredential = z.infer<typeof insertOrderCredentialSchema>;
export type OrderCredential = typeof orderCredentials.$inferSelect;
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

export type InsertTicket = z.infer<typeof insertTicketSchema> & { message: string };
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketAttachment = z.infer<typeof insertTicketAttachmentSchema>;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;

// System logs schemas and types
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// Email settings table - stores email configuration in database
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider").notNull().default('smtp'), // 'smtp', 'sendgrid', 'mailgun'
  
  // SMTP settings
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPass: varchar("smtp_pass"), // encrypted in storage
  
  // SendGrid settings
  sendgridKey: varchar("sendgrid_key"), // encrypted in storage
  
  // Mailgun settings
  mailgunDomain: varchar("mailgun_domain"),
  mailgunKey: varchar("mailgun_key"), // encrypted in storage
  
  // Common settings
  fromEmail: varchar("from_email"),
  fromName: varchar("from_name"),
  replyTo: varchar("reply_to"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email logs table - tracks all sent emails
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toEmail: varchar("to_email").notNull(),
  ccEmail: varchar("cc_email"),
  bccEmail: varchar("bcc_email"),
  subject: varchar("subject").notNull(),
  template: varchar("template").notNull(),
  provider: varchar("provider").notNull(),
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'failed'
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Templates table for marketing campaigns
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Campaigns table for tracking bulk email sends
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  recipientType: varchar("recipient_type").notNull(), // 'all', 'active', 'inactive', 'selected'
  selectedUsers: text("selected_users"), // JSON array of user IDs for 'selected' type
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  status: varchar("status").notNull().default('draft'), // 'draft', 'sending', 'sent', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const insertEmailSettingSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailSetting = z.infer<typeof insertEmailSettingSchema>;
export type EmailSetting = typeof emailSettings.$inferSelect;

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Email template schemas
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Email campaign schemas
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  adminUser: one(admin_users, { fields: [systemLogs.adminId], references: [admin_users.id] }),
}));

// Coupon usage tracking table
export const couponUsage = pgTable("coupon_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const insertCouponUsageSchema = createInsertSchema(couponUsage);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  plan: one(plans, { fields: [cartItems.planId], references: [plans.id] }),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsage.couponId], references: [coupons.id] }),
  user: one(users, { fields: [couponUsage.userId], references: [users.id] }),
  order: one(orders, { fields: [couponUsage.orderId], references: [orders.id] }),
}));

// Cart item schemas and types
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;
export type CouponUsage = typeof couponUsage.$inferSelect;

// Push notification subscription table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// User Segmentation table - for categorizing users into groups
export const userSegments = pgTable("user_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  segment: varchar("segment").notNull(), // 'VIP', 'Active', 'Passive', 'At-Risk', 'New'
  tags: text("tags").array(), // Custom tags like 'high-value', 'frequent-buyer', etc.
  score: integer("score").default(0), // Engagement/Loyalty score
  lastPurchaseDate: timestamp("last_purchase_date"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default('0'),
  orderCount: integer("order_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId)
]);

// Error Logs table - for tracking application errors
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  errorType: varchar("error_type").notNull(), // 'frontend', 'backend', 'database', 'payment'
  severity: varchar("severity").notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
  message: text("message").notNull(),
  stack: text("stack"),
  url: varchar("url"),
  method: varchar("method"), // HTTP method for backend errors
  statusCode: integer("status_code"),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => admin_users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_error_logs_created").on(table.createdAt),
  index("idx_error_logs_severity").on(table.severity),
  index("idx_error_logs_type").on(table.errorType)
]);

// System Metrics table - for tracking system health and performance
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar("metric_type").notNull(), // 'cpu', 'memory', 'database', 'api_response_time', 'uptime'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(), // 'percent', 'ms', 'mb', 'gb', 'requests'
  metadata: jsonb("metadata"), // Additional metric data
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_system_metrics_type_timestamp").on(table.metricType, table.timestamp)
]);

// Relations
export const userSegmentsRelations = relations(userSegments, ({ one }) => ({
  user: one(users, {
    fields: [userSegments.userId],
    references: [users.id],
  }),
}));

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  user: one(users, {
    fields: [errorLogs.userId],
    references: [users.id],
  }),
  resolvedByAdmin: one(admin_users, {
    fields: [errorLogs.resolvedBy],
    references: [admin_users.id],
  }),
}));

// Insert schemas
export const insertUserSegmentSchema = createInsertSchema(userSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUserSegment = z.infer<typeof insertUserSegmentSchema>;
export type UserSegment = typeof userSegments.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;

// Favorite Plans table - for users to save their favorite packages
export const favoritePlans = pgTable("favorite_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.planId),
  index("idx_favorite_plans_user").on(table.userId)
]);

// Relations
export const favoritePlansRelations = relations(favoritePlans, ({ one }) => ({
  user: one(users, {
    fields: [favoritePlans.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [favoritePlans.planId],
    references: [plans.id],
  }),
}));

// Insert schema
export const insertFavoritePlanSchema = createInsertSchema(favoritePlans).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertFavoritePlan = z.infer<typeof insertFavoritePlanSchema>;
export type FavoritePlan = typeof favoritePlans.$inferSelect;
