"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Flag, X, Send, Check, ChevronDown, ChevronUp, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SERVICE_ROWS, CATEGORY_META,
  type HospitalCategory, type ServiceRow,
} from "./data"

// ── Formatting ─────────────────────────────────────────────────────────────────

function fmtBDT(n: number | null, free?: boolean): string {
  if (free || n === 0) return "Free"
  if (n == null)       return "—"
  return `৳${n.toLocaleString("en-BD")}`
}

function fmtRange(low: number | null, high: number | null, free?: boolean): string {
  if (free || (low === 0 && (high == null || high <= 10))) return "Free / ৳0"
  if (low == null && high == null) return "—"
  if (low == null) return `up to ৳${high!.toLocaleString()}`
  if (high == null || low === high) return `৳${low.toLocaleString()}`
  return `৳${low.toLocaleString()} – ৳${high.toLocaleString()}`
}

// ── Report price modal ─────────────────────────────────────────────────────────

interface ReportModalProps {
  service:    string
  category:   HospitalCategory
  onClose:    () => void
}

function ReportModal({ service, category, onClose }: ReportModalProps) {
  const meta = CATEGORY_META[category]

  const [hospitalName, setHospitalName] = useState("")
  const [price,        setPrice]        = useState("")
  const [year,         setYear]         = useState(new Date().getFullYear().toString())
  const [note,         setNote]         = useState("")
  const [submitted,    setSubmitted]    = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hospitalName.trim() || !price.trim()) return
    // In production: POST to /api/bd/price-reports
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 flex items-start justify-between border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Report a Price</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {service} · {meta.emoji} {meta.label}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Check className="size-7 text-green-600" />
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">Thank you!</p>
            <p className="text-sm text-slate-500">
              Your price report has been submitted for review. It helps keep our data accurate for everyone.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-2.5 rounded-xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#0E7490] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Hospital / Clinic Name *
              </label>
              <input
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="e.g. Square Hospital, Dhaka"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Price (BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Year
                </label>
                <input
                  type="number"
                  min={2020} max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Notes (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Any context: outdoor patient, with card, emergency…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#0E7490] transition-colors"
            >
              <Send className="size-4" />
              Submit Report
            </button>

            <p className="text-center text-[10px] text-slate-400">
              Reports are reviewed before publishing. All submissions are anonymous.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Service row ────────────────────────────────────────────────────────────────

function ServiceCard({
  row,
  activeCategory,
  onReport,
  isLoggedIn,
}: {
  row:            ServiceRow
  activeCategory: HospitalCategory
  onReport:       (service: string, category: HospitalCategory) => void
  isLoggedIn:     boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const price = row.prices[activeCategory]

  const rangeStr = fmtRange(price.low, price.high, price.free)
  const isFree   = price.free || (price.low === 0 && (price.high == null || price.high <= 10))

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-sm transition-shadow">
      <button
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{row.emoji}</span>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.service}</p>
            {row.note && <p className="text-[10px] text-slate-400">{row.note}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={cn(
            "text-sm font-extrabold tabular-nums",
            isFree ? "text-green-600 dark:text-green-400" : "text-slate-800 dark:text-slate-100",
          )}>
            {rangeStr}
          </span>
          {expanded
            ? <ChevronUp   className="size-4 text-slate-400" />
            : <ChevronDown className="size-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
          {/* All categories comparison */}
          <div className="grid grid-cols-3 gap-2">
            {(["government","private","diagnostic"] as HospitalCategory[]).map((cat) => {
              const p   = row.prices[cat]
              const m   = CATEGORY_META[cat]
              const rng = fmtRange(p.low, p.high, p.free)
              return (
                <div
                  key={cat}
                  className={cn(
                    "rounded-xl p-2.5 text-center border",
                    cat === activeCategory
                      ? "border-[#06B6D4] bg-[#06B6D4]/5"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50",
                  )}
                >
                  <p className="text-base mb-0.5">{m.emoji}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1 leading-tight">{m.label.replace(" Hospitals","").replace(" Centers","")}</p>
                  <p className={cn(
                    "text-xs font-extrabold tabular-nums",
                    (p.free || p.low === 0) ? "text-green-600 dark:text-green-400" : "text-slate-700 dark:text-slate-200",
                  )}>
                    {rng}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Report button */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Info className="size-3" />
              Community-sourced prices · Mar 2024
            </p>
            {isLoggedIn ? (
              <button
                onClick={() => onReport(row.service, activeCategory)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all"
              >
                <Flag className="size-3" /> Report a price
              </button>
            ) : (
              <a
                href="/auth/signin"
                className="text-[10px] text-[#06B6D4] hover:underline font-semibold"
              >
                Sign in to report
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function CostClient() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const [activeCategory, setActiveCategory] = useState<HospitalCategory>("government")
  const [modal, setModal] = useState<{ service: string; category: HospitalCategory } | null>(null)

  const meta = CATEGORY_META[activeCategory]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 bg-white dark:bg-slate-900">
        {(["government","private","diagnostic"] as HospitalCategory[]).map((cat) => {
          const m = CATEGORY_META[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-1 flex flex-col items-center py-3 px-2 text-xs font-bold transition-all border-r border-slate-200 dark:border-slate-700 last:border-0",
                activeCategory === cat
                  ? "bg-[#06B6D4] text-white"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <span className="text-lg mb-0.5">{m.emoji}</span>
              <span className="hidden sm:block leading-tight text-center">{m.label}</span>
              <span className="sm:hidden">{m.label.split(" ")[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Category description */}
      <div className="mb-5 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold">{meta.emoji} {meta.label}:</span>{" "}
          {meta.description}
        </p>
      </div>

      {/* Price rows */}
      <div className="space-y-3">
        {SERVICE_ROWS.map((row) => (
          <ServiceCard
            key={row.service}
            row={row}
            activeCategory={activeCategory}
            onReport={(service, category) => setModal({ service, category })}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <span className="font-bold">⚠️ Disclaimer:</span> Prices are approximate ranges collected from patient reports and publicly available data.
          Actual costs depend on doctor seniority, ward type, and facility. Always confirm with the hospital directly.
        </p>
      </div>

      {/* Suggest update */}
      {!isLoggedIn && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Know more accurate prices?{" "}
            <a href="/auth/signin" className="text-[#06B6D4] font-semibold hover:underline">
              Sign in to report
            </a>
            {" "}and help the community.
          </p>
        </div>
      )}

      {/* Report modal */}
      {modal && (
        <ReportModal
          service={modal.service}
          category={modal.category}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
