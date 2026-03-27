import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export async function GET(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const sp     = req.nextUrl.searchParams
  const planId = sp.get("planId")
  const lat    = parseFloat(sp.get("lat") ?? "")
  const lng    = parseFloat(sp.get("lng") ?? "")

  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 })
  }

  // All US hospitals + which ones accept this plan
  const [allHospitals, inNetworkLinks] = await Promise.all([
    prisma.hospital.findMany({
      where:   { region: "US" },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, slug: true, type: true,
        address: true, city: true, state: true,
        lat: true, lng: true, phone: true,
        specialties: true, avgRating: true,
        isOpen24h: true, openTime: true, closeTime: true,
      },
    }),
    prisma.hospitalInsurance.findMany({
      where:  { insurancePlanId: planId },
      select: { hospitalId: true },
    }),
  ])

  const inNetworkIds = new Set(inNetworkLinks.map((l) => l.hospitalId))

  const hasLocation = !isNaN(lat) && !isNaN(lng)

  const result = allHospitals
    .map((h) => ({
      ...h,
      inNetwork:  inNetworkIds.has(h.id),
      distanceKm:
        hasLocation && h.lat != null && h.lng != null
          ? haversineKm(lat, lng, h.lat, h.lng)
          : null,
    }))
    .sort((a, b) => {
      // In-network first, then by distance
      if (a.inNetwork !== b.inNetwork) return a.inNetwork ? -1 : 1
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
      return 0
    })

  return NextResponse.json(result)
}
