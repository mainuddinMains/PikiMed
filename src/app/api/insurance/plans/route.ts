import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

export async function GET(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const sp   = req.nextUrl.searchParams
  const q    = sp.get("q")?.trim()
  const type = sp.get("type")?.toUpperCase()
  const state = sp.get("state")?.trim()

  const VALID_TYPES = ["PPO", "HMO", "HDHP", "MEDICAID", "MEDICARE", "CHIP"]

  const plans = await prisma.insurancePlan.findMany({
    where: {
      ...(q && {
        OR: [
          { name:     { contains: q, mode: "insensitive" } },
          { provider: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(type && VALID_TYPES.includes(type) && { type: type as "PPO" }),
      ...(state && { OR: [{ state }, { state: null }] }),
    },
    orderBy: [{ provider: "asc" }, { name: "asc" }],
  })

  return NextResponse.json(plans)
}
