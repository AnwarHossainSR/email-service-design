import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaigns, emailQueue } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"
import jwt from "jsonwebtoken"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    await logger.apiInfo("Fetching user campaigns", { userId })

    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt))

    return NextResponse.json({ campaigns: userCampaigns })
  } catch (error) {
    await logger.apiError("Failed to fetch campaigns", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const body = await request.json()

    const { name, subject, content, recipients, priority = 'normal', scheduledAt } = body

    // Create campaign
    const [campaign] = await db
      .insert(campaigns)
      .values({
        userId,
        name,
        subject,
        content,
        status: scheduledAt ? 'scheduled' : 'draft',
        totalRecipients: recipients.length,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    // Add emails to queue with priority-based batching
    const batchSize = getPriorityBatchSize(priority, recipients.length)
    const queueEntries = recipients.map((recipient: any, index: number) => ({
      campaignId: campaign.id,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      status: 'pending' as const,
      priority: getPriorityScore(priority, recipients.length, index),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      createdAt: new Date()
    }))

    await db.insert(emailQueue).values(queueEntries)

    await logger.queueInfo("Campaign queued for processing", {
      campaignId: campaign.id,
      campaignName: campaign.name,
      recipientCount: queueEntries.length,
      priority
    }, userId, campaign.id)

    return NextResponse.json({ campaign, queued: queueEntries.length })
  } catch (error) {
    await logger.apiError("Failed to create campaign", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getPriorityBatchSize(priority: string, totalRecipients: number): number {
  // Smaller batches for high priority, larger for low priority
  switch (priority) {
    case 'high': return Math.min(100, Math.ceil(totalRecipients / 10))
    case 'normal': return Math.min(500, Math.ceil(totalRecipients / 5))
    case 'low': return Math.min(1000, Math.ceil(totalRecipients / 2))
    default: return 500
  }
}

function getPriorityScore(priority: string, totalRecipients: number, index: number): number {
  // Higher score = higher priority in queue
  const basePriority = {
    'high': 1000,
    'normal': 500,
    'low': 100
  }[priority] || 500

  // Smaller campaigns get priority boost
  const sizePenalty = Math.min(totalRecipients / 1000, 500)
  
  // Earlier emails in batch get slight priority
  const positionBonus = Math.max(0, 50 - (index / 100))

  return basePriority - sizePenalty + positionBonus
}