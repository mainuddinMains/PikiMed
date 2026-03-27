import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

// ── Shared type ───────────────────────────────────────────────────────────────

export type ReviewWithUser = {
  id:                 string
  userId:             string
  doctorId:           string | null
  hospitalId:         string | null
  overallRating:      number
  punctualityRating:  number | null
  qualityRating:      number | null
  staffRating:        number | null
  cleanlinessRating:  number | null
  costFairnessRating: number | null
  body:               string | null
  helpfulCount:       number
  createdAt:          string   // ISO string — safe to cross server→client boundary
  user:               { name: string | null; image: string | null }
}

const PAGE_SIZE = 10

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const sp         = req.nextUrl.searchParams
  const doctorId   = sp.get("doctorId")   ?? undefined
  const hospitalId = sp.get("hospitalId") ?? undefined
  const sort       = sp.get("sort") === "recent" ? "recent" : "helpful"
  const page       = Math.max(1, parseInt(sp.get("page") ?? "1"))

  if (!doctorId && !hospitalId) {
    return NextResponse.json({ error: "doctorId or hospitalId required" }, { status: 400 })
  }

  const where = { doctorId: doctorId ?? null, hospitalId: hospitalId ?? null }

  const orderBy =
    sort === "recent"
      ? { createdAt: "desc" as const }
      : { helpfulCount: "desc" as const }

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy,
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
      include: { user: { select: { name: true, image: true } } },
    }),
  ])

  const data: ReviewWithUser[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return NextResponse.json({ data, total, page, pageSize: PAGE_SIZE })
}

// ── POST ──────────────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  doctorId:           z.string().min(1).optional(),
  hospitalId:         z.string().min(1).optional(),
  overallRating:      z.number().min(1).max(5),
  punctualityRating:  z.number().min(1).max(5).optional(),
  qualityRating:      z.number().min(1).max(5).optional(),
  staffRating:        z.number().min(1).max(5).optional(),
  cleanlinessRating:  z.number().min(1).max(5).optional(),
  costFairnessRating: z.number().min(1).max(5).optional(),
  body:               z.string().min(30, "Review must be at least 30 characters").max(2000).optional(),
})

export async function POST(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to submit a review" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 422 })
  }

  const { doctorId, hospitalId, ...ratings } = parsed.data

  if ((!doctorId && !hospitalId) || (doctorId && hospitalId)) {
    return NextResponse.json(
      { error: "Provide exactly one of doctorId or hospitalId" },
      { status: 400 },
    )
  }

  // 1-per-user duplicate check
  const existing = await prisma.review.findFirst({
    where: {
      userId:     session.user.id,
      doctorId:   doctorId   ?? null,
      hospitalId: hospitalId ?? null,
    },
  })
  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this provider" },
      { status: 409 },
    )
  }

  const review = await prisma.review.create({
    data: {
      userId:     session.user.id,
      doctorId:   doctorId   ?? null,
      hospitalId: hospitalId ?? null,
      ...ratings,
    },
    include: { user: { select: { name: true, image: true } } },
  })

  // Recalculate aggregate rating
  await recalcRating(doctorId, hospitalId)

  return NextResponse.json({
    ...review,
    createdAt: review.createdAt.toISOString(),
  } satisfies ReviewWithUser, { status: 201 })
}

// ── Helper ────────────────────────────────────────────────────────────────────

export async function recalcRating(
  doctorId: string | undefined,
  hospitalId: string | undefined,
) {
  const where = { doctorId: doctorId ?? null, hospitalId: hospitalId ?? null }
  const agg   = await prisma.review.aggregate({
    where,
    _avg:   { overallRating: true },
    _count: { overallRating: true },
  })
  const avgRating   = agg._avg.overallRating
  const reviewCount = agg._count.overallRating

  if (doctorId) {
    await prisma.doctor.update({ where: { id: doctorId }, data: { avgRating, reviewCount } })
  } else if (hospitalId) {
    await prisma.hospital.update({ where: { id: hospitalId }, data: { avgRating, reviewCount } })
  }
}
