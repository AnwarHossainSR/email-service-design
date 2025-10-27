import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { systemLogs } from "@/lib/schema"
import { desc, eq, and, gte } from "drizzle-orm"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const notifications = await db
      .select({
        id: systemLogs.id,
        level: systemLogs.level,
        category: systemLogs.category,
        message: systemLogs.message,
        createdAt: systemLogs.createdAt,
        metadata: systemLogs.metadata
      })
      .from(systemLogs)
      .where(
        and(
          eq(systemLogs.userId, userId),
          gte(systemLogs.createdAt, oneDayAgo)
        )
      )
      .orderBy(desc(systemLogs.createdAt))
      .limit(10)

    const systemNotifications = [
      {
        id: 'sys-1',
        level: 'info',
        category: 'system',
        message: 'Welcome to EmailFlow Pro!',
        createdAt: new Date().toISOString(),
        metadata: null
      },
      {
        id: 'sys-2', 
        level: 'info',
        category: 'queue',
        message: 'Email queue processing',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        metadata: null
      }
    ]

    const allNotifications = [...systemNotifications, ...notifications]

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount: allNotifications.filter(n => n.level === 'error' || n.level === 'warn').length
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}