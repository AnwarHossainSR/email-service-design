import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const [user] = await db
      .select({
        subscriptionPlan: users.subscriptionPlan,
        emailsSentThisMonth: users.emailsSentThisMonth,
        emailLimit: users.emailLimit,
        subscriptionExpiresAt: users.subscriptionExpiresAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      plan: user.subscriptionPlan || 'free',
      emailsSent: user.emailsSentThisMonth || 0,
      emailLimit: user.emailLimit || 20,
      expiresAt: user.subscriptionExpiresAt
    })
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}