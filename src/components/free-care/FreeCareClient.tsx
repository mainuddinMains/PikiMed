"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import {
  Navigation, MapPin, Phone, Map as MapIcon, LayoutList,
  DollarSign, Heart, Languages, SlidersHorizontal, X, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ClinicMap = dynamic(() => import("@/components/free-care/ClinicMap"), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────────

interface HoursJson {
  monday?:    string
  tuesday?:   string
  wednesday?: string
  thursday?:  string
  friday?:    string
  saturday?:  string
  sunday?:    string
}

interface Clinic {
  id:              string
  name:            string
  address:         string | null
  city:            string
  state:           string
  lat:             number | null
  lng:             number | null
  phone:           string | null
  isSliding:       boolean
  isFree:          boolean
  servicesOffered: string[]
  languages:       string[]
  hours:           HoursJson | null
  distanceKm:      number | null
}

// ── API ────────────────────────────────────────────────────────────────────────

interface Filters {
  isSliding: boolean
  isFree:    boolean
  language:  string
  service:   string
  radius:    number
}

interface Location { lat: number; lng: number; label: string }

async function fetchClinics(filters: Filters, loc: Location | null): Promise<Clinic[]> {
  const sp = new URLSearchParams({ radius: String(filters.radius) })
  if (loc) { sp.set("lat", String(loc.lat)); sp.set("lng", String(loc.lng)) }
  if (filters.isSliding) sp.set("isSliding", "true")
  if (filters.isFree)    sp.set("isFree",    "true")
  if (filters.language)  sp.set("language",  filters.language)
  if (filters.service)   sp.set("service",   filters.service)
  const res = await fetch(`/api/clinics?${sp}`)
  if (!res.ok) throw new Error("Failed to load clinics")
  return res.json()
}

async function geocode(q: string): Promise<Location | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + " USA")}`
  const res = await fetch(url, { headers: { "Accept-Language": "en" } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data[0]) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
}

// ── Today's hours ──────────────────────────────────────────────────────────────

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const
type Day = typeof DAYS[number]

function todayHours(hours: HoursJson | null): string | null {
  if (!hours) return null
  const day = DAYS[new Date().getDay()] as Day
  return (hours as Record<string, string>)[day] ?? null
}

// ── Clinic card ────────────────────────────────────────────────────────────────

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const fullAddr = [clinic.address, clinic.city, clinic.state].filter(Boolean).join(", ")
  const mapsUrl  = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`
  const hours    = todayHours(clinic.hours)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {clinic.isFree && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-0.5">
                <Heart className="size-2.5" /> Free
              </span>
            )}
            {clinic.isSliding && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-0.5">
                <DollarSign className="size-2.5" /> Sliding Scale
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">{clinic.name}</h3>
          {fullAddr && (
            <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="size-3 flex-shrink-0" />
              {fullAddr}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-right space-y-0.5">
          {clinic.distanceKm != null && (
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {clinic.distanceKm < 1
                ? `${Math.round(clinic.distanceKm * 1000)} m`
                : `${clinic.distanceKm.toFixed(1)} km`}
            </p>
          )}
          {hours && (
            <p className="text-[10px] text-slate-400">Today: {hours}</p>
          )}
        </div>
      </div>

      {/* Services badges */}
      {clinic.servicesOffered.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {(expanded ? clinic.servicesOffered : clinic.servicesOffered.slice(0, 4)).map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
            >
              {s}
            </span>
          ))}
          {!expanded && clinic.servicesOffered.length > 4 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[10px] text-slate-400 hover:text-[#06B6D4] transition-colors"
            >
              +{clinic.servicesOffered.length - 4} more
            </button>
          )}
        </div>
      )}

      {/* Languages */}
      {clinic.languages.length > 0 && (
        <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
          <Languages className="size-3" />
          {clinic.languages.join(" · ")}
        </p>
      )}

      {/* CTA buttons */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#06B6D4] text-white text-xs font-bold hover:bg-[#0E7490] transition-colors"
        >
          <Navigation className="size-3.5" /> Get Directions
        </a>
        {clinic.phone && (
          <a
            href={`tel:${clinic.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Phone className="size-3.5" /> Call Now
          </a>
        )}
      </div>
    </div>
  )
}

// ── Filter panel ───────────────────────────────────────────────────────────────

const COMMON_LANGUAGES = ["English","Spanish","Mandarin","Cantonese","Vietnamese","Korean","Arabic","French","Portuguese"]
const COMMON_SERVICES  = [
  "Primary Care","Dental","Mental Health","OB-GYN","Pediatrics",
  "Substance Use","HIV/STI Testing","Vision","Pharmacy","Nutrition",
]

function FilterPanel({
  filters,
  onChange,
  onClose,
}: {
  filters:  Filters
  onChange: (f: Partial<Filters>) => void
  onClose?: () => void
}) {
  return (
    <div className="space-y-5">
      {onClose && (
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Filters</h3>
          <button onClick={onClose}><X className="size-5 text-slate-400" /></button>
        </div>
      )}

      {/* Cost type */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cost Type</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isFree}
              onChange={(e) => onChange({ isFree: e.target.checked })}
              className="rounded accent-[#06B6D4]"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Heart className="size-3.5 text-green-600" /> Completely Free
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isSliding}
              onChange={(e) => onChange({ isSliding: e.target.checked })}
              className="rounded accent-[#06B6D4]"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <DollarSign className="size-3.5 text-blue-600" /> Sliding Scale Fee
            </span>
          </label>
        </div>
      </div>

      {/* Radius */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search Radius</label>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{filters.radius} km</span>
        </div>
        <input
          type="range" min={5} max={200} step={5}
          value={filters.radius}
          onChange={(e) => onChange({ radius: Number(e.target.value) })}
          className="w-full accent-[#06B6D4]"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>5 km</span><span>200 km</span></div>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Language Spoken</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => onChange({ language: filters.language === l ? "" : l })}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                filters.language === l
                  ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]/60",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Service */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Services Offered</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SERVICES.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ service: filters.service === s ? "" : s })}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                filters.service === s
                  ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#06B6D4]/60",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({ isSliding: false, isFree: false, language: "", service: "", radius: 50 })}
        className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        Reset filters
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Filters = { isSliding: false, isFree: false, language: "", service: "", radius: 50 }

export default function FreeCareClient({ mapboxToken }: { mapboxToken?: string }) {
  const [location,     setLocation]     = useState<Location | null>(null)
  const [addrInput,    setAddrInput]    = useState("")
  const [geocoding,    setGeocoding]    = useState(false)
  const [geoError,     setGeoError]     = useState("")
  const [filters,      setFilters]      = useState<Filters>(DEFAULT_FILTERS)
  const [view,         setView]         = useState<"list" | "map">("list")
  const [mobileFilter, setMobileFilter] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: clinics = [], isFetching } = useQuery({
    queryKey:  ["clinics", location?.lat, location?.lng, filters],
    queryFn:   () => fetchClinics(filters, location),
    staleTime: 60_000,
  })

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  function handleSearch() {
    if (!addrInput.trim()) return
    setGeocoding(true)
    setGeoError("")
    geocode(addrInput).then((result) => {
      if (result) { setLocation(result); setAddrInput(result.label) }
      else setGeoError("Address not found — try a city or zip code.")
    }).finally(() => setGeocoding(false))
  }

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        const data = await res.json()
        const loc: Location = { lat, lng, label: data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
        setLocation(loc)
        setAddrInput(loc.label)
      },
      () => setGeoError("Could not get your location."),
    )
  }, [])

  const activeFilterCount = [
    filters.isFree, filters.isSliding,
    !!filters.language, !!filters.service,
    filters.radius !== 50,
  ].filter(Boolean).length

  return (
    <div>
      {/* Location search bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Location</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              ref={inputRef}
              value={addrInput}
              onChange={(e) => setAddrInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="City, zip code, or address…"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={geocoding}
            className="px-4 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-bold hover:bg-[#0E7490] transition-colors disabled:opacity-60"
          >
            {geocoding ? "…" : "Search"}
          </button>
          <button
            onClick={useMyLocation}
            title="Use my location"
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Navigation className="size-4 text-slate-500" />
          </button>
        </div>
        {geoError && <p className="mt-1.5 text-xs text-rose-600">{geoError}</p>}
        {location && <p className="mt-1.5 text-xs text-slate-400 truncate"><MapPin className="inline size-3 mr-0.5" />{location.label}</p>}
      </div>

      <div className="flex gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <FilterPanel filters={filters} onChange={patchFilters} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isFetching ? "Loading…" : `${clinics.length} clinic${clinics.length !== 1 ? "s" : ""}`}
              </span>
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFilter(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#06B6D4] text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
              <button
                onClick={() => setView("list")}
                className={cn("p-2 transition-colors", view === "list" ? "bg-[#06B6D4] text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50")}
              >
                <LayoutList className="size-3.5" />
              </button>
              <button
                onClick={() => setView("map")}
                disabled={!mapboxToken}
                className={cn("p-2 transition-colors", view === "map" ? "bg-[#06B6D4] text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50", !mapboxToken && "opacity-40 cursor-not-allowed")}
              >
                <MapIcon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Loading skeletons */}
          {isFetching && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* Map view */}
          {!isFetching && view === "map" && mapboxToken && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[520px]">
              <ClinicMap clinics={clinics} center={location ?? undefined} mapboxToken={mapboxToken} />
            </div>
          )}

          {/* List view */}
          {!isFetching && view === "list" && (
            clinics.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-4xl mb-3">🏥</p>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No clinics found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try expanding your search radius or removing some filters.
                </p>
                <button
                  onClick={() => patchFilters({ radius: 200, isFree: false, isSliding: false, language: "", service: "" })}
                  className="mt-4 px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-sm font-bold hover:bg-[#0E7490] transition-colors"
                >
                  Expand search radius
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {clinics.map((c) => <ClinicCard key={c.id} clinic={c} />)}
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile filter overlay */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
          <div className="relative w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 p-6">
            <FilterPanel filters={filters} onChange={patchFilters} onClose={() => setMobileFilter(false)} />
            <button
              onClick={() => setMobileFilter(false)}
              className="mt-4 w-full py-3 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#0E7490] transition-colors"
            >
              Show {clinics.length} result{clinics.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
