"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Search, TrendingDown, ArrowRight, Info, ExternalLink,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts"
import { cn } from "@/lib/utils"
import type { CostResult } from "@/app/api/costs/route"

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchSuggestions(): Promise<string[]> {
  const res = await fetch("/api/costs")
  if (!res.ok) return []
  return res.json()
}

async function fetchCosts(q: string): Promise<CostResult[]> {
  const res = await fetch(`/api/costs?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error("Failed to load costs")
  return res.json()
}

// ── Formatting ─────────────────────────────────────────────────────────────────

function fmt(n: number | null) {
  if (n == null) return "—"
  return `$${n.toLocaleString()}`
}

// ── Custom tooltip for recharts ────────────────────────────────────────────────

interface TooltipProps {
  active?:  boolean
  payload?: { name: string; value: number; fill: string }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-3 text-xs">
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-bold">
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ── Savings badge ──────────────────────────────────────────────────────────────

function SavingsBadge({ savings }: { savings: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm font-bold">
      <TrendingDown className="size-4" />
      Save {fmt(savings)} with insurance
    </div>
  )
}

// ── Cost result card ───────────────────────────────────────────────────────────

function CostCard({ result }: { result: CostResult }) {
  const chartData = [
    { name: "With Insurance",    value: result.avgCostInsured   ?? 0, fill: "#06B6D4" },
    { name: "Without Insurance", value: result.avgCostUninsured ?? 0, fill: "#F43F5E" },
  ]

  const maxVal = Math.max(result.avgCostInsured ?? 0, result.avgCostUninsured ?? 0)

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{result.procedureName}</h3>
        {result.savings != null && result.savings > 0 && (
          <div className="mt-2"><SavingsBadge savings={result.savings} /></div>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* With insurance */}
          <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 p-4 text-center">
            <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">With Insurance</p>
            <p className="text-3xl font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums leading-none">
              {fmt(result.avgCostInsured)}
            </p>
            <p className="text-[10px] text-cyan-500/70 mt-1">avg. copay / coinsurance</p>
          </div>

          {/* Without insurance */}
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4 text-center">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">Without Insurance</p>
            <p className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 tabular-nums leading-none">
              {fmt(result.avgCostUninsured)}
            </p>
            <p className="text-[10px] text-rose-500/70 mt-1">full out-of-pocket cost</p>
          </div>
        </div>

        {/* Price range */}
        {result.minCost != null && result.maxCost != null && result.minCost !== result.maxCost && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Price Range Across Facilities
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(result.minCost)}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-rose-400" style={{ width: "100%" }} />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(result.maxCost)}</span>
            </div>
          </div>
        )}

        {/* Bar chart */}
        {(result.avgCostInsured != null || result.avgCostUninsured != null) && maxVal > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Cost Comparison</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => typeof v === "number" ? `$${v.toLocaleString()}` : v}
                    style={{ fontSize: "11px", fontWeight: 700, fill: "#475569" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Source */}
        <div className="flex items-start gap-2 text-[10px] text-slate-400">
          <Info className="size-3 flex-shrink-0 mt-0.5" />
          {result.source
            ? `Source: ${result.source}`
            : "Source: CMS public data 2024"}
        </div>

        {/* CTA */}
        <a
          href={`/search?q=${encodeURIComponent(result.procedureName)}&region=US`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#06B6D4] text-white text-sm font-bold hover:bg-[#0E7490] transition-colors active:scale-[0.99]"
        >
          Find in-network providers for this procedure
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  )
}

// ── Autocomplete input ─────────────────────────────────────────────────────────

function ProcedureSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [value,   setValue]   = useState("")
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data: suggestions = [] } = useQuery({
    queryKey: ["cost-suggestions"],
    queryFn:  fetchSuggestions,
    staleTime: Infinity,
  })

  const filtered = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function submit(q: string) {
    setValue(q)
    setOpen(false)
    onSearch(q)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className={cn(
        "flex items-center rounded-2xl border bg-white dark:bg-slate-900 transition-shadow",
        focused
          ? "border-[#06B6D4] shadow-lg shadow-cyan-100/50 dark:shadow-cyan-900/20"
          : "border-slate-200 dark:border-slate-700",
      )}>
        <Search className="ml-4 size-5 text-slate-400 flex-shrink-0" />
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true) }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) submit(value.trim()) }}
          placeholder="e.g. knee MRI, blood test, colonoscopy…"
          className="flex-1 px-3 py-4 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
        />
        <button
          onClick={() => value.trim() && submit(value.trim())}
          className="mr-2 px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-sm font-bold hover:bg-[#0E7490] transition-colors"
        >
          Estimate
        </button>
      </div>

      {/* Suggestions dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-64 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              onMouseDown={() => submit(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
            >
              <Search className="inline size-3 mr-2 text-slate-400" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Popular procedures ─────────────────────────────────────────────────────────

const POPULAR = [
  "MRI Scan", "Blood Test", "Colonoscopy", "X-Ray",
  "Ultrasound", "CT Scan", "Physical Exam", "Flu Shot",
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function CostEstimatorClient() {
  const [query, setQuery] = useState("")

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["costs", query],
    queryFn:  () => fetchCosts(query),
    enabled:  !!query,
    staleTime: 5 * 60_000,
  })

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
  }, [])

  return (
    <div className="space-y-6">
      {/* Search */}
      <ProcedureSearch onSearch={handleSearch} />

      {/* Popular pills */}
      {!query && (
        <div>
          <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <button
                key={p}
                onClick={() => handleSearch(p)}
                className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isFetching && (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-10 text-center text-sm text-rose-600">
          Failed to load cost data. Please try again.
        </div>
      )}

      {/* No results */}
      {!isFetching && query && results.length === 0 && (
        <div className="py-14 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            No cost data found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try a more general term, e.g. &ldquo;MRI&rdquo; instead of &ldquo;lumbar spine MRI&rdquo;.
          </p>
        </div>
      )}

      {/* Results */}
      {!isFetching && results.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            {results.length} procedure{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((r) => (
            <CostCard key={r.procedureName} result={r} />
          ))}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            <Info className="size-4 flex-shrink-0 mt-0.5" />
            <span>
              Prices are averages based on CMS public data. Actual costs vary by location,
              facility, and your specific plan. Always verify with your provider and insurer.
            </span>
          </div>

          <a
            href="https://www.cms.gov/priorities/innovation/data-and-reports"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#06B6D4] transition-colors"
          >
            CMS Data Source <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  )
}
