"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { Star } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import type { ReviewWithUser } from "@/app/api/reviews/route"

// ── Star picker ────────────────────────────────────────────────────────────────

interface StarPickerProps {
  value:     number   // 0 = unset
  onChange:  (n: number) => void
  required?: boolean
  label:     string
}

function StarPicker({ value, onChange, required, label }: StarPickerProps) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <div
        className="flex gap-0.5"
        onMouseLeave={() => setHovered(0)}
        aria-label={label}
        role="group"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                n <= display
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700",
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-1 self-center text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            {value}.0
          </span>
        )}
      </div>
    </div>
  )
}

// ── ReviewForm ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "punctualityRating",  label: "Wait / Punctuality" },
  { key: "qualityRating",      label: "Quality of Care" },
  { key: "staffRating",        label: "Staff Attitude" },
  { key: "cleanlinessRating",  label: "Cleanliness" },
  { key: "costFairnessRating", label: "Cost Fairness" },
] as const

interface FormState {
  overallRating:      number
  punctualityRating:  number
  qualityRating:      number
  staffRating:        number
  cleanlinessRating:  number
  costFairnessRating: number
  body:               string
}

const EMPTY: FormState = {
  overallRating:      0,
  punctualityRating:  0,
  qualityRating:      0,
  staffRating:        0,
  cleanlinessRating:  0,
  costFairnessRating: 0,
  body:               "",
}

interface ReviewFormProps {
  doctorId?:   string
  hospitalId?: string
  onSuccess:   (review: ReviewWithUser) => void
}

export default function ReviewForm({ doctorId, hospitalId, onSuccess }: ReviewFormProps) {
  const { data: session, status } = useSession()
  const [form,        setForm]        = useState<FormState>(EMPTY)
  const [submitting,  setSubmitting]  = useState(false)
  const [errors,      setErrors]      = useState<string[]>([])

  // ── Auth gate ────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Sign in to write a review
        </p>
        <p className="text-xs text-slate-400 mb-4">
          Share your experience to help others make informed decisions.
        </p>
        <button
          onClick={() => signIn()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#06B6D4] hover:bg-[#0E7490] transition-colors"
        >
          Sign In to Review
        </button>
      </div>
    )
  }

  // ── Validation ────────────────────────────────────────────────────────────────

  function validate(): string[] {
    const errs: string[] = []
    if (form.overallRating === 0) errs.push("Overall rating is required.")
    if (form.body && form.body.length < 30) errs.push("Written review must be at least 30 characters.")
    return errs
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (errs.length) { setErrors(errs); return }
    setErrors([])
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      doctorId,
      hospitalId,
      overallRating: form.overallRating,
      body: form.body.trim() || undefined,
    }

    // Only include sub-ratings if set
    for (const { key } of CATEGORIES) {
      if (form[key] > 0) payload[key] = form[key]
    }

    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) toast.error("You've already reviewed this provider.")
        else toast.error(data.error ?? "Submission failed")
        return
      }
      toast.success("Review submitted! Thank you.")
      onSuccess(data as ReviewWithUser)
      setForm(EMPTY)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5"
    >
      <h3 className="font-bold text-slate-800 dark:text-slate-100">Write a Review</h3>

      {/* Overall rating */}
      <StarPicker
        label="Overall Rating"
        value={form.overallRating}
        onChange={(n) => setForm((f) => ({ ...f, overallRating: n }))}
        required
      />

      {/* Category ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map(({ key, label }) => (
          <StarPicker
            key={key}
            label={label}
            value={form[key]}
            onChange={(n) => setForm((f) => ({ ...f, [key]: n }))}
          />
        ))}
      </div>

      {/* Body text */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
          Your Review
          <span className="ml-1 text-slate-400 font-normal">(optional, min 30 chars)</span>
        </label>
        <textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="Describe your experience — waiting time, how the staff treated you, cleanliness, whether the fees were fair…"
          rows={4}
          maxLength={2000}
          className={cn(
            "w-full px-4 py-3 rounded-xl border text-sm resize-none",
            "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 transition-all",
            form.body.length > 0 && form.body.length < 30
              ? "border-amber-300 dark:border-amber-700"
              : "border-slate-200 dark:border-slate-700",
          )}
        />
        <div className="flex justify-between mt-1">
          <span className={cn(
            "text-xs",
            form.body.length > 0 && form.body.length < 30
              ? "text-amber-500"
              : "text-slate-400",
          )}>
            {form.body.length > 0 && form.body.length < 30
              ? `${30 - form.body.length} more characters required`
              : `${form.body.length} / 2000`}
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <ul className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 px-4 py-3 space-y-1">
          {errors.map((e) => (
            <li key={e} className="text-xs text-red-600 dark:text-red-400">{e}</li>
          ))}
        </ul>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || form.overallRating === 0}
        className={cn(
          "w-full py-3 rounded-2xl text-sm font-bold text-white transition-all",
          "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50",
          submitting || form.overallRating === 0
            ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            : "bg-[#06B6D4] hover:bg-[#0E7490] active:scale-[0.98] shadow-sm",
        )}
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  )
}
