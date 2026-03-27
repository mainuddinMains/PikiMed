"use client"

import { useEffect, useRef, useCallback } from "react"
import { ExternalLink, MapPin } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MapHospital {
  id:   string
  name: string
  slug: string
  type: string
  city: string
  lat:  number | null
  lng:  number | null
}

interface Props {
  hospitals:    MapHospital[]
  userLocation: { lat: number; lng: number } | null
  mapboxToken:  string
  selectedId:   string | null
  onSelect:     (id: string) => void
}

// ── Build GeoJSON route lines user → each hospital ─────────────────────────────

function buildRoutes(
  userLat: number,
  userLng: number,
  hospitals: MapHospital[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = hospitals
    .filter((h) => h.lat != null && h.lng != null)
    .map((h) => ({
      type:       "Feature",
      properties: { id: h.id },
      geometry:   {
        type:        "LineString",
        coordinates: [
          [userLng, userLat],
          [h.lng!, h.lat!],
        ],
      },
    }))
  return { type: "FeatureCollection", features }
}

// ── Custom marker HTML ─────────────────────────────────────────────────────────

function hospitalMarkerHTML(selected: boolean): string {
  const bg = selected ? "#06B6D4" : "#EF4444"
  return `
    <div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${bg};border:2px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      transform:rotate(-45deg);
      transition:background .2s;
    ">
      <span style="transform:rotate(45deg);color:white;font-weight:900;font-size:16px;line-height:1">+</span>
    </div>
  `
}

function userMarkerHTML(): string {
  return `
    <div style="position:relative;width:20px;height:20px">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:#3B82F6;opacity:.3;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;
      "></div>
      <div style="
        position:absolute;inset:3px;border-radius:50%;
        background:#3B82F6;border:2px solid white;
        box-shadow:0 0 0 2px #3B82F6;
      "></div>
    </div>
    <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
  `
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NearbyHospitalsMap({
  hospitals,
  userLocation,
  mapboxToken,
  selectedId,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const markersRef   = useRef<Map<string, mapboxgl.Marker>>(new Map())

  const googleMapsUrl = userLocation
    ? `https://www.google.com/maps/search/hospitals/@${userLocation.lat},${userLocation.lng},14z`
    : "https://www.google.com/maps/search/hospitals+near+me"

  // ── Init map ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return

    let map: mapboxgl.Map

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default
      mapboxgl.accessToken = mapboxToken

      const withCoords = hospitals.filter((h) => h.lat != null && h.lng != null)

      const center: [number, number] = userLocation
        ? [userLocation.lng, userLocation.lat]
        : withCoords.length > 0
        ? [withCoords[0].lng!, withCoords[0].lat!]
        : [90.4125, 23.8103]  // Dhaka default

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style:     "mapbox://styles/mapbox/light-v11",
        center,
        zoom:      12,
      })
      mapRef.current = map

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")

      map.on("load", () => {
        // ── Route lines (dashed) ──────────────────────────────────────────
        if (userLocation && withCoords.length > 0) {
          const routes = buildRoutes(userLocation.lat, userLocation.lng, withCoords)
          map.addSource("routes", { type: "geojson", data: routes })
          map.addLayer({
            id:     "routes",
            type:   "line",
            source: "routes",
            layout: { "line-join": "round", "line-cap": "round" },
            paint:  {
              "line-color":       "#06B6D4",
              "line-width":       1.5,
              "line-dasharray":   [4, 4],
              "line-opacity":     0.6,
            },
          })
        }

        // ── User location pin ─────────────────────────────────────────────
        if (userLocation) {
          const el = document.createElement("div")
          el.innerHTML = userMarkerHTML()
          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([userLocation.lng, userLocation.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 14 }).setHTML(
                "<p style='font-size:12px;font-weight:700;margin:0'>📍 Your location</p>",
              ),
            )
            .addTo(map)
        }

        // ── Hospital pins ─────────────────────────────────────────────────
        withCoords.forEach((h) => {
          const el = document.createElement("div")
          el.innerHTML = hospitalMarkerHTML(h.id === selectedId)

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom-left" })
            .setLngLat([h.lng!, h.lat!])
            .setPopup(
              new mapboxgl.Popup({ offset: [8, -8] }).setHTML(
                `<div style="font-family:sans-serif;font-size:12px;max-width:160px">
                  <p style="font-weight:700;margin:0 0 2px">${h.name}</p>
                  <p style="color:#6b7280;margin:0">${h.type} · ${h.city}</p>
                  <a href="/hospital/${h.slug}" style="color:#06B6D4;font-weight:600;font-size:11px">View details →</a>
                </div>`,
              ),
            )
            .addTo(map)

          el.addEventListener("click", () => onSelect(h.id))
          markersRef.current.set(h.id, marker)
        })

        // Fit to all pins
        if (withCoords.length > 0) {
          const bounds = new mapboxgl.LngLatBounds()
          if (userLocation) bounds.extend([userLocation.lng, userLocation.lat])
          withCoords.forEach((h) => bounds.extend([h.lng!, h.lat!]))
          map.fitBounds(bounds, { padding: 60, maxZoom: 14 })
        }
      })
    }

    init()
    return () => {
      markersRef.current.clear()
      map?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitals, userLocation, mapboxToken])

  // ── Update marker colours when selectedId changes ───────────────────────────

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      if (!el) return
      const inner = el.querySelector("div") as HTMLElement | null
      if (!inner) return
      inner.style.background = id === selectedId ? "#06B6D4" : "#EF4444"
    })

    // Fly to selected
    if (selectedId) {
      const h = hospitals.find((x) => x.id === selectedId)
      if (h?.lat && h?.lng && mapRef.current) {
        mapRef.current.flyTo({ center: [h.lng, h.lat], zoom: 14, duration: 800 })
        markersRef.current.get(selectedId)?.togglePopup()
      }
    }
  }, [selectedId, hospitals])

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />

      {/* Fallback when no location */}
      {!userLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm rounded-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5 text-center max-w-xs">
            <MapPin className="size-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Location not available</p>
            <p className="text-xs text-slate-400">
              Enable location access to see hospitals near you on the map.
            </p>
          </div>
        </div>
      )}

      {/* Open in Google Maps */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 shadow-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
      >
        <ExternalLink className="size-3.5" />
        Open in Google Maps
      </a>
    </div>
  )
}
