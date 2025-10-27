import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailQueue } from "@/lib/schema"
import { eq, sql, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    // Get queue statistics
    const stats = await db
      .select({
        status: emailQueue.status,
        count: count()
      })
      .from(emailQueue)
      .groupBy(emailQueue.status)

    // Convert to object format
    const queueStats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0
    }

    stats.forEach(stat => {
      if (stat.status in queueStats) {
        queueStats[stat.status as keyof typeof queueStats] = stat.count
      }
    })

    // Get priority distribution for pending emails
    const priorityStats = await db
      .select({
        priority: sql`CASE 
          WHEN ${emailQueue.priority} >= 1000 THEN 'high'
          WHEN ${emailQueue.priority} >= 500 THEN 'normal'
          ELSE 'low'
        END`.as('priority'),
        count: count()
      })
      .from(emailQueue)
      .where(eq(emailQueue.status, 'pending'))
      .groupBy(sql`CASE 
        WHEN ${emailQueue.priority} >= 1000 THEN 'high'
        WHEN ${emailQueue.priority} >= 500 THEN 'normal'
        ELSE 'low'
      END`)

    // Get processing throughput (emails processed in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const [throughputResult] = await db
      .select({ count: count() })
      .from(emailQueue)
      .where(
        sql`${emailQueue.sentAt} >= ${oneHourAgo} OR ${emailQueue.updatedAt} >= ${oneHourAgo}`
      )

    const throughput = throughputResult?.count || 0

    return NextResponse.json({
      ...queueStats,
      priorityDistribution: priorityStats,
      throughputPerHour: throughput,
      totalInQueue: queueStats.pending + queueStats.processing
    })
  } catch (error) {
    console.error("Error fetching queue status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}