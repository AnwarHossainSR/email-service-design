import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaigns } from "@/lib/schema"
import { verifyToken } from "@/lib/auth"
import { eq, and } from "drizzle-orm"

function getUserIdFromRequest(request: NextRequest): number | null {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.userId || null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const campaign = await db.query.campaigns.findFirst({
      where: (campaigns, { eq, and }) => and(eq(campaigns.id, Number.parseInt(id)), eq(campaigns.userId, userId)),
      with: {
        emailQueue: true,
        emailLogs: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Get campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { status, name, subject, content } = await request.json()

    const updated = await db
      .update(campaigns)
      .set({
        status,
        name,
        subject,
        content,
        updatedAt: new Date(),
      })
      .where(and(eq(campaigns.id, Number.parseInt(id)), eq(campaigns.userId, userId)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Update campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const deleted = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, Number.parseInt(id)), eq(campaigns.userId, userId)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
