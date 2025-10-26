import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customers } from "@/lib/schema"
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

    const userCustomers = await db.query.customers.findMany({
      where: (customers, { eq }) => eq(customers.userId, userId),
      orderBy: (customers, { desc }) => desc(customers.createdAt),
    })

    return NextResponse.json(userCustomers)
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newCustomer = await db
      .insert(customers)
      .values({
        userId,
        email,
        name,
      })
      .returning()

    return NextResponse.json(newCustomer[0], { status: 201 })
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
