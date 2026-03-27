"use client"

import { useEffect, useState } from "react"
import { useRegionStore, type Region } from "@/store/regionStore"

export type { Region }
export { RegionGate } from "@/components/RegionGate"

// ── useRegion ─────────────────────────────────────────────────────────────────
// Primary hook for reading / writing the region.
// Returns the current region (null until the user selects one),
// a setter, and convenience booleans isBD / isUS.

export function useRegion() {
  const region    = useRegionStore((s) => s.region)
  const setRegion = useRegionStore((s) => s.setRegion)
  const clear     = useRegionStore((s) => s.clearRegion)

  return {
    region,
    setRegion,
    clearRegion: clear,
    isBD: region === "BD",
    isUS: region === "US",
  }
}

// ── useHydratedRegion ─────────────────────────────────────────────────────────
// Like useRegion but also exposes `hydrated` so callers can defer rendering
// until localStorage has been read — avoids a flash of wrong region on first
// paint when SSR and client state differ.

export function useHydratedRegion() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return { ...useRegion(), hydrated }
}
