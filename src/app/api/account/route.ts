import { NextRequest, NextResponse } from "next/server"
import { auth }   from "@/auth"
import { prisma } from "@/lib/prisma"

// ── DELETE /api/account — permanently delete the authenticated user ────────────

export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Cascade deletes: reviews, saved providers, sessions, accounts (via Prisma relations)
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ deleted: true })
}
