"use client"

import { useState } from "react"
import { Phone, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const EMERGENCY_NUMBERS = [
  { label: "National Emergency", number: "999",   color: "#EF4444" },
  { label: "Health Helpline",    number: "16430",  color: "#06B6D4" },
  { label: "Hospital Info",      number: "10655",  color: "#0E7490" },
  { label: "Fire Service",       number: "199",    color: "#F97316" },
  { label: "Ambulance",          number: "16332",  color: "#1D9E75" },
  { label: "DGDA Hotline",       number: "10921",  color: "#8B5CF6" },
] as const

export default function EmergencyStrip({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 overflow-hidden", className)}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <AlertCircle className="size-4" />
          Emergency &amp; Helpline Numbers
        </span>
        {open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {/* Expandable grid */}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 gap-px bg-red-100/50 dark:bg-red-900/20 transition-all duration-300 overflow-hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        {EMERGENCY_NUMBERS.map(({ label, number, color }) => (
          <a
            key={number}
            href={`tel:${number}`}
            className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span
              className="flex size-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}15` }}
            >
              <Phone className="size-3.5" style={{ color }} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color }}>
                {number}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
