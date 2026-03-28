"use client"

import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "Coverage" },
  { n: 2, label: "Hospitals" },
  { n: 3, label: "Eligibility" },
]

interface ProgressBarProps {
  step: 1 | 2 | 3
  onStepClick?: (s: 1 | 2 | 3) => void
}

export default function ProgressBar({ step, onStepClick }: ProgressBarProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <button
              onClick={() => onStepClick?.(s.n as 1 | 2 | 3)}
              disabled={!onStepClick || s.n > step}
              className={cn(
                "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                s.n < step
                  ? "bg-[#06B6D4] border-[#06B6D4] text-white cursor-pointer"
                  : s.n === step
                  ? "bg-white border-[#06B6D4] text-[#06B6D4] shadow-md shadow-cyan-100"
                  : "bg-white border-slate-200 text-slate-400 cursor-not-allowed",
              )}
            >
              {s.n < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.n
              )}
            </button>

            {/* Label */}
            <span
              className={cn(
                "ml-2 text-xs font-semibold",
                s.n === step
                  ? "text-[#06B6D4]"
                  : s.n < step
                  ? "text-slate-600 dark:text-slate-300"
                  : "text-slate-400",
              )}
            >
              {s.label}
            </span>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[#06B6D4] transition-all duration-500"
                  style={{ width: step > s.n ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
