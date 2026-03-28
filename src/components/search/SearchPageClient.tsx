"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useInfiniteQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { Search, X } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { useHydratedRegion } from "@/lib/region"
import { haversineKm } from "@/components/home/types"
import FilterSidebar, { DEFAULT_FILTERS, type Filters } from "./FilterSidebar"
import SortBar, { type SortOption, type ViewMode } from "./SortBar"
import ResultCard from "./ResultCard"
import type { SearchResponse, SearchItem } from "@/app/api/search/route"

const MapView = dynamic(() => import("./MapView"), { ssr: false })

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function fetchSearch(params: {
  q:         string
  region:    string
  filters:   Filters
  sort:      SortOption
  page:      number
}): Promise<SearchResponse> {
  const sp = new URLSearchParams({
    region:    params.region,
    q:         params.q,
    sort:      params.sort,
    type:      params.filters.type === "all" ? "" : params.filters.type,
    specialty: params.filters.specialty,
    city:      params.filters.city,
    minRating: String(params.filters.minRating),
    maxFee:    String(params.filters.maxFee),
    available: String(params.filters.available),
    page:      String(params.page),
  })
  let res: Response
  try {
    res = await fetch(`/api/search?${sp}`)
  } catch {
    toast.error("Connection issue — please check your internet")
    throw new Error("Network error")
  }
  if (!res.ok) throw new Error("Search failed")
  return res.json()
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SearchPageClientProps {
  mapboxToken: string
}

export default function SearchPageClient({ mapboxToken }: SearchPageClientProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { region, hydrated } = useHydratedRegion()

  // ── State from URL ──────────────────────────────────────────────────────────

  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "")
  const [query,      setQuery]      = useState(searchParams.get("q") ?? "")
  const [sort,       setSort]       = useState<SortOption>(
    (searchParams.get("sort") as SortOption) ?? "relevance",
  )
  const [view,   setView]   = useState<ViewMode>("list")
  const [filters, setFilters] = useState<Filters>({
    type:      (searchParams.get("type") as Filters["type"]) ?? "all",
    specialty: searchParams.get("specialty") ?? "",
    city:      searchParams.get("city") ?? "",
    minRating: parseFloat(searchParams.get("minRating") ?? "0") || 0,
    maxFee:    parseFloat(searchParams.get("maxFee") ?? "0") || 0,
    available: searchParams.get("available") === "true",
  })

  // ── Geolocation ─────────────────────────────────────────────────────────────

  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {},
      { timeout: 8000 },
    )
  }, [])

  // ── Mobile filter drawer ────────────────────────────────────────────────────

  const [filterOpen, setFilterOpen] = useState(false)

  // ── 300ms debounce: inputValue → query + URL ────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(inputValue)
      const sp = new URLSearchParams(searchParams.toString())
      inputValue ? sp.set("q", inputValue) : sp.delete("q")
      router.replace(`/search?${sp.toString()}`, { scroll: false })
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync filters + sort → URL ───────────────────────────────────────────────

  const syncUrl = useCallback(
    (newFilters: Filters, newSort: SortOption) => {
      const sp = new URLSearchParams()
      if (query)                 sp.set("q",         query)
      if (newSort !== "relevance") sp.set("sort",    newSort)
      if (newFilters.type !== "all") sp.set("type",  newFilters.type)
      if (newFilters.specialty)    sp.set("specialty", newFilters.specialty)
      if (newFilters.city)         sp.set("city",      newFilters.city)
      if (newFilters.minRating > 0) sp.set("minRating", String(newFilters.minRating))
      if (newFilters.maxFee > 0)    sp.set("maxFee",    String(newFilters.maxFee))
      if (newFilters.available)     sp.set("available", "true")
      router.replace(`/search?${sp.toString()}`, { scroll: false })
    },
    [query, router],
  )

  function handleFilterChange(f: Filters) {
    setFilters(f)
    syncUrl(f, sort)
  }

  function handleSortChange(s: SortOption) {
    setSort(s)
    syncUrl(filters, s)
  }

  // ── Infinite query ──────────────────────────────────────────────────────────

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["search", region, query, filters, sort],
    queryFn: ({ pageParam }) =>
      fetchSearch({
        q:       query,
        region:  region ?? "BD",
        filters,
        sort,
        page:    pageParam as number,
      }),
    initialPageParam:  1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled: hydrated && !!region,
  })

  const allItems: SearchItem[] = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0

  // ── Distance sort (client-side when sort=distance) ──────────────────────────

  const sortedItems = sort === "distance" && userLat != null && userLng != null
    ? [...allItems].sort((a, b) => {
        const dA = a.lat != null && a.lng != null ? haversineKm(userLat, userLng, a.lat, a.lng) : Infinity
        const dB = b.lat != null && b.lng != null ? haversineKm(userLat, userLng, b.lat, b.lng) : Infinity
        return dA - dB
      })
    : allItems

  // ── Infinite scroll sentinel ────────────────────────────────────────────────

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!hydrated) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Search header ────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                region === "BD"
                  ? "Search doctors, specialties, hospitals…"
                  : "Doctors, hospitals, specialties…"
              }
              className={cn(
                "w-full pl-11 pr-10 py-3 rounded-2xl text-sm",
                "bg-slate-100 dark:bg-slate-800",
                "border border-transparent focus:border-[#06B6D4] focus:bg-white dark:focus:bg-slate-900",
                "text-slate-800 dark:text-slate-100 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/30 transition-all",
              )}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-5">
        <SortBar
          sort={sort}
          view={view}
          total={total}
          loading={isFetching && !isFetchingNextPage}
          hasLocation={userLat != null}
          onSortChange={handleSortChange}
          onViewChange={setView}
          onFilterClick={() => setFilterOpen(true)}
          className="mb-5"
        />

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-36 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
              <FilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                region={region}
              />
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {view === "map" ? (
              <div className="h-[50vh] sm:h-[70vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <MapView
                  items={sortedItems}
                  mapboxToken={mapboxToken}
                  userLat={userLat}
                  userLng={userLng}
                  region={region}
                />
              </div>
            ) : (
              <>
                {/* Empty state */}
                {!isFetching && sortedItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true" className="mb-4">
                      <circle cx="60" cy="50" r="38" fill="#06B6D4" fillOpacity="0.07" />
                      <circle cx="54" cy="44" r="18" fill="white" stroke="#E2E8F0" strokeWidth="2" />
                      <circle cx="54" cy="44" r="10" fill="#F1F5F9" />
                      <line x1="67" y1="57" x2="80" y2="70" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
                      <line x1="80" y1="70" x2="88" y2="62" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                      No results found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try adjusting your filters or searching for something else.
                    </p>
                  </div>
                )}

                {/* Results list */}
                <div className="space-y-3">
                  {sortedItems.map((item) => {
                    const dist =
                      userLat != null && userLng != null && item.lat != null && item.lng != null
                        ? haversineKm(userLat, userLng, item.lat, item.lng)
                        : undefined
                    return (
                      <ResultCard
                        key={`${item.itemType}-${item.id}`}
                        item={item}
                        distanceKm={dist}
                      />
                    )
                  })}
                </div>

                {/* Skeleton loaders */}
                {(isFetching || isFetchingNextPage) && (
                  <div className="space-y-3 mt-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                      />
                    ))}
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-4" />

                {/* End of results */}
                {!hasNextPage && sortedItems.length > 0 && !isFetching && (
                  <p className="py-6 text-center text-xs text-slate-400">
                    All {total.toLocaleString()} results loaded
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter overlay ─────────────────────────────────────────────── */}
      {filterOpen && (
        <>
          <div
            aria-hidden
            onClick={() => setFilterOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className={cn(
              "fixed bottom-0 inset-x-0 z-50 lg:hidden",
              "bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl",
              "p-6 max-h-[85vh] overflow-y-auto",
            )}
          >
            <FilterSidebar
              filters={filters}
              onChange={(f) => { handleFilterChange(f); setFilterOpen(false) }}
              region={region}
              onClose={() => setFilterOpen(false)}
            />
          </aside>
        </>
      )}
    </div>
  )
}
