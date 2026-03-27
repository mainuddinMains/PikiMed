import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const hospital = await prisma.hospital.findUnique({
    where: { slug: params.slug },
    include: {
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      hospitalInsurance: {
        include: { insurancePlan: true },
        orderBy: { insurancePlan: { name: "asc" } },
      },
    },
  })

  if (!hospital) {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 })
  }

  return NextResponse.json(hospital)
}
