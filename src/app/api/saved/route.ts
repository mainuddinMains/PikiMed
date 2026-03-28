import { NextRequest, NextResponse } from "next/server"
import { z }             from "zod"
import { prisma }        from "@/lib/prisma"
import { auth }          from "@/auth"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

// ── GET /api/saved — all saved providers for the current user ─────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const saved = await prisma.savedProvider.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: {
        select: {
          id: true, name: true, slug: true, specialty: true,
          city: true, district: true, state: true,
          avgRating: true, reviewCount: true, isAvailableToday: true,
          consultFeeMin: true, consultFeeMax: true, currency: true,
          phone: true, bmdc: true, npi: true, region: true,
        },
      },
      hospital: {
        select: {
          id: true, name: true, slug: true, type: true,
          city: true, district: true, state: true,
          avgRating: true, reviewCount: true,
          isOpen24h: true, openTime: true, closeTime: true,
          phone: true, address: true, region: true,
          specialties: true,
        },
      },
    },
  })

  return NextResponse.json(saved)
}

// ── POST /api/saved — toggle save/unsave ──────────────────────────────────────

const ToggleSchema = z
  .object({
    doctorId:   z.string().optional(),
    hospitalId: z.string().optional(),
  })
  .refine((v) => v.doctorId || v.hospitalId, {
    message: "doctorId or hospitalId is required",
  })

export async function POST(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = ToggleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { doctorId, hospitalId } = parsed.data
  const userId = session.user.id

  // Build the unique lookup condition
  const where = doctorId
    ? { userId_doctorId:   { userId, doctorId } }
    : { userId_hospitalId: { userId, hospitalId: hospitalId! } }

  const existing = await prisma.savedProvider.findUnique({ where })

  if (existing) {
    // Unsave
    await prisma.savedProvider.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false, id: null })
  }

  // Save
  const created = await prisma.savedProvider.create({
    data: { userId, doctorId, hospitalId },
  })
  return NextResponse.json({ saved: true, id: created.id }, { status: 201 })
}
