import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { recalcRating } from "@/app/api/reviews/route"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const review = await prisma.review.findUnique({ where: { id: params.id } })
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 })
  }

  const isAuthor = review.userId === session.user.id
  const isAdmin  = session.user.role === "ADMIN"
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.review.delete({ where: { id: params.id } })
  await recalcRating(review.doctorId ?? undefined, review.hospitalId ?? undefined)

  return NextResponse.json({ deleted: true })
}
