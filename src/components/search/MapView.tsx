"use client"

import { useEffect, useRef } from "react"
import type { SearchItem } from "@/app/api/search/route"

interface MapViewProps {
  items:        SearchItem[]
  mapboxToken:  string
  userLat?:     number | null
  userLng?:     number | null
  region:       "BD" | "US" | null
}

const DEFAULT_CENTER: Record<string, [number, number]> = {
  BD: [90.4125, 23.8103],  // Dhaka
  US: [-98.35,  39.5],     // Continental US
}

export default function MapView({ items, mapboxToken, userLat, userLng, region }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || !mapboxToken) return

    let mapboxgl: typeof import("mapbox-gl")

    async function init() {
      mapboxgl = await import("mapbox-gl")
      await import("mapbox-gl/dist/mapbox-gl.css" as string)

      mapboxgl.default.accessToken = mapboxToken

      const center = userLat != null && userLng != null
        ? [userLng, userLat] as [number, number]
        : DEFAULT_CENTER[region ?? "BD"] ?? DEFAULT_CENTER.BD

      const map = new mapboxgl.default.Map({
        container: containerRef.current!,
        style:     "mapbox://styles/mapbox/light-v11",
        center,
        zoom:      region === "US" ? 4 : 11,
      })

      mapRef.current = map

      map.addControl(new mapboxgl.default.NavigationControl(), "top-right")

      // User location marker
      if (userLat != null && userLng != null) {
        new mapboxgl.default.Marker({ color: "#06B6D4" })
          .setLngLat([userLng, userLat])
          .setPopup(new mapboxgl.default.Popup({ offset: 25 }).setText("Your location"))
          .addTo(map)
      }
    }

    init().catch(console.error)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapboxToken, region]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when items change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    async function addMarkers() {
      const mapboxgl = await import("mapbox-gl")

      // Remove old markers by class
      containerRef.current
        ?.querySelectorAll(".pikimed-marker")
        .forEach((el) => el.remove())

      const bounds = new mapboxgl.default.LngLatBounds()
      let hasBounds = false

      items.forEach((item) => {
        if (item.lat == null || item.lng == null) return

        const color = item.itemType === "doctor" ? "#06B6D4" : "#1D9E75"

        const subLabel = item.itemType === "doctor"
          ? (item as Extract<typeof item, { itemType: "doctor" }>).specialty
          : (item as Extract<typeof item, { itemType: "hospital" }>).type

        new mapboxgl.default.Marker({ color })
          .setLngLat([item.lng, item.lat])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25, maxWidth: "220px" })
              .setHTML(
                `<div style="font-family:system-ui;font-size:13px;line-height:1.4">` +
                `<strong style="color:${color}">${item.name}</strong><br/>` +
                `<span style="color:#64748b">${subLabel}</span><br/>` +
                `<span style="color:#94a3b8">${item.city}</span></div>`,
              ),
          )
          .addTo(map!)

        bounds.extend([item.lng, item.lat])
        hasBounds = true
      })

      if (hasBounds && items.length > 1) {
        map!.fitBounds(bounds, { padding: 60, maxZoom: 14 })
      }
    }

    addMarkers().catch(console.error)
  }, [items])

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <p className="text-sm text-slate-500">Map unavailable — MAPBOX_TOKEN not set.</p>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />
}
