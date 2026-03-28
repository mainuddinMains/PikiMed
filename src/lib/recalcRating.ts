import { prisma } from "@/lib/prisma"

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
