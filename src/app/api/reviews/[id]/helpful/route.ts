import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

// Increments helpfulCount. No junction table exists to track per-user votes,
// so we increment and let the client track "already voted" in local state.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to vote" }, { status: 401 })
  }

  const review = await prisma.review.findUnique({ where: { id: params.id } })
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.review.update({
    where: { id: params.id },
    data:  { helpfulCount: { increment: 1 } },
    select: { helpfulCount: true },
  })

  return NextResponse.json({ helpfulCount: updated.helpfulCount })
}
