"use client"

import { X, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Filters {
  type:      "all" | "doctor" | "hospital"
  specialty: string
  city:      string
  minRating: number   // 0 = any
  maxFee:    number   // 0 = any
  available: boolean
}

export const DEFAULT_FILTERS: Filters = {
  type:      "all",
  specialty: "",
  city:      "",
  minRating: 0,
  maxFee:    0,
  available: false,
}

interface FilterSidebarProps {
  filters:   Filters
  onChange:  (f: Filters) => void
  region:    "BD" | "US" | null
  onClose?:  () => void
  className?: string
}

const MAX_FEE_BD = 5_000   // BDT
const MAX_FEE_US = 500     // USD

export default function FilterSidebar({
  filters,
  onChange,
  region,
  onClose,
  className,
}: FilterSidebarProps) {
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    onChange({ ...filters, [key]: val })

  const maxFeeLimit = region === "US" ? MAX_FEE_US : MAX_FEE_BD
  const currency    = region === "US" ? "$" : "৳"

  const hasActive =
    filters.type !== "all" ||
    !!filters.specialty ||
    !!filters.city ||
    filters.minRating > 0 ||
    filters.maxFee > 0 ||
    filters.available

  return (
    <aside className={cn("flex flex-col gap-5 text-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800 dark:text-slate-100">Filters</span>
        <div className="flex items-center gap-2">
          {hasActive && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="text-xs text-[#06B6D4] hover:underline"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close filters"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Result type */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Show
        </label>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(["all", "doctor", "hospital"] as const).map((t) => (
            <button
              key={t}
              onClick={() => set("type", t)}
              className={cn(
                "flex-1 py-2 text-xs font-medium transition-colors capitalize",
                filters.type === t
                  ? "bg-[#06B6D4] text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              {t === "all" ? "All" : t === "doctor" ? "Doctors" : "Hospitals"}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty (doctors only) */}
      {(filters.type === "all" || filters.type === "doctor") && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Specialty
          </label>
          <input
            value={filters.specialty}
            onChange={(e) => set("specialty", e.target.value)}
            placeholder="e.g. Cardiology"
            className={cn(
              "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm",
              "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100",
              "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40",
            )}
          />
        </div>
      )}

      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          City
        </label>
        <input
          value={filters.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder={region === "BD" ? "e.g. Dhaka" : "e.g. Chicago"}
          className={cn(
            "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm",
            "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100",
            "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40",
          )}
        />
      </div>

      {/* Min rating */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Min Rating
        </label>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => set("minRating", n)}
              className={cn(
                "flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-colors text-xs",
                filters.minRating === n
                  ? "bg-amber-400 border-amber-400 text-white font-semibold"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-300",
              )}
            >
              {n === 0 ? "Any" : (
                <span className="flex items-center gap-0.5">
                  {n}<Star className="size-2.5 fill-current" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Max fee */}
      {(filters.type === "all" || filters.type === "doctor") && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Max Fee{" "}
            <span className="font-normal text-slate-400">
              {filters.maxFee > 0 ? `(${currency}${filters.maxFee.toLocaleString()})` : "(any)"}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={maxFeeLimit}
            step={region === "US" ? 10 : 100}
            value={filters.maxFee}
            onChange={(e) => set("maxFee", parseInt(e.target.value))}
            className="w-full accent-[#06B6D4]"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Any</span>
            <span>{currency}{maxFeeLimit.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Available today */}
      {(filters.type === "all" || filters.type === "doctor") && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.available}
              onChange={(e) => set("available", e.target.checked)}
            />
            <div
              className={cn(
                "w-9 h-5 rounded-full transition-colors",
                filters.available ? "bg-[#06B6D4]" : "bg-slate-200 dark:bg-slate-700",
              )}
            />
            <div
              className={cn(
                "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                filters.available && "translate-x-4",
              )}
            />
          </div>
          <span className="text-slate-700 dark:text-slate-300">Available today</span>
        </label>
      )}
    </aside>
  )
}
