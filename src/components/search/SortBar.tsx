"use client"

import { LayoutList, Map, SlidersHorizontal, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortOption = "relevance" | "rating" | "price_asc" | "distance"
export type ViewMode   = "list" | "map"

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  rating:    "Highest Rated",
  price_asc: "Price: Low to High",
  distance:  "Nearest First",
}

interface SortBarProps {
  sort:          SortOption
  view:          ViewMode
  total:         number
  loading:       boolean
  hasLocation:   boolean
  onSortChange:  (s: SortOption) => void
  onViewChange:  (v: ViewMode) => void
  onFilterClick: () => void
  className?:    string
}

export default function SortBar({
  sort,
  view,
  total,
  loading,
  hasLocation,
  onSortChange,
  onViewChange,
  onFilterClick,
  className,
}: SortBarProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Mobile: filter button */}
      <button
        onClick={onFilterClick}
        className={cn(
          "lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700",
          "bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
          "transition-colors",
        )}
      >
        <SlidersHorizontal className="size-4" />
        Filters
      </button>

      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={cn(
            "appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200",
            "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40",
            "cursor-pointer",
          )}
        >
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
            <option key={val} value={val} disabled={val === "distance" && !hasLocation}>
              {label}{val === "distance" && !hasLocation ? " (enable location)" : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
      </div>

      {/* Results count */}
      <span className="text-sm text-slate-500 dark:text-slate-400 flex-1">
        {loading ? (
          <span className="animate-pulse">Searching…</span>
        ) : (
          <>{total.toLocaleString()} result{total !== 1 ? "s" : ""}</>
        )}
      </span>

      {/* View toggle */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => onViewChange("list")}
          aria-label="List view"
          className={cn(
            "p-2 transition-colors",
            view === "list"
              ? "bg-[#06B6D4] text-white"
              : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
          )}
        >
          <LayoutList className="size-4" />
        </button>
        <button
          onClick={() => onViewChange("map")}
          aria-label="Map view"
          className={cn(
            "p-2 transition-colors",
            view === "map"
              ? "bg-[#06B6D4] text-white"
              : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
          )}
        >
          <Map className="size-4" />
        </button>
      </div>
    </div>
  )
}
