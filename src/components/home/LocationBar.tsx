"use client"

import { useEffect, useState } from "react"
import { MapPin, Loader2, AlertCircle } from "lucide-react"

interface GeoState {
  status: "idle" | "loading" | "ok" | "error"
  city: string | null
  lat: number | null
  lng: number | null
}

interface LocationBarProps {
  onLocation?: (lat: number, lng: number) => void
}

export default function LocationBar({ onLocation }: LocationBarProps) {
  const [geo, setGeo] = useState<GeoState>({ status: "idle", city: null, lat: null, lng: null })

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo((s) => ({ ...s, status: "error" }))
      return
    }

    setGeo((s) => ({ ...s, status: "loading" }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        onLocation?.(lat, lng)

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } },
          )
          const data = await res.json()
          const addr = data.address ?? {}
          const city =
            addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? "your area"
          setGeo({ status: "ok", city, lat, lng })
        } catch {
          setGeo({ status: "ok", city: null, lat, lng })
        }
      },
      () => setGeo({ status: "error", city: null, lat: null, lng: null }),
      { timeout: 8000 },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (geo.status === "idle") return null

  return (
    <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500 dark:text-slate-400">
      {geo.status === "loading" && (
        <>
          <Loader2 className="size-4 animate-spin text-[#06B6D4]" />
          <span>Detecting your location…</span>
        </>
      )}
      {geo.status === "ok" && (
        <>
          <MapPin className="size-4 text-[#06B6D4]" />
          <span>
            Showing results near{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {geo.city ?? "your location"}
            </span>
          </span>
        </>
      )}
      {geo.status === "error" && (
        <>
          <AlertCircle className="size-4 text-amber-400" />
          <span>Enable location for distance-sorted results</span>
        </>
      )}
    </div>
  )
}
