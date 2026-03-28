import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number       // 0–5
  max?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

const SIZE = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
} as const

export default function StarRating({
  value,
  max = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled   = value >= i + 1
        const partial  = !filled && value > i
        const pct      = partial ? Math.round((value - i) * 100) : 0

        return (
          <span key={i} className="relative inline-block">
            {/* Base (empty) star */}
            <Star className={cn(SIZE[size], "text-slate-200 dark:text-slate-700")} fill="currentColor" />
            {/* Filled portion */}
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${pct}%` }}
              >
                <Star className={cn(SIZE[size], "text-amber-400")} fill="currentColor" />
              </span>
            )}
          </span>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  )
}
