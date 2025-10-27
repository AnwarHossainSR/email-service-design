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
  console.log("🌱 Seeding database with realistic data...");

  try {
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const [user1, user2, user3] = await db.insert(users).values([
      {
        email: "enterprise@example.com",
        name: "Enterprise Corp",
        password: hashedPassword,
      },
      {
        email: "medium@example.com", 
        name: "Medium Business",
        password: hashedPassword,
      },
      {
        email: "small@example.com",
        name: "Small Business",
        password: hashedPassword,
      }
    ]).returning();

    console.log("✅ Users created");

    // User 1: 100,000 customers (enterprise)
    console.log("Creating 100,000 customers for enterprise user...");
    for (let batch = 0; batch < 20; batch++) {
      const batchCustomers = [];
      for (let i = 1; i <= 5000; i++) {
        const customerNum = batch * 5000 + i;
        batchCustomers.push({
          userId: user1.id,
          email: `enterprise.customer${customerNum}@bigcorp.com`,
          name: `Enterprise Customer ${customerNum}`,
          status: "active"
        });
      }
      await db.insert(customers).values(batchCustomers);
      console.log(`Inserted ${(batch + 1) * 5000} enterprise customers...`);
    }

    // User 2: 10,000 customers (medium business)
    console.log("Creating 10,000 customers for medium business...");
    for (let batch = 0; batch < 5; batch++) {
      const batchCustomers = [];
      for (let i = 1; i <= 2000; i++) {
        const customerNum = batch * 2000 + i;
        batchCustomers.push({
          userId: user2.id,
          email: `medium.customer${customerNum}@mediumbiz.com`,
          name: `Medium Customer ${customerNum}`,
          status: "active"
        });
      }
      await db.insert(customers).values(batchCustomers);
      console.log(`Inserted ${(batch + 1) * 2000} medium business customers...`);
    }

    // User 3: 100 customers (small business)
    console.log("Creating 100 customers for small business...");
    const smallCustomers = [];
    for (let i = 1; i <= 100; i++) {
      smallCustomers.push({
        userId: user3.id,
        email: `small.customer${i}@smallbiz.com`,
        name: `Small Customer ${i}`,
        status: "active"
      });
    }
    await db.insert(customers).values(smallCustomers);

    console.log("✅ Customers created");

    // Create sample campaigns
    await db.insert(campaigns).values([
      {
        userId: user1.id,
        name: "Enterprise Newsletter Q4",
        subject: "🏢 Enterprise Updates & Insights",
        content: "<h1>Enterprise Newsletter</h1><p>Quarterly business updates...</p>",
        status: "draft",
        priority: "normal",
        totalRecipients: 100000,
      },
      {
        userId: user2.id,
        name: "Medium Business Promotion",
        subject: "🎯 Special Offer for Our Valued Customers",
        content: "<h1>Special Promotion</h1><p>Limited time offer...</p>",
        status: "draft", 
        priority: "normal",
        totalRecipients: 10000,
      },
      {
        userId: user3.id,
        name: "Urgent System Maintenance Alert",
        subject: "🚨 URGENT: System Maintenance Tonight",
        content: "<h1>System Maintenance</h1><p>Important maintenance notification...</p>",
        status: "draft",
        priority: "high",
        totalRecipients: 100,
      }
    ]);

    console.log("✅ Campaigns created");
    console.log("🎉 Database seeded successfully!");
    console.log("📊 Summary:");
    console.log("- Enterprise user: 100,000 customers");
    console.log("- Medium business: 10,000 customers");  
    console.log("- Small business: 100 customers");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();