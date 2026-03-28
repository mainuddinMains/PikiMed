"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ChevronDown, Shield, DollarSign, AlertCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useInsuranceWizard,
  type InsurancePlanData,
  type InsurancePlanType,
} from "@/store/insuranceWizardStore"

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchPlans(q: string, type?: string): Promise<InsurancePlanData[]> {
  const sp = new URLSearchParams()
  if (q)    sp.set("q",    q)
  if (type) sp.set("type", type)
  const res = await fetch(`/api/insurance/plans?${sp}`)
  if (!res.ok) throw new Error("Failed to load plans")
  return res.json()
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number | null, prefix = "$") {
  if (n == null) return "—"
  return `${prefix}${n.toLocaleString()}`
}

const TYPE_LABELS: Record<InsurancePlanType, string> = {
  PPO:      "PPO",
  HMO:      "HMO",
  HDHP:     "HDHP",
  MEDICAID: "Medicaid",
  MEDICARE: "Medicare",
  CHIP:     "CHIP",
}

const TYPE_COLORS: Record<InsurancePlanType, string> = {
  PPO:      "bg-blue-100 text-blue-700",
  HMO:      "bg-purple-100 text-purple-700",
  HDHP:     "bg-amber-100 text-amber-700",
  MEDICAID: "bg-green-100 text-green-700",
  MEDICARE: "bg-cyan-100 text-cyan-700",
  CHIP:     "bg-pink-100 text-pink-700",
}

const TYPES: InsurancePlanType[] = ["PPO","HMO","HDHP","MEDICAID","MEDICARE","CHIP"]

// ── Plan search dropdown ───────────────────────────────────────────────────────

function PlanSearch({
  value,
  onSelect,
}: {
  value: InsurancePlanData | null
  onSelect: (p: InsurancePlanData) => void
}) {
  const [q,        setQ]        = useState(value?.name ?? "")
  const [open,     setOpen]     = useState(false)
  const [typeFilter, setTypeFilter] = useState<InsurancePlanType | "">("")
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const { data: plans = [], isFetching } = useQuery({
    queryKey:  ["insurance-plans", q, typeFilter],
    queryFn:   () => fetchPlans(q, typeFilter || undefined),
    enabled:   open,
    staleTime: 60_000,
  })

  function handleSelect(p: InsurancePlanData) {
    setQ(`${p.provider} — ${p.name}`)
    setOpen(false)
    onSelect(p)
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search by provider or plan name…"
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
        />
        <ChevronDown className={cn("absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(typeFilter === t ? "" : t); setOpen(true) }}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
              typeFilter === t
                ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]",
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-72 overflow-y-auto">
          {isFetching && (
            <div className="px-4 py-3 text-xs text-slate-400 animate-pulse">Loading…</div>
          )}
          {!isFetching && plans.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-400">No plans found</div>
          )}
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", TYPE_COLORS[p.type])}>
                  {TYPE_LABELS[p.type]}
                </span>
                <span className="text-xs text-slate-500">{p.provider}</span>
                {p.state && <span className="ml-auto text-[10px] text-slate-400">{p.state}</span>}
              </div>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Coverage row ───────────────────────────────────────────────────────────────

function CoverageRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  if (!value) return null
  return (
    <tr className={cn("border-b border-slate-100 dark:border-slate-800 last:border-0", highlight && "bg-cyan-50/50 dark:bg-cyan-900/10")}>
      <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{label}</td>
      <td className="py-2.5 text-sm text-slate-800 dark:text-slate-100">{value}</td>
    </tr>
  )
}

// ── Metric card ────────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Step1Coverage ──────────────────────────────────────────────────────────────

export default function Step1Coverage() {
  const { plan, setPlan, setStep } = useInsuranceWizard()

  const cd = plan?.coverageDetails

  const hasCoverage = cd && Object.keys(cd).length > 0

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Coverage Checker</h2>
        <p className="text-sm text-slate-500 mt-1">
          Select your insurance plan to see what&apos;s covered.
        </p>
      </div>

      {/* Plan search */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
          Your Insurance Plan
        </label>
        <PlanSearch value={plan} onSelect={setPlan} />
      </div>

      {/* Plan details */}
      {plan && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MetricCard label="Deductible"       value={fmt(plan.deductible)}     sub="per year" />
            <MetricCard label="Copay"             value={fmt(plan.copay)}          sub="per visit" />
            <MetricCard label="Out-of-Pocket Max" value={fmt(plan.outOfPocketMax)} sub="per year" />
          </div>

          {/* HSA badge */}
          {cd?.hsaEligible && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm font-semibold w-fit">
              <DollarSign className="size-4" />
              HSA-Eligible Plan
            </div>
          )}

          {/* Coverage details table */}
          {hasCoverage && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Shield className="inline size-3.5 mr-1" />Coverage Details
                </h3>
              </div>
              <div className="px-5">
                <table className="w-full">
                  <tbody>
                    <CoverageRow label="Preventive Care"   value={cd?.preventiveCare} highlight />
                    <CoverageRow label="Primary Care"      value={cd?.primaryCare} />
                    <CoverageRow label="Specialist"        value={cd?.specialist} />
                    <CoverageRow label="Emergency"         value={cd?.emergency} highlight />
                    <CoverageRow label="Mental Health"     value={cd?.mentalHealth} />
                    <CoverageRow label="Dental"            value={cd?.dental} />
                    <CoverageRow label="Vision"            value={cd?.vision} />
                    <CoverageRow label="Out-of-Network"    value={cd?.outOfNetwork} />
                    {cd?.prescriptions?.generic    && <CoverageRow label="Rx Generic"    value={cd.prescriptions.generic} />}
                    {cd?.prescriptions?.brand      && <CoverageRow label="Rx Brand"      value={cd.prescriptions.brand} />}
                    {cd?.prescriptions?.specialty  && <CoverageRow label="Rx Specialty"  value={cd.prescriptions.specialty} />}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* In-network vs out-of-network comparison */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
              <div className="p-4 bg-green-50 dark:bg-green-900/10">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 uppercase tracking-wide">In-Network</p>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li>✓ Lower copays &amp; coinsurance</li>
                  <li>✓ Counts toward deductible</li>
                  <li>✓ Annual out-of-pocket cap applies</li>
                  {plan.copay != null && <li className="font-semibold text-green-700 dark:text-green-400">~{fmt(plan.copay)} per visit</li>}
                </ul>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 uppercase tracking-wide">Out-of-Network</p>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li>✗ Higher cost-sharing</li>
                  {plan.type === "HMO" && <li>✗ Usually not covered at all</li>}
                  <li>✗ May not count toward deductible</li>
                  {cd?.outOfNetwork
                    ? <li className="font-semibold text-rose-600 dark:text-rose-400">{cd.outOfNetwork}</li>
                    : <li className="text-slate-400">Check your plan documents</li>}
                </ul>
              </div>
            </div>
          </div>

          {!hasCoverage && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
              <AlertCircle className="size-4 flex-shrink-0" />
              Detailed coverage info isn&apos;t available for this plan. Check your plan documents or call the number on your insurance card.
            </div>
          )}

          {/* Next step */}
          <button
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#0E7490] transition-colors active:scale-[0.99]"
          >
            Find In-Network Hospitals
            <ArrowRight className="size-4" />
          </button>
        </>
      )}
    </div>
  )
}
