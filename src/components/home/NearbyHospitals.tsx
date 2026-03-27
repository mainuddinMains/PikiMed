"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import HospitalCard from "./HospitalCard"
import { SectionSkeleton } from "./Skeletons"
import LocationBar from "./LocationBar"
import { haversineKm, type Hospital } from "./types"
import type { Region } from "@/store/regionStore"

interface NearbyHospitalsProps {
  region: Region
}

async function fetchHospitals(region: string): Promise<Hospital[]> {
  const res = await fetch(`/api/hospitals?region=${region}`)
  if (!res.ok) throw new Error("Failed to fetch hospitals")
  return res.json()
}

export default function NearbyHospitals({ region }: NearbyHospitalsProps) {
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const { data: hospitals, isLoading, error } = useQuery({
    queryKey: ["hospitals", region],
    queryFn: () => fetchHospitals(region!),
    enabled: !!region,
  })

  function handleLocation(lat: number, lng: number) {
    setUserLat(lat)
    setUserLng(lng)
  }

  // Sort by distance if we have user location
  const sorted = hospitals
    ? [...hospitals].sort((a, b) => {
        if (userLat == null || userLng == null) return 0
        const dA =
          a.lat != null && a.lng != null
            ? haversineKm(userLat, userLng, a.lat, a.lng)
            : Infinity
        const dB =
          b.lat != null && b.lng != null
            ? haversineKm(userLat, userLng, b.lat, b.lng)
            : Infinity
        return dA - dB
      })
    : []

  const visible = showAll ? sorted : sorted.slice(0, 4)

  return (
    <section>
      <div className="mb-3">
        <LocationBar onLocation={handleLocation} />
      </div>

      {isLoading && <SectionSkeleton count={4} />}

      {error && (
        <p className="text-sm text-slate-400 text-center py-6">
          Could not load hospitals. Please try again.
        </p>
      )}

      {!isLoading && !error && sorted.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">
          No hospitals found for your region yet.
        </p>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="space-y-3">
          {visible.map((hospital) => {
            const dist =
              userLat != null && userLng != null && hospital.lat != null && hospital.lng != null
                ? haversineKm(userLat, userLng, hospital.lat, hospital.lng)
                : undefined
            return (
              <HospitalCard key={hospital.id} hospital={hospital} distanceKm={dist} />
            )
          })}

          {sorted.length > 4 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full py-3 text-sm font-semibold text-[#06B6D4] hover:text-[#0E7490] transition-colors"
            >
              {showAll ? "Show fewer" : `Show all ${sorted.length} hospitals`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
