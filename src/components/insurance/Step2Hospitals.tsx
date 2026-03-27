"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import {
  MapPin, Navigation, LayoutList, Map as MapIcon,
  CheckCircle2, XCircle, ArrowLeft, ArrowRight, Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useInsuranceWizard, type WizardLocation } from "@/store/insuranceWizardStore"

// ── Lazy map ───────────────────────────────────────────────────────────────────

const HospitalMap = dynamic(() => import("@/components/insurance/HospitalMap"), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────────

interface HospitalResult {
  id:         string
  name:       string
  slug:       string
  type:       string
  address:    string | null
  city:       string | null
  state:      string | null
  phone:      string | null
  lat:        number | null
  lng:        number | null
  avgRating:  number | null
  isOpen24h:  boolean
  inNetwork:  boolean
  distanceKm: number | null
}

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchHospitals(planId: string, loc: WizardLocation | null): Promise<HospitalResult[]> {
  const sp = new URLSearchParams({ planId })
  if (loc) { sp.set("lat", String(loc.lat)); sp.set("lng", String(loc.lng)) }
  const res = await fetch(`/api/insurance/hospitals?${sp}`)
  if (!res.ok) throw new Error("Failed to load hospitals")
  return res.json()
}

// ── Geocode via Nominatim ──────────────────────────────────────────────────────

async function geocode(address: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address + ", USA")}`
  const res = await fetch(url, { headers: { "Accept-Language": "en" } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data[0]) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
}

// ── Hospital card ──────────────────────────────────────────────────────────────

function HospitalCard({ h, mapboxToken }: { h: HospitalResult; mapboxToken?: string }) {
  const badgeClass = h.inNetwork
    ? "bg-green-100 text-green-700 border border-green-200"
    : "bg-rose-100 text-rose-700 border border-rose-200"

  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all",
      h.inNetwork
        ? "border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10"
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", badgeClass)}>
              {h.inNetwork ? (
                <><CheckCircle2 className="inline size-3 mr-0.5" />In-Network</>
              ) : (
                <><XCircle className="inline size-3 mr-0.5" />Out-of-Network</>
              )}
            </span>
            {h.isOpen24h && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-700 border border-cyan-200">
                24h
              </span>
            )}
          </div>

          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug">{h.name}</h3>

          {(h.city || h.state) && (
            <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="size-3" />
              {[h.address, h.city, h.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          {h.distanceKm != null && (
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {h.distanceKm < 1
                ? `${Math.round(h.distanceKm * 1000)}m`
                : `${h.distanceKm.toFixed(1)} km`}
            </p>
          )}
          {h.avgRating != null && (
            <p className="text-xs text-amber-500 font-semibold">★ {h.avgRating.toFixed(1)}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {h.phone && (
          <a
            href={`tel:${h.phone}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Phone className="size-3" />
            Call
          </a>
        )}
        <a
          href={`/hospital/${h.slug}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#06B6D4]/10 text-xs font-semibold text-[#06B6D4] hover:bg-[#06B6D4]/20 transition-colors"
        >
          View details
        </a>
      </div>
    </div>
  )
}

// ── Step2Hospitals ─────────────────────────────────────────────────────────────

export default function Step2Hospitals({ mapboxToken }: { mapboxToken?: string }) {
  const { plan, location, setLocation, setStep } = useInsuranceWizard()

  const [view,         setView]         = useState<"list" | "map">("list")
  const [addrInput,    setAddrInput]    = useState(location?.label ?? "")
  const [geocoding,    setGeocoding]    = useState(false)
  const [geoError,     setGeoError]     = useState("")
  const [showInNetwork, setShowInNetwork] = useState<"all" | "in" | "out">("all")

  const { data: hospitals = [], isFetching } = useQuery({
    queryKey:  ["insurance-hospitals", plan?.id, location?.lat, location?.lng],
    queryFn:   () => fetchHospitals(plan!.id, location),
    enabled:   !!plan,
    staleTime: 120_000,
  })

  const filtered = hospitals.filter((h) => {
    if (showInNetwork === "in")  return h.inNetwork
    if (showInNetwork === "out") return !h.inNetwork
    return true
  })

  const inNetworkCount  = hospitals.filter((h) => h.inNetwork).length
  const outNetworkCount = hospitals.length - inNetworkCount

  // Geolocation
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        const res  = await fetch(reverseUrl, { headers: { "Accept-Language": "en" } })
        const data = await res.json()
        const label = data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setLocation({ lat, lng, label })
        setAddrInput(label)
      },
      () => setGeoError("Could not get your location"),
    )
  }, [setLocation])

  async function handleSearch() {
    if (!addrInput.trim()) return
    setGeocoding(true)
    setGeoError("")
    try {
      const result = await geocode(addrInput)
      if (result) {
        setLocation(result)
        setAddrInput(result.label)
      } else {
        setGeoError("Address not found. Try a city, zip, or full address.")
      }
    } finally {
      setGeocoding(false)
    }
  }

  if (!plan) return null

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hospital Match</h2>
        <p className="text-sm text-slate-500 mt-1">
          Hospitals that accept <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.name}</span> near you.
        </p>
      </div>

      {/* Location input */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
          Your Location (optional)
        </label>
        <div className="flex gap-2">
          <input
            value={addrInput}
            onChange={(e) => setAddrInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="City, zip code, or full address…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
          />
          <button
            onClick={handleSearch}
            disabled={geocoding}
            className="px-4 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0E7490] transition-colors disabled:opacity-60"
          >
            {geocoding ? "…" : <MapPin className="size-4" />}
          </button>
          <button
            onClick={useMyLocation}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Use my location"
          >
            <Navigation className="size-4 text-slate-500" />
          </button>
        </div>
        {geoError && <p className="mt-1.5 text-xs text-rose-600">{geoError}</p>}
        {location && (
          <p className="mt-1.5 text-xs text-slate-400 truncate">
            <MapPin className="inline size-3 mr-0.5" />
            {location.label}
          </p>
        )}
      </div>

      {/* Stats + filters */}
      {!isFetching && hospitals.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold">{inNetworkCount} in-network</span>
            <span className="text-slate-400">·</span>
            <span className="text-rose-500 font-semibold">{outNetworkCount} out-of-network</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Network filter */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
              {(["all", "in", "out"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setShowInNetwork(v)}
                  className={cn(
                    "px-3 py-1.5 font-medium capitalize transition-colors",
                    showInNetwork === v
                      ? "bg-[#06B6D4] text-white"
                      : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                  )}
                >
                  {v === "all" ? "All" : v === "in" ? "In-Network" : "Out-of-Network"}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-2 transition-colors",
                  view === "list"
                    ? "bg-[#06B6D4] text-white"
                    : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <LayoutList className="size-3.5" />
              </button>
              <button
                onClick={() => setView("map")}
                disabled={!mapboxToken}
                className={cn(
                  "p-2 transition-colors",
                  view === "map"
                    ? "bg-[#06B6D4] text-white"
                    : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                  !mapboxToken && "opacity-40 cursor-not-allowed",
                )}
              >
                <MapIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isFetching && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Map view */}
      {!isFetching && view === "map" && mapboxToken && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-96">
          <HospitalMap hospitals={filtered} center={location ?? undefined} mapboxToken={mapboxToken} />
        </div>
      )}

      {/* List view */}
      {!isFetching && view === "list" && (
        <>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No hospitals match this filter.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((h) => (
                <HospitalCard key={h.id} h={h} mapboxToken={mapboxToken} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#0E7490] transition-colors active:scale-[0.99]"
        >
          Check Eligibility <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
