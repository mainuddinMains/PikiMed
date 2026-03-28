import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"
import type { Doctor, Hospital } from "@/components/home/types"

const PAGE_SIZE = 10

export type SearchItemType = "doctor" | "hospital"

export type SearchItem =
  | ({ itemType: "doctor" }   & Doctor)
  | ({ itemType: "hospital" } & Hospital)

export interface SearchResponse {
  data:     SearchItem[]
  total:    number
  page:     number
  pageSize: number
}

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

  const q         = sp.get("q")?.trim() ?? ""
  const specialty = sp.get("specialty")?.trim()
  const city      = sp.get("city")?.trim()
  const type      = sp.get("type")?.trim()   // "doctor" | "hospital" | ""
  const sort      = sp.get("sort") ?? "relevance"
  const minRating = parseFloat(sp.get("minRating") ?? "0") || 0
  const maxFee    = parseFloat(sp.get("maxFee") ?? "0") || 0
  const avail     = sp.get("available") === "true"
  const page      = Math.max(1, parseInt(sp.get("page") ?? "1"))

  const includeDoctors  = !type || type === "doctor"
  const includeHospitals = !type || type === "hospital"

  // ── Doctor query ────────────────────────────────────────────────────────────

  const doctorWhere: Prisma.DoctorWhereInput = {
    region,
    ...(specialty && { specialty: { contains: specialty, mode: "insensitive" } }),
    ...(city      && { city:      { contains: city,      mode: "insensitive" } }),
    ...(minRating > 0 && { avgRating:     { gte: minRating } }),
    ...(maxFee    > 0 && { consultFeeMax: { lte: maxFee   } }),
    ...(avail     && { isAvailableToday: true }),
    ...(q && {
      OR: [
        { name:      { contains: q, mode: "insensitive" } },
        { specialty: { contains: q, mode: "insensitive" } },
        { city:      { contains: q, mode: "insensitive" } },
      ],
    }),
  }

  // ── Hospital query ──────────────────────────────────────────────────────────

  const VALID_TYPES = ["GOVERNMENT", "PRIVATE", "DIAGNOSTIC", "FQHC"]
  const hospitalType = sp.get("hospitalType")?.toUpperCase()

  const hospitalWhere: Prisma.HospitalWhereInput = {
    region,
    ...(city && { city: { contains: city, mode: "insensitive" } }),
    ...(hospitalType && VALID_TYPES.includes(hospitalType) && {
      type: hospitalType as Prisma.EnumHospitalTypeFilter,
    }),
    ...(q && {
      OR: [
        { name:    { contains: q, mode: "insensitive" } },
        { city:    { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ],
    }),
  }

  // ── Sorting ────────────────────────────────────────────────────────────────

  const doctorOrder: Prisma.DoctorOrderByWithRelationInput =
    sort === "price_asc"  ? { consultFeeMin: "asc"  } :
    sort === "price_desc" ? { consultFeeMax: "desc" } :
    { avgRating: "desc" }

  const hospitalOrder: Prisma.HospitalOrderByWithRelationInput =
    sort === "rating" ? { avgRating: "desc" } : { name: "asc" }

  // ── Fetch both concurrently ─────────────────────────────────────────────────

  const half = Math.ceil(PAGE_SIZE / 2)

  const [
    doctorTotal,  doctors,
    hospitalTotal, hospitals,
  ] = await Promise.all([
    includeDoctors  ? prisma.doctor.count({ where: doctorWhere })   : Promise.resolve(0),
    includeDoctors  ? prisma.doctor.findMany({
      where:   doctorWhere,
      orderBy: doctorOrder,
      skip:    (page - 1) * (includeHospitals ? half : PAGE_SIZE),
      take:    includeHospitals ? half : PAGE_SIZE,
    }) : Promise.resolve([]),

    includeHospitals ? prisma.hospital.count({ where: hospitalWhere }) : Promise.resolve(0),
    includeHospitals ? prisma.hospital.findMany({
      where:   hospitalWhere,
      orderBy: hospitalOrder,
      skip:    (page - 1) * (includeDoctors ? half : PAGE_SIZE),
      take:    includeDoctors ? half : PAGE_SIZE,
    }) : Promise.resolve([]),
  ])

  // Interleave: doc, hospital, doc, hospital …
  const tagged: SearchItem[] = []
  const maxLen = Math.max(doctors.length, hospitals.length)
  for (let i = 0; i < maxLen; i++) {
    if (doctors[i])   tagged.push({ itemType: "doctor",   ...doctors[i]   } as SearchItem)
    if (hospitals[i]) tagged.push({ itemType: "hospital", ...hospitals[i] } as SearchItem)
  }

  const total = doctorTotal + hospitalTotal

  return NextResponse.json({ data: tagged, total, page, pageSize: PAGE_SIZE } satisfies SearchResponse)
}
