import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaigns, customers, emailQueue } from "@/lib/schema"
import { EmailQueueProcessor } from "@/lib/queue-processor"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenario } = body

    if (scenario === 'priority_demo') {
      return await createPriorityDemo()
    }

    return NextResponse.json({ error: "Invalid scenario" }, { status: 400 })
  } catch (error) {
    console.error("Demo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createPriorityDemo() {
  console.log("🎭 Creating priority queue demo...")

  const allCustomers = await db.select().from(customers).limit(1100)
  
  if (allCustomers.length < 1100) {
    return NextResponse.json({ 
      error: "Not enough customers. Run npm run db:seed first." 
    }, { status: 400 })
  }

  const user1Customers = allCustomers.slice(0, 1000)
  const user2Customers = allCustomers.slice(1000, 1100)

  const [largeCampaign] = await db.insert(campaigns).values({
    userId: user1Customers[0].userId,
    name: "Large Newsletter - 1000 recipients",
    subject: "Monthly Newsletter",
    content: "<h1>Newsletter</h1><p>Our monthly update...</p>",
    status: "sending",
    priority: "normal",
    totalRecipients: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()

  const [smallCampaign] = await db.insert(campaigns).values({
    userId: user2Customers[0].userId,
    name: "Urgent Alert - 100 recipients", 
    subject: "🚨 Urgent: System Maintenance",
    content: "<h1>Urgent</h1><p>System maintenance in 1 hour...</p>",
    status: "sending",
    priority: "high",
    totalRecipients: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()

  const largeQueueEntries = user1Customers.map((customer, index) => ({
    campaignId: largeCampaign.id,
    customerId: customer.id,
    recipientEmail: customer.email,
    recipientName: customer.name,
    status: 'pending' as const,
    priority: EmailQueueProcessor.calculatePriority('normal', 1000, index),
    scheduledAt: new Date(),
    createdAt: new Date()
  }))

  const smallQueueEntries = user2Customers.map((customer, index) => ({
    campaignId: smallCampaign.id,
    customerId: customer.id,
    recipientEmail: customer.email,
    recipientName: customer.name,
    status: 'pending' as const,
    priority: EmailQueueProcessor.calculatePriority('high', 100, index),
    scheduledAt: new Date(),
    createdAt: new Date()
  }))

  await Promise.all([
    db.insert(emailQueue).values(largeQueueEntries),
    db.insert(emailQueue).values(smallQueueEntries)
  ])

  return NextResponse.json({
    message: "Priority queue demo created!",
    campaigns: [
      {
        id: largeCampaign.id,
        name: largeCampaign.name,
        recipients: 1000,
        priority: largeQueueEntries[0].priority,
        type: "Large Newsletter"
      },
      {
        id: smallCampaign.id,
        name: smallCampaign.name,
        recipients: 100,
        priority: smallQueueEntries[0].priority,
        type: "Urgent Alert"
      }
    ],
    explanation: "The urgent alert (100 emails) will be processed before the newsletter (1000 emails) due to higher priority"
  })
}