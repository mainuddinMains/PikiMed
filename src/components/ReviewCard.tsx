"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, Flag, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import StarRating from "@/components/detail/StarRating"
import type { ReviewWithUser } from "@/app/api/reviews/route"

const SUB_LABELS: [keyof ReviewWithUser, string][] = [
  ["punctualityRating",  "Wait / Punctuality"],
  ["qualityRating",      "Quality of Care"],
  ["staffRating",        "Staff Attitude"],
  ["cleanlinessRating",  "Cleanliness"],
  ["costFairnessRating", "Cost Fairness"],
]

interface ReviewCardProps {
  review:        ReviewWithUser
  currentUserId: string | null
  isAdmin:       boolean
  onDelete:      (id: string) => void
}

export default function ReviewCard({
  review,
  currentUserId,
  isAdmin,
  onDelete,
}: ReviewCardProps) {
  const [helpfulCount,  setHelpfulCount]  = useState(review.helpfulCount)
  const [votedHelpful,  setVotedHelpful]  = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [expanded,      setExpanded]      = useState(false)

  const isAuthor  = currentUserId === review.userId
  const canDelete = isAuthor || isAdmin

  const initials = review.user.name
    ? review.user.name.split(" ").slice(0, 2).map((n) => n[0]).join("")
    : "?"

  const hasSubRatings = SUB_LABELS.some(([key]) => review[key] != null)

  async function handleHelpful() {
    if (!currentUserId) { toast.error("Sign in to vote"); return }
    if (votedHelpful)   return

    // Optimistic
    setHelpfulCount((c) => c + 1)
    setVotedHelpful(true)

    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setHelpfulCount(data.helpfulCount)
    } catch {
      setHelpfulCount((c) => c - 1)
      setVotedHelpful(false)
      toast.error("Failed to vote. Please try again.")
    }
  }

  function handleReport() {
    toast("Review reported. Our team will look into it.", { icon: "🚩" })
  }

  async function handleDelete() {
    if (!confirm("Delete this review permanently?")) return
    setDeletePending(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Delete failed")
      }
      onDelete(review.id)
      toast.success("Review deleted.")
    } catch (e) {
      toast.error((e as Error).message)
      setDeletePending(false)
    }
  }

  return (
    <article className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 flex size-9 items-center justify-center rounded-full bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-bold">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <span className="font-medium text-sm text-slate-800 dark:text-slate-100">
                {review.user.name ?? "Anonymous"}
              </span>
              {isAuthor && (
                <span className="ml-2 text-xs text-slate-400">(you)</span>
              )}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Overall stars */}
          <StarRating value={review.overallRating} size="sm" showValue className="mt-0.5" />

          {/* Body text */}
          {review.body && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {review.body}
            </p>
          )}

          {/* Sub-rating detail — collapsible */}
          {hasSubRatings && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                {expanded ? "Hide" : "Show"} category ratings
              </button>

              {expanded && (
                <div className="mt-2 space-y-1.5 pl-1">
                  {SUB_LABELS.map(([key, label]) => {
                    const val = review[key] as number | null
                    if (val == null) return null
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-36 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          {label}
                        </span>
                        <StarRating value={val} size="sm" />
                        <span className="text-xs tabular-nums text-slate-500">{val.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {/* Helpful */}
            <button
              onClick={handleHelpful}
              disabled={votedHelpful || !currentUserId}
              className={cn(
                "flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 transition-all",
                votedHelpful
                  ? "bg-[#06B6D4]/10 text-[#06B6D4] font-semibold cursor-default"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200",
                !currentUserId && "opacity-50 cursor-not-allowed",
              )}
              title={!currentUserId ? "Sign in to vote" : undefined}
            >
              <ThumbsUp className="size-3" />
              {votedHelpful ? "Helpful ✓" : "Helpful"}
              {helpfulCount > 0 && (
                <span className="tabular-nums">({helpfulCount})</span>
              )}
            </button>

            {/* Report */}
            {!isAuthor && (
              <button
                onClick={handleReport}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg px-2.5 py-1 transition-colors"
              >
                <Flag className="size-3" />
                Report
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg px-2.5 py-1 transition-colors ml-auto opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-3" />
                {deletePending ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
