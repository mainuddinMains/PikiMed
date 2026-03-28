import { NextRequest, NextResponse } from "next/server"
import { z }       from "zod"
import { auth }    from "@/auth"
import { prisma }  from "@/lib/prisma"
import { recalcRating } from "@/lib/recalcRating"

// ── DELETE ────────────────────────────────────────────────────────────────────

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

// ── PATCH ─────────────────────────────────────────────────────────────────────

const EditSchema = z.object({
  overallRating:      z.number().min(1).max(5).optional(),
  punctualityRating:  z.number().min(1).max(5).nullable().optional(),
  qualityRating:      z.number().min(1).max(5).nullable().optional(),
  staffRating:        z.number().min(1).max(5).nullable().optional(),
  cleanlinessRating:  z.number().min(1).max(5).nullable().optional(),
  costFairnessRating: z.number().min(1).max(5).nullable().optional(),
  body:               z.string().trim().min(30).max(2000).optional(),
}).refine(
  (v) => v.overallRating !== undefined || v.body !== undefined,
  { message: "At least one field required" },
)

export async function PATCH(
  req: NextRequest,
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

  if (review.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = EditSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const updated = await prisma.review.update({
    where: { id: params.id },
    data:  parsed.data,
  })

  if (parsed.data.overallRating !== undefined) {
    await recalcRating(review.doctorId ?? undefined, review.hospitalId ?? undefined)
  }

  return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() })
}
