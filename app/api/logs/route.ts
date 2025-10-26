import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { systemLogs } from "@/lib/schema"
import { desc, eq, and, like, gte, lte, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const level = searchParams.get('level')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const offset = (page - 1) * limit

    const conditions = []
    
    if (level) conditions.push(eq(systemLogs.level, level))
    if (category) conditions.push(eq(systemLogs.category, category))
    if (search) conditions.push(like(systemLogs.message, `%${search}%`))
    if (startDate) conditions.push(gte(systemLogs.createdAt, new Date(startDate)))
    if (endDate) conditions.push(lte(systemLogs.createdAt, new Date(endDate)))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const logs = await db
      .select()
      .from(systemLogs)
      .where(whereClause)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit)
      .offset(offset)

    const [{ total }] = await db
      .select({ total: count() })
      .from(systemLogs)
      .where(whereClause)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}