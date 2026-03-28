"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Clock, CheckCircle2, XCircle, Users, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60)    return "just now"
  if (secs < 3600)  return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)} hr ago`
  return `${Math.floor(secs / 86400)} day${Math.floor(secs / 86400) !== 1 ? "s" : ""} ago`
}

const LS_KEY = (slug: string) => `pikimed_avail_${slug}`

// ── Types ──────────────────────────────────────────────────────────────────────

interface AvailabilityState {
  isAvailableToday: boolean
  avgWaitMinutes:   number | null
  updatedAt:        number | null   // Date.now() of last community update
}

// ── Component ──────────────────────────────────────────────────────────────────

interface DoctorAvailabilityProps {
  doctorSlug:              string
  initialIsAvailableToday: boolean
  initialAvgWaitMinutes:   number | null
}

export default function DoctorAvailability({
  doctorSlug,
  initialIsAvailableToday,
  initialAvgWaitMinutes,
}: DoctorAvailabilityProps) {
  const { data: session } = useSession()

  const [state, setState] = useState<AvailabilityState>({
    isAvailableToday: initialIsAvailableToday,
    avgWaitMinutes:   initialAvgWaitMinutes,
    updatedAt:        null,
  })

  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")
  const [success,    setSuccess]    = useState(false)

  // Form state
  const [formAvail, setFormAvail] = useState<boolean | null>(null)
  const [formWait,  setFormWait]  = useState("")

  // Load persisted update timestamp from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(doctorSlug))
      if (raw) {
        const parsed = JSON.parse(raw) as AvailabilityState
        setState((prev) => ({ ...prev, updatedAt: parsed.updatedAt }))
      }
    } catch { /* ignore */ }
  }, [doctorSlug])

  const handleSubmit = useCallback(async () => {
    if (formAvail === null) { setError("Please select availability"); return }
    setError("")
    setSubmitting(true)

    try {
      const body: Record<string, unknown> = { isAvailableToday: formAvail }
      const wait = parseInt(formWait, 10)
      if (!isNaN(wait) && wait >= 0) body.avgWaitMinutes = wait

      const res = await fetch(`/api/doctors/${doctorSlug}/availability`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })

      if (res.status === 429) { setError("You already submitted an update recently. Try again in 4 hours."); return }
      if (res.status === 401) { setError("Please sign in to submit an update."); return }
      if (!res.ok)            { setError("Failed to submit. Please try again."); return }

      const updatedAt = Date.now()
      const next: AvailabilityState = {
        isAvailableToday: formAvail,
        avgWaitMinutes:   !isNaN(wait) && wait >= 0 ? wait : state.avgWaitMinutes,
        updatedAt,
      }
      setState(next)
      localStorage.setItem(LS_KEY(doctorSlug), JSON.stringify(next))

      setSuccess(true)
      setShowForm(false)
      setTimeout(() => setSuccess(false), 4000)
    } finally {
      setSubmitting(false)
    }
  }, [doctorSlug, formAvail, formWait, state.avgWaitMinutes])

  const { isAvailableToday, avgWaitMinutes, updatedAt } = state

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">

      {/* ── Status row ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Pulsing status indicator */}
          <span className="relative flex-shrink-0 mt-0.5">
            {isAvailableToday ? (
              <>
                <span className="absolute inline-flex size-3 rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex size-3 rounded-full bg-green-500" />
              </>
            ) : (
              <span className="inline-flex size-3 rounded-full bg-slate-400" />
            )}
          </span>

          <div>
            <p className={cn(
              "font-bold text-sm",
              isAvailableToday
                ? "text-green-700 dark:text-green-400"
                : "text-slate-500 dark:text-slate-400",
            )}>
              {isAvailableToday
                ? "Seeing patients today"
                : "Not available today"}
            </p>

            {/* Wait time */}
            {isAvailableToday && avgWaitMinutes != null && (
              <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Clock className="size-3" />
                Est. wait: ~{avgWaitMinutes} min
              </p>
            )}

            {/* Last updated */}
            {updatedAt && (
              <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                <Users className="size-3" />
                Last updated by a patient {timeAgo(updatedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Toggle form button */}
        <button
          onClick={() => { setShowForm((s) => !s); setError(""); setSuccess(false) }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
            showForm
              ? "border-slate-300 dark:border-slate-600 text-slate-500 bg-slate-50 dark:bg-slate-800"
              : "border-[#06B6D4]/40 text-[#06B6D4] hover:bg-[#06B6D4]/5",
          )}
        >
          {showForm
            ? <><ChevronUp   className="size-3.5" /> Cancel</>
            : <><ChevronDown className="size-3.5" /> Update status</>}
        </button>
      </div>

      {/* ── Success banner ─────────────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold">
          <CheckCircle2 className="size-4 flex-shrink-0" />
          Thanks for the update! You&apos;re helping fellow patients.
        </div>
      )}

      {/* ── Update form ───────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800">

          {!session?.user && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
              <XCircle className="size-4 flex-shrink-0" />
              <span>
                <a href="/auth/signin" className="font-bold underline">Sign in</a>
                {" "}to submit a community update.
              </span>
            </div>
          )}

          {/* Available? */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Is the doctor seeing patients today?
            </p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setFormAvail(v)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all",
                    formAvail === v
                      ? v
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-rose-500 border-rose-500 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300",
                  )}
                >
                  {v ? "✓ Yes" : "✗ No"}
                </button>
              ))}
            </div>
          </div>

          {/* Wait time */}
          {formAvail === true && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Current wait time (optional)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="number"
                  min={0} max={300}
                  value={formWait}
                  onChange={(e) => setFormWait(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full pl-8 pr-14 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !session?.user}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-bold hover:bg-[#0E7490] transition-colors disabled:opacity-50"
          >
            {submitting
              ? <><Loader2 className="size-4 animate-spin" /> Submitting…</>
              : "Submit Update"}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            Community updates · Rate limited to 1 per 4 hours per doctor
          </p>
        </div>
      )}
    </div>
  )
}
