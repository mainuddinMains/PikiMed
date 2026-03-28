"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin, RefreshCw, Check, X, Loader2, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBDLocation, type BDLocation } from "@/store/bdLocationStore"

// ── Reverse geocode via Nominatim ──────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<BDLocation | null> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    )
    if (!res.ok) return null
    const data = await res.json()

    const a        = data.address ?? {}
    const area     = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.village ?? ""
    const district = a.city_district ?? a.county ?? a.city ?? ""
    const city     = a.city ?? a.town ?? a.state_district ?? ""
    const label    = [area, city || district].filter(Boolean).join(", ") || data.display_name

    return { lat, lng, label, district: district || city, updatedAt: Date.now() }
  } catch {
    return null
  }
}

// Forward geocode (for manual override)
async function forwardGeocode(q: string): Promise<BDLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", Bangladesh")}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    )
    if (!res.ok) return null
    const [result] = await res.json()
    if (!result) return null

    const a   = result.address ?? {}
    const district = a.city_district ?? a.county ?? a.city ?? a.state_district ?? q
    return {
      lat:       parseFloat(result.lat),
      lng:       parseFloat(result.lon),
      label:     result.display_name.split(",").slice(0, 2).join(", ").trim(),
      district,
      updatedAt: Date.now(),
    }
  } catch {
    return null
  }
}

// ── Time-ago helper ────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 5)   return "just now"
  if (secs < 60)  return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

// ── Component ──────────────────────────────────────────────────────────────────

interface LocationBarProps {
  className?: string
}

type State = "idle" | "requesting" | "error"

export default function LocationBar({ className }: LocationBarProps) {
  const { location, setLocation } = useBDLocation()

  const [geoState,  setGeoState]  = useState<State>("idle")
  const [editing,   setEditing]   = useState(false)
  const [inputVal,  setInputVal]  = useState("")
  const [searching, setSearching] = useState(false)
  const [, setTick] = useState(0)
  const inputRef   = useRef<HTMLInputElement>(null)

  // Re-render every minute to update "X min ago"
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Request geolocation on first mount if no location stored
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoState("error"); return }
    setGeoState("requesting")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        if (result) setLocation(result)
        setGeoState("idle")
      },
      () => setGeoState("error"),
      { timeout: 8000, enableHighAccuracy: false },
    )
  }, [setLocation])

  useEffect(() => {
    if (!location) requestGeo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus input when editing opens
  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [editing])

  async function handleManualSearch() {
    if (!inputVal.trim()) { setEditing(false); return }
    setSearching(true)
    const result = await forwardGeocode(inputVal.trim())
    setSearching(false)
    if (result) {
      setLocation(result)
      setEditing(false)
      setInputVal("")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <MapPin className="size-4 text-[#06B6D4] flex-shrink-0" />
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleManualSearch()
            if (e.key === "Escape") setEditing(false)
          }}
          placeholder="Type area or district…"
          className="flex-1 text-sm bg-transparent border-b border-[#06B6D4] focus:outline-none py-0.5 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        {searching
          ? <Loader2 className="size-4 text-slate-400 animate-spin" />
          : (
            <>
              <button onClick={handleManualSearch} className="text-[#06B6D4] hover:text-[#0E7490]">
                <Check className="size-4" />
              </button>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </>
          )
        }
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {/* Pulsing dot */}
      <span className="relative flex-shrink-0">
        {geoState === "requesting" ? (
          <Loader2 className="size-3.5 text-[#06B6D4] animate-spin" />
        ) : (
          <>
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#06B6D4] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#06B6D4]" />
          </>
        )}
      </span>

      {location ? (
        // Location known
        <button
          onClick={() => { setInputVal(location.label); setEditing(true) }}
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-[#06B6D4] transition-colors group"
        >
          <MapPin className="size-3.5 text-[#06B6D4]" />
          <span className="font-semibold">{location.label}</span>
          <span className="text-slate-400 text-xs">· {timeAgo(location.updatedAt)}</span>
          <Edit2 className="size-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ) : geoState === "error" ? (
        // Error state
        <button
          onClick={() => { setEditing(true); setInputVal("") }}
          className="flex items-center gap-1 text-slate-500 hover:text-[#06B6D4] transition-colors"
        >
          <MapPin className="size-3.5" />
          <span>Set location</span>
        </button>
      ) : geoState === "requesting" ? (
        <span className="text-slate-400 text-xs">Detecting location…</span>
      ) : (
        <button
          onClick={requestGeo}
          className="flex items-center gap-1 text-slate-500 hover:text-[#06B6D4] transition-colors"
        >
          <MapPin className="size-3.5" />
          <span>Enable location</span>
        </button>
      )}

      {/* Refresh */}
      {location && geoState !== "requesting" && (
        <button
          onClick={requestGeo}
          title="Refresh location"
          className="text-slate-400 hover:text-[#06B6D4] transition-colors"
        >
          <RefreshCw className="size-3" />
        </button>
      )}
    </div>
  )
}
