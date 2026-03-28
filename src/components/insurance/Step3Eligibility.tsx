"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, RotateCcw, ExternalLink, ChevronDown, ChevronUp, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useInsuranceWizard,
  type EmploymentStatus,
  type InsurancePlanType,
} from "@/store/insuranceWizardStore"

// ── US States ──────────────────────────────────────────────────────────────────

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
]

// ── Health conditions list ─────────────────────────────────────────────────────

const CONDITIONS = [
  "Diabetes","Hypertension","Asthma","Heart Disease","Cancer",
  "Mental Health Condition","Pregnancy","Chronic Pain","Kidney Disease","None",
]

// ── Eligibility logic ──────────────────────────────────────────────────────────

interface Recommendation {
  type:     InsurancePlanType
  label:    string
  reason:   string
  fitScore: number   // 0-100
  premiumLow:  number
  premiumHigh: number
  subsidyEligible: boolean
  enrollmentNote: string
  ctaLabel: string
  ctaUrl:   string
}

function computeRecommendations(
  age: number,
  income: number,
  employment: EmploymentStatus,
  conditions: string[],
): Recommendation[] {
  const recs: Recommendation[] = []

  const fpl2024 = 15060  // Federal poverty line 2024 (single person)
  const fplPct  = income / fpl2024

  // MEDICAID — income < 138% FPL
  if (fplPct < 1.38 && age < 65) {
    recs.push({
      type: "MEDICAID",
      label: "Medicaid",
      reason: "Your income likely qualifies you for free or very low-cost Medicaid coverage.",
      fitScore: 97,
      premiumLow: 0, premiumHigh: 0,
      subsidyEligible: false,
      enrollmentNote: "Open year-round — apply any time at healthcare.gov or your state Medicaid office.",
      ctaLabel: "Check Medicaid eligibility",
      ctaUrl:   "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/",
    })
  }

  // CHIP — children / family with income 138–200% FPL
  if (age < 19 && fplPct < 2.0) {
    recs.push({
      type: "CHIP",
      label: "CHIP",
      reason: "Children's Health Insurance Program for families with income too high for Medicaid.",
      fitScore: 92,
      premiumLow: 0, premiumHigh: 50,
      subsidyEligible: false,
      enrollmentNote: "Open year-round. Apply through your state CHIP program.",
      ctaLabel: "Find your state CHIP",
      ctaUrl:   "https://www.healthcare.gov/medicaid-chip/childrens-health-insurance-program/",
    })
  }

  // MEDICARE — age 65+
  if (age >= 65) {
    recs.push({
      type: "MEDICARE",
      label: "Medicare",
      reason: "You qualify for Medicare based on your age.",
      fitScore: 99,
      premiumLow: 174, premiumHigh: 594,
      subsidyEligible: fplPct < 1.5,
      enrollmentNote: "Initial enrollment window is 7 months around your 65th birthday. Apply via SSA.",
      ctaLabel: "Medicare enrollment",
      ctaUrl:   "https://www.medicare.gov/sign-up-change-plans/how-do-i-get-parts-a-b",
    })
    return recs  // Medicare is primary; skip others for 65+
  }

  const hasChronicCondition = conditions.some(
    (c) => !["None","Pregnancy"].includes(c),
  )

  // ACA marketplace plans
  const subsidyEligible = fplPct >= 1.0 && fplPct <= 4.0
  const premiumBase = Math.max(100, Math.round(income * 0.05 / 12))

  // HMO — lower cost, referrals required
  if (employment !== "self_employed" || income < 60000) {
    recs.push({
      type: "HMO",
      label: "HMO Plan",
      reason: "Lower premiums and copays; ideal if you prefer a primary care physician to coordinate care.",
      fitScore: hasChronicCondition ? 78 : 88,
      premiumLow:  Math.round(premiumBase * 0.7),
      premiumHigh: Math.round(premiumBase * 1.1),
      subsidyEligible,
      enrollmentNote: "Open Enrollment: Nov 1 – Jan 15. Special Enrollment if you lose employer coverage.",
      ctaLabel: "Browse HMO plans",
      ctaUrl:   "https://www.healthcare.gov/",
    })
  }

  // PPO — more flexibility
  recs.push({
    type: "PPO",
    label: "PPO Plan",
    reason: "Access any doctor without a referral; best if you have specialists or prefer flexibility.",
    fitScore: hasChronicCondition ? 90 : 80,
    premiumLow:  Math.round(premiumBase * 1.1),
    premiumHigh: Math.round(premiumBase * 1.6),
    subsidyEligible,
    enrollmentNote: "Open Enrollment: Nov 1 – Jan 15. Special Enrollment available for qualifying events.",
    ctaLabel: "Browse PPO plans",
    ctaUrl:   "https://www.healthcare.gov/",
  })

  // HDHP + HSA — high deductible, tax-advantaged
  if (income > 50000 && !hasChronicCondition) {
    recs.push({
      type: "HDHP",
      label: "HDHP + HSA",
      reason: "Lowest premiums; pair with a Health Savings Account for triple tax benefits. Best if you're generally healthy.",
      fitScore: 72,
      premiumLow:  Math.round(premiumBase * 0.5),
      premiumHigh: Math.round(premiumBase * 0.8),
      subsidyEligible,
      enrollmentNote: "Open Enrollment: Nov 1 – Jan 15. Pair with HSA contributions up to $4,150/yr (2024).",
      ctaLabel: "Learn about HDHPs",
      ctaUrl:   "https://www.healthcare.gov/glossary/high-deductible-health-plan/",
    })
  }

  return recs.sort((a, b) => b.fitScore - a.fitScore)
}

// ── Fit badge ──────────────────────────────────────────────────────────────────

function FitBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 75 ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-slate-100 text-slate-600 border-slate-200"
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", color)}>
      {score}% fit
    </span>
  )
}

// ── Recommendation card ────────────────────────────────────────────────────────

function RecommendationCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const [open, setOpen] = useState(rank === 0)

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      rank === 0
        ? "border-[#06B6D4] shadow-md shadow-cyan-100/50"
        : "border-slate-200 dark:border-slate-700",
    )}>
      {rank === 0 && (
        <div className="bg-[#06B6D4] text-white text-[10px] font-bold uppercase tracking-wide px-4 py-1.5">
          Best Match
        </div>
      )}

      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full px-4 py-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="text-left flex items-center gap-3 flex-1 min-w-0">
          <FitBadge score={rec.fitScore} />
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{rec.label}</p>
          {rec.subsidyEligible && (
            <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Subsidy eligible
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-500">est. monthly</p>
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
              {rec.premiumLow === 0 && rec.premiumHigh === 0
                ? "Free / $0"
                : `$${rec.premiumLow}–$${rec.premiumHigh}`}
            </p>
          </div>
          {open ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 bg-white dark:bg-slate-900 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">{rec.reason}</p>

          {rec.subsidyEligible && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300">
              <Info className="size-4 flex-shrink-0 mt-0.5" />
              <span>You may qualify for ACA premium subsidies that reduce your monthly cost significantly.</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Enrollment:</span>
            {rec.enrollmentNote}
          </div>

          <a
            href={rec.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-xs font-bold hover:bg-[#0E7490] transition-colors"
          >
            {rec.ctaLabel}
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  )
}

// ── Step3Eligibility ───────────────────────────────────────────────────────────

const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  employed_full:  "Employed Full-Time",
  employed_part:  "Employed Part-Time",
  self_employed:  "Self-Employed / Freelance",
  unemployed:     "Unemployed",
  retired:        "Retired",
  student:        "Student",
}

export default function Step3Eligibility() {
  const { eligibility, setEligibility, setStep, reset } = useInsuranceWizard()

  const { age, state, income, employmentStatus, healthConditions } = eligibility

  const recommendations = useMemo(
    () => computeRecommendations(age, income, employmentStatus, healthConditions),
    [age, income, employmentStatus, healthConditions],
  )

  function toggleCondition(c: string) {
    const current = healthConditions
    if (c === "None") {
      setEligibility({ healthConditions: current.includes("None") ? [] : ["None"] })
      return
    }
    const without = current.filter((x) => x !== "None")
    setEligibility({
      healthConditions: without.includes(c)
        ? without.filter((x) => x !== c)
        : [...without, c],
    })
  }

  const fpl2024 = 15060
  const fplPct  = Math.round((income / fpl2024) * 100)

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Eligibility Guide</h2>
        <p className="text-sm text-slate-500 mt-1">
          Answer a few questions and we&apos;ll recommend the best insurance options for you.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-5 bg-white dark:bg-slate-900">

        {/* Age + State row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Age</label>
            <input
              type="number"
              min={0} max={120}
              value={age}
              onChange={(e) => setEligibility({ age: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">State</label>
            <select
              value={state}
              onChange={(e) => setEligibility({ state: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Income slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Annual Household Income
            </label>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              ${income.toLocaleString()}
              <span className="ml-2 text-[10px] font-normal text-slate-400">~{fplPct}% FPL</span>
            </span>
          </div>
          <input
            type="range"
            min={0} max={150000} step={1000}
            value={income}
            onChange={(e) => setEligibility({ income: Number(e.target.value) })}
            className="w-full accent-[#06B6D4]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>$0</span>
            <span>$150,000+</span>
          </div>
        </div>

        {/* Employment status */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Employment Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(EMPLOYMENT_LABELS) as EmploymentStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setEligibility({ employmentStatus: s })}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all",
                  employmentStatus === s
                    ? "bg-[#06B6D4]/10 border-[#06B6D4] text-[#06B6D4]"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]/50",
                )}
              >
                {EMPLOYMENT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Health conditions */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Health Conditions (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => {
              const active = healthConditions.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    active
                      ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]/50",
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Recommended Plans — ranked by fit
          </h3>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={rec.type} rec={rec} rank={i} />
          ))}
        </div>
      )}

      {/* Subsidy note */}
      <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4 text-sm text-purple-700 dark:text-purple-300">
        <p className="font-semibold mb-1">About Premium Subsidies</p>
        <p className="text-xs leading-relaxed">
          If your income is between 100% and 400% of the Federal Poverty Level (~${Math.round(fpl2024).toLocaleString()}–
          ${Math.round(fpl2024 * 4).toLocaleString()}/yr for a single person), you may qualify for
          Advanced Premium Tax Credits that lower your monthly premium on Marketplace plans.
        </p>
        <a
          href="https://www.healthcare.gov/lower-costs/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold hover:underline"
        >
          Calculate your savings <ExternalLink className="size-3" />
        </a>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={() => reset()}
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="size-4" /> Start over
        </button>
        <a
          href="https://www.healthcare.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#0E7490] transition-colors"
        >
          Go to HealthCare.gov <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  )
}
