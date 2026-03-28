import { NextRequest, NextResponse } from "next/server"
import { prisma }        from "@/lib/prisma"
import { auth }          from "@/auth"

import { z }             from "zod"

// ── Per-user-per-doctor rate limit: 1 update per 4 hours ──────────────────────
// key: `${userId}:${slug}` → timestamp of last allowed update

const WINDOW_MS = 4 * 60 * 60 * 1000   // 4 hours

const rateLimitStore = new Map<string, number>()

function checkAvailabilityRateLimit(userId: string, slug: string): boolean {
  const key = `${userId}:${slug}`
  const now  = Date.now()
  const last = rateLimitStore.get(key)
  if (last && now - last < WINDOW_MS) return false
  rateLimitStore.set(key, now)

  // Probabilistic GC
  if (Math.random() < 0.02) {
    Array.from(rateLimitStore.entries()).forEach(([k, ts]) => {
      if (now - ts > WINDOW_MS) rateLimitStore.delete(k)
    })
  }
  return true
}

// ── Validation ─────────────────────────────────────────────────────────────────

const AvailabilitySchema = z.object({
  isAvailableToday: z.boolean().optional(),
  avgWaitMinutes:   z.number().int().min(0).max(300).optional(),
}).refine(
  (v) => v.isAvailableToday !== undefined || v.avgWaitMinutes !== undefined,
  { message: "At least one field is required" },
)

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  // Auth
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = params

  // Rate limit
  if (!checkAvailabilityRateLimit(session.user.id, slug)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. You can update once every 4 hours per doctor." },
      { status: 429 },
    )
  }

  // Parse + validate body
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = AvailabilitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Find doctor
  const doctor = await prisma.doctor.findUnique({
    where:  { slug },
    select: { id: true, region: true },
  })
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
  }

  // Only BD doctors have community availability tracking
  if (doctor.region !== "BD") {
    return NextResponse.json({ error: "Not supported for this region" }, { status: 400 })
  }

  // Update
  const data: { isAvailableToday?: boolean; avgWaitMinutes?: number } = {}
  if (parsed.data.isAvailableToday !== undefined) data.isAvailableToday = parsed.data.isAvailableToday
  if (parsed.data.avgWaitMinutes   !== undefined) data.avgWaitMinutes   = parsed.data.avgWaitMinutes

  const updated = await prisma.doctor.update({
    where:  { id: doctor.id },
    data,
    select: { isAvailableToday: true, avgWaitMinutes: true },
  })

  return NextResponse.json({ ...updated, updatedAt: new Date().toISOString() })
}
