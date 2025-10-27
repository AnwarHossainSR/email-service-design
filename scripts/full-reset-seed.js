const postgres = require('postgres')
const bcrypt = require('bcryptjs')

async function fullResetAndSeed() {
  // Connect to postgres database to recreate emailflow
  const adminSql = postgres('postgresql://postgres:postgres@localhost:5432/postgres')
  
  try {
    await adminSql`DROP DATABASE IF EXISTS emailflow`
    await adminSql`CREATE DATABASE emailflow`
    console.log('✅ Database recreated')
  } catch (error) {
    console.error('❌ Database creation error:', error.message)
  } finally {
    await adminSql.end()
  }

  // Connect to emailflow database
  const sql = postgres('postgresql://postgres:postgres@localhost:5432/emailflow')
  
  try {
    // Create all tables
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `

    await sql`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `

    await sql`
      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'draft' NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `

    await sql`
      CREATE TABLE email_queue (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        priority INTEGER DEFAULT 500 NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        error TEXT,
        scheduled_at TIMESTAMP DEFAULT NOW() NOT NULL,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `

    await sql`
      CREATE TABLE email_logs (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        error TEXT,
        metadata JSONB,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `

    await sql`
      CREATE TABLE system_logs (
        id SERIAL PRIMARY KEY,
        level VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        campaign_id INTEGER REFERENCES campaigns(id),
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `

    // Create users
    const adminPassword = await bcrypt.hash('admin123', 10)
    const userPassword = await bcrypt.hash('user123', 10)
    
    const users = await sql`
      INSERT INTO users (email, name, password, role) VALUES
      ('admin@emailflow.com', 'System Administrator', ${adminPassword}, 'admin'),
      ('john@company.com', 'John Smith', ${userPassword}, 'user'),
      ('sarah@startup.com', 'Sarah Johnson', ${userPassword}, 'user'),
      ('mike@enterprise.com', 'Mike Wilson', ${userPassword}, 'user')
      RETURNING id, email, name, role
    `

    // Create customers for each user
    const customerData = []
    const names = ['Alice Brown', 'Bob Davis', 'Carol White', 'David Miller', 'Emma Wilson', 'Frank Taylor', 'Grace Lee', 'Henry Clark', 'Ivy Martinez', 'Jack Anderson']
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.org']
    
    for (let userId = 1; userId <= 4; userId++) {
      const customerCount = userId === 1 ? 1000 : userId === 2 ? 100000 : userId === 3 ? 10000 : 100
      for (let i = 0; i < customerCount; i++) {
        const name = names[i % names.length] + ` ${i + 1}`
        const email = `customer${i + 1}@${domains[i % domains.length]}`
        customerData.push({ userId, name, email })
      }
    }

    // Insert customers in batches
    for (let i = 0; i < customerData.length; i += 1000) {
      const batch = customerData.slice(i, i + 1000)
      const values = batch.map(c => `(${c.userId}, '${c.email}', '${c.name}', 'active', NOW())`).join(',')
      await sql.unsafe(`INSERT INTO customers (user_id, email, name, status, created_at) VALUES ${values}`)
      console.log(`📦 Inserted customers batch ${Math.floor(i/1000) + 1}`)
    }

    // Create campaigns
    const campaigns = await sql`
      INSERT INTO campaigns (user_id, name, subject, content, status, priority, total_recipients, sent_count, open_count, click_count, created_at) VALUES
      (1, 'Welcome Series', 'Welcome to EmailFlow Pro!', '<h1>Welcome!</h1><p>Thank you for joining us.</p>', 'sent', 'high', 1000, 950, 380, 45, NOW() - INTERVAL '5 days'),
      (1, 'Product Launch', 'Introducing Our New Feature', '<h1>New Feature Alert!</h1><p>Check out our latest update.</p>', 'sent', 'normal', 1000, 890, 267, 32, NOW() - INTERVAL '3 days'),
      (2, 'Monthly Newsletter', 'Company Updates - January', '<h1>Monthly Update</h1><p>Here is what happened this month.</p>', 'sending', 'normal', 100000, 45000, 9000, 450, NOW() - INTERVAL '1 day'),
      (3, 'Flash Sale', '50% Off Everything!', '<h1>Flash Sale!</h1><p>Limited time offer.</p>', 'sent', 'high', 10000, 9500, 2850, 285, NOW() - INTERVAL '2 days'),
      (4, 'Event Invitation', 'Join Our Webinar', '<h1>Webinar Invitation</h1><p>Learn something new with us.</p>', 'scheduled', 'normal', 100, 0, 0, 0, NOW() + INTERVAL '2 days')
      RETURNING id, user_id, name, total_recipients
    `

    // Create email queue entries
    for (const campaign of campaigns) {
      const queueCount = Math.min(campaign.total_recipients, 1000)
      for (let i = 0; i < queueCount; i++) {
        const status = campaign.user_id === 2 ? (i < 450 ? 'sent' : 'pending') : 'sent'
        const sentAt = status === 'sent' ? new Date(Date.now() - 3600000) : null
        await sql`
          INSERT INTO email_queue (campaign_id, recipient_email, recipient_name, status, priority, sent_at, created_at)
          VALUES (${campaign.id}, ${`recipient${i}@test.com`}, ${`Recipient ${i}`}, ${status}, ${500 + Math.floor(Math.random() * 200)}, ${sentAt}, NOW())
        `
      }
      console.log(`📧 Created queue for campaign: ${campaign.name}`)
    }

    // Create email logs
    for (const campaign of campaigns) {
      const logCount = Math.floor(campaign.sent_count * 0.1)
      for (let i = 0; i < logCount; i++) {
        const logDate = new Date(Date.now() - 86400000)
        await sql`
          INSERT INTO email_logs (campaign_id, recipient_email, status, sent_at, created_at)
          VALUES (${campaign.id}, ${`log${i}@test.com`}, 'sent', ${logDate}, ${logDate})
        `
      }
    }

    // Create system logs
    const logMessages = ['User login', 'Campaign created', 'Email sent', 'Queue processed']
    for (let i = 0; i < 50; i++) {
      const logDate = new Date(Date.now() - (i * 3600000))
      await sql`
        INSERT INTO system_logs (level, category, message, user_id, created_at)
        VALUES ('info', 'system', ${logMessages[i % 4]}, 1, ${logDate})
      `
    }

    console.log('✅ All tables created and seeded successfully!')
    console.log('👤 Admin: admin@emailflow.com / admin123')
    console.log('👤 Users: john@company.com, sarah@startup.com, mike@enterprise.com / user123')
    console.log('📊 Data: 111,100 customers, 5 campaigns, 50 logs')

  } catch (error) {
    console.error('❌ Setup error:', error.message)
  } finally {
    await sql.end()
  }
}

fullResetAndSeed()