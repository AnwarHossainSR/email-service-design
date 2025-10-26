import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
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

    // Get user's campaigns
    const userCampaigns = await db.query.campaigns.findMany({
      where: (campaigns, { eq }) => eq(campaigns.userId, userId),
    })

    const campaignIds = userCampaigns.map((c) => c.id)

    if (campaignIds.length === 0) {
      return NextResponse.json({
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        campaignStats: [],
      })
    }

    // Get email logs for user's campaigns
    const logs = await db.query.emailLogs.findMany({
      where: (emailLogs, { inArray }) => inArray(emailLogs.campaignId, campaignIds),
    })

    // Calculate statistics
    const totalSent = logs.filter((l) => l.status === "sent").length
    const totalFailed = logs.filter((l) => l.status === "failed").length
    const totalBounced = logs.filter((l) => l.status === "bounced").length
    const successRate = logs.length > 0 ? Math.round((totalSent / logs.length) * 100) : 0

    // Campaign-level stats
    const campaignStats = userCampaigns.map((campaign) => {
      const campaignLogs = logs.filter((l) => l.campaignId === campaign.id)
      const sent = campaignLogs.filter((l) => l.status === "sent").length
      const failed = campaignLogs.filter((l) => l.status === "failed").length

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalRecipients: campaign.totalRecipients,
        sent: sent,
        failed: failed,
        successRate: campaign.totalRecipients > 0 ? Math.round((sent / campaign.totalRecipients) * 100) : 0,
        createdAt: campaign.createdAt,
      }
    })

    return NextResponse.json({
      totalSent,
      totalFailed,
      totalBounced,
      successRate,
      campaignStats,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
