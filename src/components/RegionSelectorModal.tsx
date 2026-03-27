"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useRegionStore, type Region } from "@/store/regionStore"
import PikiMedLogo from "@/components/PikiMedLogo"

// ── Region card data ──────────────────────────────────────────────────────────

const REGIONS = [
  {
    id:    "BD" as Region,
    flag:  "🇧🇩",
    name:  "Bangladesh",
    sub:   "Dhaka · Chittagong · Sylhet",
    accent: "#06B6D4",
    features: [
      "Find BMDC-verified doctors with live chamber schedules",
      "Compare hospital fees in BDT before you visit",
      "Emergency contacts & ambulance services by district",
    ],
  },
  {
    id:    "US" as Region,
    flag:  "🇺🇸",
    name:  "United States",
    sub:   "New York · Chicago · Los Angeles",
    accent: "#1D9E75",
    features: [
      "Check your insurance network before booking",
      "Compare real procedure cost estimates near you",
      "Find free & sliding-scale FQHC clinics in your area",
    ],
  },
] as const

// ── Animated checkmark ────────────────────────────────────────────────────────

function Checkmark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" fill={color} />
      <path
        d="M6 10.5l2.5 2.5 5-5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Single region card ────────────────────────────────────────────────────────

interface RegionCardProps {
  region:   (typeof REGIONS)[number]
  selected: boolean
  onSelect: () => void
}

function RegionCard({ region, selected, onSelect }: RegionCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col items-start rounded-2xl border-2 p-6",
        "text-left transition-all duration-200 outline-none",
        "focus-visible:ring-4 focus-visible:ring-offset-2",
        selected
          ? "border-transparent shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 scale-[1.02]"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md",
      )}
      style={
        selected
          ? {
              borderColor: region.accent,
              background: `${region.accent}08`,
              // @ts-expect-error custom property
              "--tw-ring-color": region.accent,
            }
          : { "--tw-ring-color": region.accent } as React.CSSProperties
      }
      aria-pressed={selected}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute right-4 top-4">
          <Checkmark color={region.accent} />
        </span>
      )}

      {/* Flag */}
      <span
        className={cn(
          "mb-3 text-5xl transition-transform duration-200",
          "group-hover:scale-110",
          selected && "scale-110",
        )}
        aria-hidden="true"
      >
        {region.flag}
      </span>

      {/* Title */}
      <h3
        className="mb-0.5 text-xl font-bold text-slate-800 dark:text-slate-100"
        style={selected ? { color: region.accent } : undefined}
      >
        {region.name}
      </h3>

      {/* Sub-label */}
      <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
        {region.sub}
      </p>

      {/* Feature list */}
      <ul className="space-y-2">
        {region.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
          >
            <span
              className="mt-0.5 flex-shrink-0 size-1.5 rounded-full"
              style={{ backgroundColor: region.accent, marginTop: "0.45rem" }}
              aria-hidden="true"
            />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div
        className={cn(
          "mt-5 w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200",
          selected
            ? "text-white"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100",
        )}
        style={selected ? { backgroundColor: region.accent } : undefined}
      >
        {selected ? "Selected ✓" : `Select ${region.name}`}
      </div>
    </button>
  )
}

// ── RegionSelectorModal ───────────────────────────────────────────────────────

export default function RegionSelectorModal() {
  const region    = useRegionStore((s) => s.region)
  const setRegion = useRegionStore((s) => s.setRegion)
  const { data: session, update: updateSession } = useSession()

  // Defer rendering until after Zustand rehydrates from localStorage so we
  // don't flash the modal for users who already have a region stored.
  const [hydrated, setHydrated] = useState(false)
  // Tracks which card the user is hovering over / has pressed before confirm
  const [pending, setPending] = useState<Region | null>(null)
  // Controls the exit animation: true = animating out
  const [leaving, setLeaving] = useState(false)

  useEffect(() => setHydrated(true), [])

  // When the session has a region (returning signed-in user), pre-select it
  // in the store so the modal doesn't appear for them.
  useEffect(() => {
    if (session?.user?.region && !region) {
      setRegion(session.user.region as Region)
    }
  }, [session, region, setRegion])

  const visible = hydrated && region === null

  function handleSelect(r: Region) {
    setPending(r)
  }

  async function handleConfirm() {
    if (!pending) return

    // Animate out, then commit
    setLeaving(true)
    await new Promise((res) => setTimeout(res, 250))

    setRegion(pending)

    // If the user is signed in, persist the region to the DB via NextAuth update
    if (session?.user) {
      await updateSession({ region: pending })
    }

    setLeaving(false)
    setPending(null)
  }

  // Nothing to show — don't add the DOM node at all
  if (!visible && !leaving) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select your region"
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4",
        "bg-slate-900/80 backdrop-blur-md",
        "transition-opacity duration-300",
        visible && !leaving ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Modal panel */}
      <div
        className={cn(
          "relative w-full max-w-2xl rounded-3xl",
          "bg-white dark:bg-slate-900",
          "shadow-2xl shadow-slate-900/30",
          "transition-all duration-300",
          visible && !leaving ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6 text-center">
          <PikiMedLogo size="lg" className="mb-6" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            Welcome to PikiMed
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Select your region to personalise your experience. You can change
            it anytime from the navigation bar.
          </p>
        </div>

        {/* Region cards */}
        <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2">
          {REGIONS.map((r) => (
            <RegionCard
              key={r.id}
              region={r}
              selected={pending === r.id}
              onSelect={() => handleSelect(r.id)}
            />
          ))}
        </div>

        {/* Confirm button */}
        <div className="px-6 py-6">
          <button
            onClick={handleConfirm}
            disabled={!pending}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#06B6D4]/50",
              pending
                ? "bg-[#06B6D4] text-white shadow-md hover:bg-[#0E7490] active:scale-[0.98]"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed",
            )}
          >
            {pending
              ? `Continue with ${REGIONS.find((r) => r.id === pending)?.name} →`
              : "Select a region to continue"}
          </button>
        </div>

        {/* Fine print */}
        <p className="pb-6 text-center text-xs text-slate-400 dark:text-slate-600">
          PikiMed serves Bangladesh 🇧🇩 and the United States 🇺🇸
        </p>
      </div>
    </div>
  )
}
