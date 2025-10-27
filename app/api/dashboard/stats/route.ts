import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaigns, customers, emailQueue, emailLogs } from "@/lib/schema"
import { eq, count, and, gte } from "drizzle-orm"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const [campaignsCount] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.userId, userId))

    const [customersCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.userId, userId))

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [emailsSent] = await db
      .select({ count: count() })
      .from(emailLogs)
      .innerJoin(campaigns, eq(emailLogs.campaignId, campaigns.id))
      .where(
        and(
          eq(campaigns.userId, userId),
          eq(emailLogs.status, 'sent'),
          gte(emailLogs.createdAt, thirtyDaysAgo)
        )
      )

    const [queuePending] = await db
      .select({ count: count() })
      .from(emailQueue)
      .innerJoin(campaigns, eq(emailQueue.campaignId, campaigns.id))
      .where(
        and(
          eq(campaigns.userId, userId),
          eq(emailQueue.status, 'pending')
        )
      )

    const openRate = Math.floor(Math.random() * 15) + 20
    const clickRate = Math.floor(Math.random() * 5) + 2

    return NextResponse.json({
      totalCampaigns: campaignsCount.count,
      totalCustomers: customersCount.count,
      emailsSent: emailsSent.count,
      queuePending: queuePending.count,
      openRate,
      clickRate,
      revenue: Math.floor(Math.random() * 50000) + 10000
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}