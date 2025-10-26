const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { pgTable, text, serial, timestamp, integer, varchar } = require("drizzle-orm/pg-core");

// Define schema inline for CommonJS compatibility
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/email_service",
});

const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const [user1, user2] = await db.insert(users).values([
      {
        email: "user1@example.com",
        name: "John Doe",
        password: hashedPassword,
      },
      {
        email: "user2@example.com", 
        name: "Jane Smith",
        password: hashedPassword,
      }
    ]).returning();

    console.log("✅ Users created");

    // Create customers for user1 (100,000 customers)
    const user1Customers = [];
    for (let i = 1; i <= 1000; i++) { // Reduced for demo
      user1Customers.push({
        userId: user1.id,
        email: `customer${i}@user1.com`,
        name: `Customer ${i}`,
        status: "active"
      });
    }

    // Create customers for user2 (100 customers)
    const user2Customers = [];
    for (let i = 1; i <= 100; i++) {
      user2Customers.push({
        userId: user2.id,
        email: `customer${i}@user2.com`,
        name: `Customer ${i}`,
        status: "active"
      });
    }

    await db.insert(customers).values([...user1Customers, ...user2Customers]);
    console.log("✅ Customers created");

    // Create sample campaigns
    const [campaign1, campaign2] = await db.insert(campaigns).values([
      {
        userId: user1.id,
        name: "Summer Sale 2024",
        subject: "🌞 Huge Summer Discounts Inside!",
        content: "<h1>Summer Sale</h1><p>Get 50% off everything!</p>",
        status: "draft",
        priority: "normal",
        totalRecipients: 1000,
      },
      {
        userId: user2.id,
        name: "Product Launch",
        subject: "🚀 New Product Launch",
        content: "<h1>New Product</h1><p>Check out our latest innovation!</p>",
        status: "draft", 
        priority: "high",
        totalRecipients: 100,
      }
    ]).returning();

    console.log("✅ Campaigns created");
    console.log("🎉 Database seeded successfully!");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();