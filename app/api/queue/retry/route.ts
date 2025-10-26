import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailQueue } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { emailQueueId } = await request.json()

    if (!emailQueueId) {
      return NextResponse.json({ error: "Missing emailQueueId" }, { status: 400 })
    }

    // Reset failed email to pending for retry
    const updated = await db
      .update(emailQueue)
      .set({
        status: "pending",
        attempts: 0,
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.id, emailQueueId))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, email: updated[0] })
  } catch (error) {
    console.error("Retry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
