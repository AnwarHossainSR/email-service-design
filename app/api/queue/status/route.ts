import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailQueue } from "@/lib/schema"
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

    // Get queue statistics
    const stats = await db
      .select({
        status: emailQueue.status,
        count: emailQueue.id,
      })
      .from(emailQueue)
      .groupBy(emailQueue.status)

    const queueStats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
    }

    stats.forEach((stat) => {
      if (stat.status in queueStats) {
        queueStats[stat.status as keyof typeof queueStats] = stat.count as unknown as number
      }
    })

    return NextResponse.json(queueStats)
  } catch (error) {
    console.error("Queue status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
