"use client"

import { useHydratedRegion } from "@/lib/region"
import BDHome from "@/components/home/BDHome"
import USHome from "@/components/home/USHome"
import { HeroSkeleton } from "@/components/home/Skeletons"

export default function HomePage() {
  const { region, hydrated } = useHydratedRegion()

  // Wait for Zustand to rehydrate from localStorage before deciding what to render.
  // This prevents a flash of the wrong page or a premature redirect.
  if (!hydrated) {
    return <HeroSkeleton />
  }

  // No region selected — RegionSelectorModal (mounted in Providers) handles this.
  if (!region) {
    return null
  }

  return region === "BD" ? <BDHome /> : <USHome />
}
