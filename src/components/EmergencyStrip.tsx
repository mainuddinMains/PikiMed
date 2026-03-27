"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Emergency numbers ──────────────────────────────────────────────────────────

const NUMBERS = [
  { label: "National Emergency", number: "999",   icon: "🚨" },
  { label: "Health Helpline",    number: "16430",  icon: "🏥" },
  { label: "Ambulance (Dhaka)", number: "10655",  icon: "🚑" },
  { label: "Fire Service",       number: "199",    icon: "🚒" },
  { label: "DGDA",               number: "16332",  icon: "💊" },
  { label: "Mental Health",      number: "10921",  icon: "🧠" },
] as const

const LS_KEY = "pikimed_emergency_collapsed"

// ── Component ──────────────────────────────────────────────────────────────────

interface EmergencyStripProps {
  className?: string
}

export default function EmergencyStrip({ className }: EmergencyStripProps) {
  // Start collapsed by default; load persisted state from localStorage
  const [collapsed, setCollapsed] = useState(true)
  const [hydrated,  setHydrated]  = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    // If user explicitly opened it (stored = "false"), keep it open
    if (stored === "false") setCollapsed(false)
    setHydrated(true)
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(LS_KEY, String(next))
      return next
    })
  }

  // Avoid hydration flash
  if (!hydrated) return null

  return (
    <div className={cn("rounded-2xl overflow-hidden select-none", className)}>
      {/* Collapsed / header bar */}
      <button
        onClick={toggle}
        className={cn(
          "w-full flex items-center justify-between px-4 text-white font-bold text-sm transition-all",
          collapsed ? "py-2.5 bg-red-600 hover:bg-red-700" : "py-3 bg-red-700",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🆘</span>
          <span>Emergency Numbers</span>
        </div>
        {collapsed
          ? <ChevronDown className="size-4 opacity-80" />
          : <ChevronUp   className="size-4 opacity-80" />}
      </button>

      {/* Expanded grid */}
      {!collapsed && (
        <div className="bg-red-600 px-4 pb-4 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {NUMBERS.map(({ label, number, icon }) => (
              <a
                key={number}
                href={`tel:${number}`}
                className="flex items-center gap-2.5 bg-red-700/60 hover:bg-red-800/70 active:scale-[0.97] rounded-xl px-3 py-3 transition-all"
              >
                <span className="text-lg leading-none">{icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] text-red-200 font-medium leading-none mb-0.5 truncate">{label}</p>
                  <p className="text-white font-extrabold text-base leading-none tabular-nums tracking-wide flex items-center gap-1">
                    <Phone className="size-3 opacity-70" />
                    {number}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <p className="mt-3 text-center text-red-300 text-[10px]">
            Tap any number to call · Works on all mobile networks in Bangladesh
          </p>
        </div>
      )}
    </div>
  )
}
