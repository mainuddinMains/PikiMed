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

  const q    = sp.get("q")?.trim()
  const city = sp.get("city")?.trim()
  const type = sp.get("type")?.toUpperCase()
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"))
  const sort = sp.get("sort") ?? "relevance"

  const VALID_TYPES = ["GOVERNMENT", "PRIVATE", "DIAGNOSTIC", "FQHC"]

  const where: Prisma.HospitalWhereInput = {
    region,
    ...(city && { city: { contains: city, mode: "insensitive" } }),
    ...(type && VALID_TYPES.includes(type) && { type: type as Prisma.EnumHospitalTypeFilter }),
    ...(q && {
      OR: [
        { name:    { contains: q, mode: "insensitive" } },
        { city:    { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ],
    }),
  }

  const orderBy: Prisma.HospitalOrderByWithRelationInput =
    sort === "rating" ? { avgRating: "desc" } :
    /* relevance */     { name: "asc" }

  const [total, data] = await Promise.all([
    prisma.hospital.count({ where }),
    prisma.hospital.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  return NextResponse.json({ data, total, page, pageSize: PAGE_SIZE })
}
