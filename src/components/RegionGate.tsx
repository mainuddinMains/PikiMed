"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useRegionStore } from "@/store/regionStore"
import type { Region } from "@/store/regionStore"

interface RegionGateProps {
  /** Which region is required to view the children. */
  requiredRegion: Region
  children: React.ReactNode
  /** Where to redirect users whose region doesn't match. Default: "/" */
  fallback?: string
}

/**
 * Renders `children` only when the active region matches `requiredRegion`.
 * On a mismatch it redirects to `fallback` (default "/").
 * While Zustand is rehydrating from localStorage the children are rendered
 * unchanged — the redirect fires only once we know the real region value.
 */
export function RegionGate({
  requiredRegion,
  children,
  fallback = "/",
}: RegionGateProps) {
  const router = useRouter()
  const region = useRegionStore((s) => s.region)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  useEffect(() => {
    if (hydrated && region !== null && region !== requiredRegion) {
      router.replace(fallback)
    }
  }, [hydrated, region, requiredRegion, fallback, router])

  // Pass through before hydration or when region is null (modal will prompt)
  // or when the region matches.
  if (!hydrated || region === null || region === requiredRegion) {
    return <>{children}</>
  }

  // Redirect in-flight — render nothing.
  return null
}
