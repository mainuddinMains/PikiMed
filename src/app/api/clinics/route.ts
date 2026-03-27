import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export async function GET(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const sp        = req.nextUrl.searchParams
  const lat       = parseFloat(sp.get("lat") ?? "")
  const lng       = parseFloat(sp.get("lng") ?? "")
  const radius    = parseFloat(sp.get("radius") ?? "50")  // km
  const isSliding = sp.get("isSliding")
  const isFree    = sp.get("isFree")
  const language  = sp.get("language")?.trim()
  const service   = sp.get("service")?.trim()

  const hasLocation = !isNaN(lat) && !isNaN(lng)

  const clinics = await prisma.affordableClinic.findMany({
    where: {
      ...(isSliding === "true"  && { isSliding: true }),
      ...(isFree    === "true"  && { isFree:    true }),
      ...(language              && { languages: { has: language } }),
      ...(service               && { servicesOffered: { has: service } }),
    },
    orderBy: { name: "asc" },
  })

  const withDistance = clinics.map((c) => ({
    ...c,
    distanceKm:
      hasLocation && c.lat != null && c.lng != null
        ? haversineKm(lat, lng, c.lat, c.lng)
        : null,
  }))

  // Filter by radius if location provided
  const filtered = hasLocation
    ? withDistance.filter((c) => c.distanceKm == null || c.distanceKm <= radius)
    : withDistance

  // Sort: by distance if available, else alphabetically
  filtered.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
    if (a.distanceKm != null) return -1
    if (b.distanceKm != null) return 1
    return 0
  })

  return NextResponse.json(filtered)
}
