import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaigns, emailQueue } from "@/lib/schema"
import { verifyToken } from "@/lib/auth"

function getUserIdFromRequest(request: NextRequest): number | null {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.userId || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userCampaigns = await db.query.campaigns.findMany({
      where: (campaigns, { eq }) => eq(campaigns.userId, userId),
      orderBy: (campaigns, { desc }) => desc(campaigns.createdAt),
    })

    return NextResponse.json(userCampaigns)
  } catch (error) {
    console.error("Get campaigns error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, subject, content, recipientIds, priority, scheduledAt } = await request.json()

    if (!name || !subject || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create campaign
    const newCampaign = await db
      .insert(campaigns)
      .values({
        userId,
        name,
        subject,
        content,
        priority: priority || 0,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : "draft",
        totalRecipients: recipientIds?.length || 0,
      })
      .returning()

    // Add emails to queue
    if (recipientIds && recipientIds.length > 0) {
      const queueItems = await Promise.all(
        recipientIds.map(async (customerId: number) => {
          const customer = await db.query.customers.findFirst({
            where: (customers, { eq }) => eq(customers.id, customerId),
          })

          if (!customer) return null

          return {
            campaignId: newCampaign[0].id,
            customerId,
            recipientEmail: customer.email,
            status: "pending" as const,
          }
        }),
      )

      const validItems = queueItems.filter((item) => item !== null)
      if (validItems.length > 0) {
        await db.insert(emailQueue).values(validItems)
      }
    }

    return NextResponse.json(newCampaign[0], { status: 201 })
  } catch (error) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
