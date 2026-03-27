import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const sp = req.nextUrl.searchParams
  const region = sp.get("region")
  if (region !== "BD" && region !== "US") {
    return NextResponse.json({ error: "region must be BD or US" }, { status: 400 })
  }

  const q         = sp.get("q")?.trim()
  const specialty = sp.get("specialty")?.trim()
  const city      = sp.get("city")?.trim()
  const minRating = parseFloat(sp.get("minRating") ?? "0") || 0
  const maxFee    = parseFloat(sp.get("maxFee") ?? "0") || 0
  const avail     = sp.get("available") === "true"
  const sort      = sp.get("sort") ?? "relevance"
  const page      = Math.max(1, parseInt(sp.get("page") ?? "1"))

  const where: Prisma.DoctorWhereInput = {
    region,
    ...(specialty && { specialty: { contains: specialty, mode: "insensitive" } }),
    ...(city      && { city:      { contains: city,      mode: "insensitive" } }),
    ...(minRating  > 0 && { avgRating:     { gte: minRating } }),
    ...(maxFee     > 0 && { consultFeeMax: { lte: maxFee   } }),
    ...(avail      && { isAvailableToday: true }),
    ...(q && {
      OR: [
        { name:      { contains: q, mode: "insensitive" } },
        { specialty: { contains: q, mode: "insensitive" } },
        { city:      { contains: q, mode: "insensitive" } },
        { district:  { contains: q, mode: "insensitive" } },
      ],
    }),
  }

  const orderBy: Prisma.DoctorOrderByWithRelationInput =
    sort === "rating"     ? { avgRating:     "desc" } :
    sort === "price_asc"  ? { consultFeeMin: "asc"  } :
    sort === "price_desc" ? { consultFeeMax: "desc" } :
    /* relevance */         { avgRating:     "desc" }

  const [total, data] = await Promise.all([
    prisma.doctor.count({ where }),
    prisma.doctor.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  return NextResponse.json({ data, total, page, pageSize: PAGE_SIZE })
}
