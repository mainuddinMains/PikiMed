"use client"

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import { useQuery }      from "@tanstack/react-query"
import {
  ChevronDown, ChevronUp, Plus, X, Search,
  CheckCircle2, ExternalLink, Loader2, Sparkles,
  ThumbsUp, ThumbsDown, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getRecommendations,
  type HealthCondition,
  type EmploymentStatus,
  type Recommendation,
  type RecommenderInput,
} from "@/app/us/insurance/recommender/actions"

// ── Constants ──────────────────────────────────────────────────────────────────

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

const CONDITIONS: { value: HealthCondition; label: string; emoji: string }[] = [
  { value: "diabetes",      label: "Diabetes",          emoji: "🩸" },
  { value: "heart_disease", label: "Heart Disease",      emoji: "❤️" },
  { value: "mental_health", label: "Mental Health",      emoji: "🧠" },
  { value: "pregnancy",     label: "Pregnancy",          emoji: "🤰" },
  { value: "chronic_pain",  label: "Chronic Pain",       emoji: "💊" },
  { value: "none",          label: "None / Generally Healthy", emoji: "✅" },
]

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "employed_full",  label: "Employed Full-Time" },
  { value: "employed_part",  label: "Employed Part-Time" },
  { value: "self_employed",  label: "Self-Employed / Freelance" },
  { value: "unemployed",     label: "Unemployed" },
  { value: "student",        label: "Student" },
  { value: "retired",        label: "Retired" },
]

// ── Doctor search ──────────────────────────────────────────────────────────────

interface DoctorHit {
  id:        string
  name:      string
  specialty: string
  city:      string
  state:     string | null
}

async function searchDoctors(q: string): Promise<DoctorHit[]> {
  if (!q.trim()) return []
  const res = await fetch(`/api/doctors?q=${encodeURIComponent(q)}&region=US&page=1`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.data ?? []).slice(0, 6)
}

function DoctorSearchInput({
  doctors,
  onAdd,
  onRemove,
}: {
  doctors:  DoctorHit[]
  onAdd:    (d: DoctorHit) => void
  onRemove: (id: string)   => void
}) {
  const [q,    setQ]    = useState("")
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["doctor-search-recommender", q],
    queryFn:  () => searchDoctors(q),
    enabled:  q.length >= 2,
    staleTime: 30_000,
  })

  useEffect(() => {
    function h(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const addedIds = new Set(doctors.map((d) => d.id))

  function handleAdd(d: DoctorHit) {
    onAdd(d)
    setQ("")
    setOpen(false)
  }

  return (
    <div>
      {/* Added doctors */}
      {doctors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {doctors.map((d) => (
            <span
              key={d.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-semibold"
            >
              {d.name}
              <button onClick={() => onRemove(d.id)} className="hover:text-rose-500 transition-colors">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div ref={wrapRef} className="relative">
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-[#06B6D4]/40 focus-within:border-[#06B6D4]">
          <Search className="size-4 text-slate-400 flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search by doctor name…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
          />
          {isFetching && <Loader2 className="size-3.5 text-slate-400 animate-spin" />}
        </div>

        {open && (q.length >= 2) && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-56 overflow-y-auto">
            {results.length === 0 && !isFetching && (
              <p className="px-4 py-3 text-xs text-slate-400">No doctors found</p>
            )}
            {results.map((d) => {
              const alreadyAdded = addedIds.has(d.id)
              return (
                <button
                  key={d.id}
                  disabled={alreadyAdded}
                  onClick={() => handleAdd(d)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
                    alreadyAdded
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{d.name}</p>
                      <p className="text-xs text-slate-400">{d.specialty} · {d.city}{d.state ? `, ${d.state}` : ""}</p>
                    </div>
                    {alreadyAdded
                      ? <CheckCircle2 className="size-4 text-[#06B6D4]" />
                      : <Plus className="size-4 text-slate-400" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-slate-400">
        Adding preferred doctors helps us recommend plans with flexible networks (PPO).
      </p>
    </div>
  )
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "from-green-400 to-emerald-500" :
    score >= 70 ? "from-[#06B6D4] to-cyan-400" :
                  "from-amber-400 to-amber-500"

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300 w-10 text-right">
        {score}%
      </span>
    </div>
  )
}

// ── Recommendation card ────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  rank,
}: {
  rec:  Recommendation
  rank: number
}) {
  const isBest = rank === 0
  const [showAll, setShowAll] = useState(false)

  const fmtPremium =
    rec.estimatedMonthlyLow === 0 && rec.estimatedMonthlyHigh === 0
      ? "$0 / month"
      : `$${rec.estimatedMonthlyLow}–$${rec.estimatedMonthlyHigh} / month`

  return (
    <div
      className={cn(
        "rounded-3xl border overflow-hidden transition-shadow hover:shadow-lg",
        isBest
          ? "border-[#06B6D4] shadow-xl shadow-cyan-100/60 dark:shadow-cyan-900/30"
          : "border-slate-200 dark:border-slate-700 shadow-sm",
      )}
    >
      {/* Best match banner */}
      {isBest && (
        <div className="bg-[#06B6D4] px-5 py-2 flex items-center gap-2">
          <Sparkles className="size-4 text-white" />
          <span className="text-white text-xs font-extrabold uppercase tracking-widest">Best Match</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              {rec.label}
            </h3>
            <span className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border",
              isBest
                ? "bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500",
            )}>
              #{rank + 1}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{rec.description}</p>
        </div>

        {/* Fit score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Match Score</p>
          </div>
          <ScoreBar score={rec.score} />
        </div>

        {/* Estimated cost */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">Est. Monthly Premium</p>
          <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
            {fmtPremium}
          </p>
        </div>

        {/* Why it fits */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Why it fits you
          </p>
          <ul className="space-y-2">
            {rec.whyItFits.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="size-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Pros / Cons */}
        <div>
          <button
            onClick={() => setShowAll((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#06B6D4] transition-colors"
          >
            {showAll ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {showAll ? "Hide" : "Show"} pros &amp; cons
          </button>

          {showAll && (
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 p-4">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-1">
                  <ThumbsUp className="size-3.5" /> Pros
                </p>
                <ul className="space-y-2">
                  {rec.pros.map((p, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-green-600 mt-0.5">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900 p-4">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1">
                  <ThumbsDown className="size-3.5" /> Cons
                </p>
                <ul className="space-y-2">
                  {rec.cons.map((c, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-rose-500 mt-0.5">✗</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <a
          href={rec.learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-colors active:scale-[0.99]",
            isBest
              ? "bg-[#06B6D4] text-white hover:bg-[#0E7490]"
              : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
          )}
        >
          {rec.learnMoreLabel}
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
      {children}
    </div>
  )
}

// ── Main RecommenderClient ─────────────────────────────────────────────────────

interface FormState {
  age:              number
  conditions:       HealthCondition[]
  monthlyBudget:    number
  employmentStatus: EmploymentStatus
  state:            string
}

const DEFAULT_FORM: FormState = {
  age:              35,
  conditions:       [],
  monthlyBudget:    250,
  employmentStatus: "employed_full",
  state:            "",
}

export default function RecommenderClient() {
  const [form,         setForm]         = useState<FormState>(DEFAULT_FORM)
  const [doctors,      setDoctors]      = useState<{ id: string; name: string; specialty: string; city: string; state: string | null }[]>([])
  const [results,      setResults]      = useState<Recommendation[] | null>(null)
  const [isPending,    startTransition] = useTransition()
  const [errors,       setErrors]       = useState<Partial<Record<keyof FormState, string>>>({})
  const resultsRef = useRef<HTMLDivElement>(null)

  function patch(p: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function toggleCondition(c: HealthCondition) {
    const current = form.conditions
    if (c === "none") {
      patch({ conditions: current.includes("none") ? [] : ["none"] })
      return
    }
    const without = current.filter((x) => x !== "none")
    patch({
      conditions: without.includes(c) ? without.filter((x) => x !== c) : [...without, c],
    })
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.state) e.state = "Please select your state"
    if (form.age < 0 || form.age > 120) e.age = "Enter a valid age (0–120)"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = useCallback(() => {
    if (!validate()) return

    const input: RecommenderInput = {
      age:                  form.age,
      conditions:           form.conditions,
      monthlyBudget:        form.monthlyBudget,
      preferredDoctorCount: doctors.length,
      employmentStatus:     form.employmentStatus,
      state:                form.state,
    }

    startTransition(async () => {
      const recs = await getRecommendations(input)
      setResults(recs)
      // Scroll to results on mobile after a tick
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, doctors])

  function handleReset() {
    setForm(DEFAULT_FORM)
    setDoctors([])
    setResults(null)
    setErrors({})
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
      {/* ── Form panel ───────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-7">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Your Profile</h2>
          <p className="text-sm text-slate-500 mt-1">
            Answer a few questions — we&apos;ll rank the best plan types for you.
          </p>
        </div>

        {/* Age */}
        <Section title="Age">
          <div>
            <input
              type="number"
              min={0} max={120}
              value={form.age}
              onChange={(e) => patch({ age: Number(e.target.value) })}
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 bg-slate-50 dark:bg-slate-800",
                errors.age
                  ? "border-rose-400"
                  : "border-slate-200 dark:border-slate-700",
              )}
            />
            {errors.age && <p className="mt-1 text-xs text-rose-500">{errors.age}</p>}
          </div>
        </Section>

        {/* State */}
        <Section title="State">
          <div>
            <select
              value={form.state}
              onChange={(e) => patch({ state: e.target.value })}
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 bg-slate-50 dark:bg-slate-800",
                errors.state
                  ? "border-rose-400"
                  : "border-slate-200 dark:border-slate-700",
              )}
            >
              <option value="">Select your state…</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p className="mt-1 text-xs text-rose-500">{errors.state}</p>}
          </div>
        </Section>

        {/* Health conditions */}
        <Section title="Health Conditions">
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(({ value, label, emoji }) => {
              const active = form.conditions.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleCondition(value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all",
                    active
                      ? "bg-[#06B6D4]/10 border-[#06B6D4] text-[#06B6D4]"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]/50",
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                  {active && <CheckCircle2 className="size-3.5 ml-auto flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Budget slider */}
        <Section title="Monthly Premium Budget">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">$0</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                ${form.monthlyBudget}
                <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
              </span>
              <span className="text-xs text-slate-400">$1,000</span>
            </div>
            <input
              type="range"
              min={0} max={1000} step={10}
              value={form.monthlyBudget}
              onChange={(e) => patch({ monthlyBudget: Number(e.target.value) })}
              className="w-full accent-[#06B6D4]"
            />
          </div>
        </Section>

        {/* Employment status */}
        <Section title="Employment Status">
          <div className="grid grid-cols-2 gap-2">
            {EMPLOYMENT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => patch({ employmentStatus: value })}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all",
                  form.employmentStatus === value
                    ? "bg-[#06B6D4]/10 border-[#06B6D4] text-[#06B6D4]"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]/50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Preferred doctors */}
        <Section title="Preferred Doctors (optional)">
          <DoctorSearchInput
            doctors={doctors}
            onAdd={(d) => setDoctors((prev) => [...prev, d])}
            onRemove={(id) => setDoctors((prev) => prev.filter((d) => d.id !== id))}
          />
        </Section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#06B6D4] text-white font-extrabold text-sm hover:bg-[#0E7490] transition-colors active:scale-[0.99] disabled:opacity-60"
        >
          {isPending
            ? <><Loader2 className="size-4 animate-spin" /> Calculating…</>
            : <><Sparkles className="size-4" /> Get My Recommendations</>}
        </button>

        {results && (
          <button
            onClick={handleReset}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Start over
          </button>
        )}
      </div>

      {/* ── Results panel ─────────────────────────────────────────────────── */}
      <div ref={resultsRef}>
        {!results && !isPending && (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
            <p className="text-4xl mb-3">🏥</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              Fill in your profile
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your personalized insurance recommendations will appear here.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-left max-w-xs mx-auto">
              {["Answer the form", "Hit 'Get My Recommendations'", "See your top 3 plan types ranked by fit"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="w-5 h-5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {isPending && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                style={{ opacity: 1 - i * 0.25 }}
              />
            ))}
          </div>
        )}

        {results && !isPending && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Top {results.length} plan types — ranked by fit
              </p>
              <button
                onClick={() => {
                  patch({ state: form.state })   // no-op keeps form visible
                  resultsRef.current?.scrollIntoView({ behavior: "smooth" })
                }}
                className="text-xs text-[#06B6D4] font-semibold flex items-center gap-1 hover:underline"
              >
                <ArrowRight className="size-3.5" /> Compare plans on Healthcare.gov
              </button>
            </div>

            {results.map((rec, i) => (
              <RecommendationCard key={rec.planKey} rec={rec} rank={i} />
            ))}

            <p className="text-[10px] text-slate-400 text-center pt-2">
              Results are informational estimates based on general eligibility rules.
              Consult a licensed insurance broker for personalised advice.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
