import { formatDistanceToNow } from "date-fns"
import { ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"
import StarRating from "./StarRating"

type ReviewUser = { name: string | null; image: string | null }

export interface ReviewData {
  id:                 string
  overallRating:      number
  punctualityRating:  number | null
  qualityRating:      number | null
  staffRating:        number | null
  cleanlinessRating:  number | null
  costFairnessRating: number | null
  body:               string | null
  helpfulCount:       number
  createdAt:          Date
  user:               ReviewUser
}

interface ReviewsSectionProps {
  reviews:     ReviewData[]
  avgRating:   number | null
  reviewCount: number
}

// ── Sub-rating bar ──────────────────────────────────────────────────────────

function RatingBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

// ── Average sub-ratings from review array ──────────────────────────────────

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

// ── Individual review card ─────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewData }) {
  const initials = review.user.name
    ? review.user.name.split(" ").slice(0, 2).map((n) => n[0]).join("")
    : "?"

  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0 flex size-9 items-center justify-center rounded-full bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-bold">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-800 dark:text-slate-100">
            {review.user.name ?? "Anonymous"}
          </span>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
        </div>

        <StarRating value={review.overallRating} size="sm" className="mt-0.5" />

        {review.body && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {review.body}
          </p>
        )}

        {review.helpfulCount > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <ThumbsUp className="size-3" />
            {review.helpfulCount} found helpful
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────

export default function ReviewsSection({
  reviews,
  avgRating,
  reviewCount,
}: ReviewsSectionProps) {
  const subRatings = {
    "Wait / Punctuality": avg(reviews.map((r) => r.punctualityRating)),
    "Quality of Care":    avg(reviews.map((r) => r.qualityRating)),
    "Staff Attitude":     avg(reviews.map((r) => r.staffRating)),
    "Cleanliness":        avg(reviews.map((r) => r.cleanlinessRating)),
    "Cost Fairness":      avg(reviews.map((r) => r.costFairnessRating)),
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">
        Patient Reviews
      </h2>

      {/* Summary */}
      {avgRating != null && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 mb-5">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Big number */}
            <div className="flex flex-col items-center justify-center text-center flex-shrink-0">
              <span className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                {avgRating.toFixed(1)}
              </span>
              <StarRating value={avgRating} size="md" className="mt-1" />
              <span className="mt-1 text-xs text-slate-400">
                {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Sub-rating bars */}
            {reviews.length > 0 && (
              <div className="flex-1 space-y-2.5">
                {(Object.entries(subRatings) as [string, number | null][]).map(
                  ([label, val]) => (
                    <RatingBar key={label} label={label} value={val} />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual reviews */}
      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No reviews yet. Be the first to review.
        </p>
      ) : (
        <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
          {reviews.map((r) => (
            <div key={r.id} className={cn(r !== reviews[0] && "pt-5")}>
              <ReviewCard review={r} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
