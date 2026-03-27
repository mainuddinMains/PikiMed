"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import StarRating from "@/components/detail/StarRating"
import ReviewCard from "@/components/ReviewCard"
import ReviewForm from "@/components/ReviewForm"
import type { ReviewWithUser } from "@/app/api/reviews/route"

// ── Fetch ──────────────────────────────────────────────────────────────────────

interface FetchParams {
  doctorId?:   string
  hospitalId?: string
  page:        number
  sort:        "helpful" | "recent"
}

async function fetchReviews(p: FetchParams) {
  const sp = new URLSearchParams({ page: String(p.page), sort: p.sort })
  if (p.doctorId)   sp.set("doctorId",   p.doctorId)
  if (p.hospitalId) sp.set("hospitalId", p.hospitalId)
  const res = await fetch(`/api/reviews?${sp}`)
  if (!res.ok) throw new Error("Failed to load reviews")
  return res.json() as Promise<{ data: ReviewWithUser[]; total: number; page: number; pageSize: number }>
}

// ── Rating distribution bar ────────────────────────────────────────────────────

function DistBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-right tabular-nums text-slate-500">{star}★</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 tabular-nums text-slate-400">{pct}%</span>
    </div>
  )
}

// ── Sub-rating bar ─────────────────────────────────────────────────────────────

function SubBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

function avgOf(reviews: ReviewWithUser[], key: keyof ReviewWithUser): number | null {
  const nums = reviews
    .map((r) => r[key] as number | null)
    .filter((v): v is number => v != null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

// ── ReviewsWidget ──────────────────────────────────────────────────────────────

interface ReviewsWidgetProps {
  doctorId?:       string
  hospitalId?:     string
  initialReviews:  ReviewWithUser[]
  avgRating:       number | null
  reviewCount:     number
}

export default function ReviewsWidget({
  doctorId,
  hospitalId,
  initialReviews,
  avgRating: initialAvg,
  reviewCount: initialCount,
}: ReviewsWidgetProps) {
  const { data: session } = useSession()
  const queryClient       = useQueryClient()

  const [sort,      setSort]      = useState<"helpful" | "recent">("helpful")
  const [page,      setPage]      = useState(1)
  const [showForm,  setShowForm]  = useState(false)
  // Optimistic additions live here until the query re-fetches
  const [optimistic, setOptimistic] = useState<ReviewWithUser[]>([])
  // Soft-deleted IDs (removed optimistically, removed from query on next fetch)
  const [deleted, setDeleted] = useState<Set<string>>(new Set())

  const qKey = ["reviews", doctorId ?? hospitalId, sort, page]

  const { data, isFetching } = useQuery({
    queryKey:    qKey,
    queryFn:     () => fetchReviews({ doctorId, hospitalId, page, sort }),
    placeholderData: {
      data:     initialReviews,
      total:    initialCount,
      page:     1,
      pageSize: 10,
    },
    staleTime: 30_000,
  })

  const reviews  = (data?.data ?? initialReviews).filter((r) => !deleted.has(r.id))
  const total    = (data?.total ?? initialCount) - deleted.size
  const hasMore  = (data?.page ?? 1) * (data?.pageSize ?? 10) < total

  // All reviews (optimistic prepended) for computing averages shown in summary
  const allForStats = [...optimistic, ...reviews]

  // Compute dynamic averages from loaded data
  const displayAvg = allForStats.length > 0
    ? allForStats.reduce((s, r) => s + r.overallRating, 0) / allForStats.length
    : initialAvg

  const displayCount = total + optimistic.length

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allForStats.filter((r) => Math.round(r.overallRating) === star).length,
  }))

  const subAvgs = {
    "Wait / Punctuality": avgOf(allForStats, "punctualityRating"),
    "Quality of Care":    avgOf(allForStats, "qualityRating"),
    "Staff Attitude":     avgOf(allForStats, "staffRating"),
    "Cleanliness":        avgOf(allForStats, "cleanlinessRating"),
    "Cost Fairness":      avgOf(allForStats, "costFairnessRating"),
  }

  const hasSubData = Object.values(subAvgs).some((v) => v != null)

  const handleNewReview = useCallback((review: ReviewWithUser) => {
    setOptimistic((prev) => [review, ...prev])
    setShowForm(false)
    // Invalidate so stale data is refreshed in background
    queryClient.invalidateQueries({ queryKey: ["reviews", doctorId ?? hospitalId] })
  }, [doctorId, hospitalId, queryClient])

  const handleDelete = useCallback((id: string) => {
    setDeleted((prev) => new Set(Array.from(prev).concat(id)))
    setOptimistic((prev) => prev.filter((r) => r.id !== id))
    queryClient.invalidateQueries({ queryKey: ["reviews", doctorId ?? hospitalId] })
  }, [doctorId, hospitalId, queryClient])

  const currentUserId = session?.user?.id ?? null
  const isAdmin       = session?.user?.role === "ADMIN"

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Patient Reviews
        </h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
            showForm
              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              : "bg-[#06B6D4] text-white hover:bg-[#0E7490] shadow-sm active:scale-[0.98]",
          )}
        >
          <MessageSquarePlus className="size-4" />
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="mb-6">
          <ReviewForm
            doctorId={doctorId}
            hospitalId={hospitalId}
            onSuccess={handleNewReview}
          />
        </div>
      )}

      {/* Summary card */}
      {displayAvg != null && displayCount > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Big number + distribution */}
            <div className="flex-shrink-0 flex flex-col items-center text-center sm:w-32">
              <span className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums leading-none">
                {displayAvg.toFixed(1)}
              </span>
              <StarRating value={displayAvg} size="md" className="mt-2" />
              <span className="mt-1.5 text-xs text-slate-400">
                {displayCount} review{displayCount !== 1 ? "s" : ""}
              </span>

              {/* Distribution */}
              <div className="mt-4 w-full space-y-1">
                {dist.map(({ star, count }) => (
                  <DistBar key={star} star={star} count={count} total={allForStats.length} />
                ))}
              </div>
            </div>

            {/* Sub-rating bars */}
            {hasSubData && (
              <div className="flex-1 space-y-3 justify-center flex flex-col">
                {(Object.entries(subAvgs) as [string, number | null][]).map(([label, val]) => (
                  <SubBar key={label} label={label} value={val} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sort + count */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isFetching ? "Loading…" : `${displayCount} review${displayCount !== 1 ? "s" : ""}`}
          </span>
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            {(["helpful", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSort(s); setPage(1) }}
                className={cn(
                  "px-3 py-1.5 font-medium capitalize transition-colors",
                  sort === s
                    ? "bg-[#06B6D4] text-white"
                    : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                {s === "helpful" ? "Most Helpful" : "Most Recent"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optimistic new reviews */}
      {optimistic.length > 0 && (
        <div className="space-y-5 mb-5">
          {optimistic
            .filter((r) => !deleted.has(r.id))
            .map((r) => (
              <div key={r.id} className="rounded-2xl border-2 border-[#06B6D4]/30 bg-[#06B6D4]/5 p-4">
                <p className="text-xs font-semibold text-[#06B6D4] mb-3">Just submitted</p>
                <ReviewCard
                  review={r}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                />
              </div>
            ))}
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 && optimistic.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No reviews yet</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to share your experience.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#06B6D4] text-white hover:bg-[#0E7490] transition-colors"
            >
              Write the first review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
          {reviews.map((r, i) => (
            <div key={r.id} className={cn(i > 0 && "pt-5")}>
              <ReviewCard
                review={r}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isFetching}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#06B6D4] hover:text-[#0E7490] transition-colors disabled:opacity-50"
        >
          <ChevronDown className="size-4" />
          {isFetching ? "Loading…" : "Load more reviews"}
        </button>
      )}

      {!hasMore && displayCount > 0 && (
        <p className="mt-6 text-center text-xs text-slate-400">
          All {displayCount} review{displayCount !== 1 ? "s" : ""} shown
        </p>
      )}
    </section>
  )
}
