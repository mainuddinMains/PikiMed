"use client"

import { useEffect, useRef } from "react"

interface Hospital {
  id:        string
  name:      string
  type:      string
  city:      string | null
  state:     string | null
  lat:       number | null
  lng:       number | null
  inNetwork: boolean
}

interface Props {
  hospitals:   Hospital[]
  center?:     { lat: number; lng: number }
  mapboxToken: string
}

export default function HospitalMap({ hospitals, center, mapboxToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let map: mapboxgl.Map

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default
      // CSS loaded globally in layout

      mapboxgl.accessToken = mapboxToken

      const withCoords = hospitals.filter((h) => h.lat != null && h.lng != null)

      const defaultCenter: [number, number] =
        center ? [center.lng, center.lat] : [-98.5, 39.5]

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style:     "mapbox://styles/mapbox/light-v11",
        center:    defaultCenter,
        zoom:      center ? 9 : 4,
      })

      map.addControl(new mapboxgl.NavigationControl(), "top-right")

      map.on("load", () => {
        // User location marker
        if (center) {
          new mapboxgl.Marker({ color: "#6366F1" })
            .setLngLat([center.lng, center.lat])
            .setPopup(new mapboxgl.Popup().setHTML("<p class='text-xs font-semibold'>Your location</p>"))
            .addTo(map)
        }

        // Hospital markers
        const bounds = new mapboxgl.LngLatBounds()

        withCoords.forEach((h) => {
          const color = h.inNetwork ? "#22C55E" : "#F43F5E"
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="font-family:sans-serif;font-size:12px;max-width:180px">
              <p style="font-weight:700;margin:0 0 2px">${h.name}</p>
              <p style="color:#6b7280;margin:0">${[h.city, h.state].filter(Boolean).join(", ")}</p>
              <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${h.inNetwork ? "#dcfce7" : "#ffe4e6"};color:${h.inNetwork ? "#16a34a" : "#e11d48"}">
                ${h.inNetwork ? "In-Network" : "Out-of-Network"}
              </span>
            </div>`,
          )

          new mapboxgl.Marker({ color })
            .setLngLat([h.lng!, h.lat!])
            .setPopup(popup)
            .addTo(map)

          bounds.extend([h.lng!, h.lat!])
        })

        if (withCoords.length > 1 && !center) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 10 })
        }
      })
    }

    init()

    return () => { map?.remove() }
  }, [hospitals, center, mapboxToken])

  return <div ref={containerRef} className="w-full h-full" />
}
