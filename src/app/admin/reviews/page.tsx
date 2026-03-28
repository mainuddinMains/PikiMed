import { prisma } from "@/lib/prisma"
import ReviewsClient from "./ReviewsClient"

export const metadata = { title: "Reviews | PikiMed Admin" }

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user:     { select: { name: true, email: true } },
      doctor:   { select: { name: true } },
      hospital: { select: { name: true } },
    },
  })

  const serialized = reviews.map((r) => ({
    id:            r.id,
    overallRating: r.overallRating,
    body:          r.body,
    helpfulCount:  r.helpfulCount,
    createdAt:     r.createdAt.toISOString(),
    user:          r.user,
    doctor:        r.doctor,
    hospital:      r.hospital,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Reviews</h1>
        <p className="text-sm text-slate-500 mt-0.5">{reviews.length} total · select rows to bulk-delete</p>
      </div>
      <ReviewsClient reviews={serialized} />
    </div>
  )
}
