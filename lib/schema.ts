import { pgTable, text, serial, timestamp, integer, varchar, jsonb, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).default("user").notNull(), // admin, user
    subscriptionPlan: varchar("subscription_plan", { length: 20 }).default("free").notNull(),
    emailsSentThisMonth: integer("emails_sent_this_month").default(0),
    emailLimit: integer("email_limit").default(20),
    subscriptionExpiresAt: timestamp("subscription_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
)

// Customers table (customers of the email service users)
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("customers_user_id_idx").on(table.userId),
  }),
)

// Email campaigns table
export const campaigns = pgTable(
  "campaigns",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    content: text("content").notNull(),
    status: varchar("status", { length: 50 }).default("draft").notNull(), // draft, scheduled, sending, sent
    priority: varchar("priority", { length: 20 }).default("normal").notNull(), // high, normal, low
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    totalRecipients: integer("total_recipients").default(0),
    sentCount: integer("sent_count").default(0),
    failedCount: integer("failed_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("campaigns_user_id_idx").on(table.userId),
    statusIdx: index("campaigns_status_idx").on(table.status),
    priorityIdx: index("campaigns_priority_idx").on(table.priority),
  }),
)

// Email queue table (for processing)
export const emailQueue = pgTable(
  "email_queue",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    customerId: integer("customer_id")
      .references(() => customers.id, { onDelete: "cascade" }),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    recipientName: varchar("recipient_name", { length: 255 }),
    status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, processing, sent, failed
    priority: integer("priority").default(500).notNull(), // Higher number = higher priority
    retryCount: integer("retry_count").default(0),
    maxRetries: integer("max_retries").default(3),
    error: text("error"),
    scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    campaignIdIdx: index("email_queue_campaign_id_idx").on(table.campaignId),
    statusIdx: index("email_queue_status_idx").on(table.status),
    customerIdIdx: index("email_queue_customer_id_idx").on(table.customerId),
  }),
)

// Email logs table (for analytics)
export const emailLogs = pgTable(
  "email_logs",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .references(() => campaigns.id, { onDelete: "cascade" }),
    customerId: integer("customer_id")
      .references(() => customers.id, { onDelete: "cascade" }),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // sent, failed, bounced
    error: text("error"),
    metadata: jsonb("metadata"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    campaignIdIdx: index("email_logs_campaign_id_idx").on(table.campaignId),
    statusIdx: index("email_logs_status_idx").on(table.status),
  }),
)

// System logs table (for comprehensive logging)
export const systemLogs = pgTable(
  "system_logs",
  {
    id: serial("id").primaryKey(),
    level: varchar("level", { length: 20 }).notNull(), // info, warn, error, debug
    category: varchar("category", { length: 50 }).notNull(), // queue, auth, api, email
    message: text("message").notNull(),
    userId: integer("user_id").references(() => users.id),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    levelIdx: index("system_logs_level_idx").on(table.level),
    categoryIdx: index("system_logs_category_idx").on(table.category),
    createdAtIdx: index("system_logs_created_at_idx").on(table.createdAt),
    userIdIdx: index("system_logs_user_id_idx").on(table.userId),
  }),
)

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  campaigns: many(campaigns),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  emailQueue: many(emailQueue),
  emailLogs: many(emailLogs),
}))

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  emailQueue: many(emailQueue),
  emailLogs: many(emailLogs),
}))

export const emailQueueRelations = relations(emailQueue, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [emailQueue.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [emailQueue.customerId],
    references: [customers.id],
  }),
}))

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [emailLogs.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [emailLogs.customerId],
    references: [customers.id],
  }),
}))
