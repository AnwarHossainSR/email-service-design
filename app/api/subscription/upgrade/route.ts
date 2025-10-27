import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import jwt from "jsonwebtoken"

const planLimits = {
  free: 20,
  pro: 10000,
  enterprise: 100000
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const { plan } = await request.json()

    if (!planLimits[plan as keyof typeof planLimits]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const expiresAt = plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

    await db
      .update(users)
      .set({
        subscriptionPlan: plan,
        emailLimit: planLimits[plan as keyof typeof planLimits],
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscription upgrade error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}