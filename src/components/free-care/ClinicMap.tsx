"use client"

import { useEffect, useRef } from "react"

interface Clinic {
  id:        string
  name:      string
  address:   string | null
  city:      string
  state:     string
  phone:     string | null
  lat:       number | null
  lng:       number | null
  isFree:    boolean
  isSliding: boolean
}

interface Props {
  clinics:     Clinic[]
  center?:     { lat: number; lng: number }
  mapboxToken: string
}

export default function ClinicMap({ clinics, center, mapboxToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let map: mapboxgl.Map

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default
      mapboxgl.accessToken = mapboxToken

      const withCoords = clinics.filter((c) => c.lat != null && c.lng != null)
      const defaultCenter: [number, number] = center ? [center.lng, center.lat] : [-98.5, 39.5]

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style:     "mapbox://styles/mapbox/light-v11",
        center:    defaultCenter,
        zoom:      center ? 10 : 4,
      })

      map.addControl(new mapboxgl.NavigationControl(), "top-right")

      map.on("load", () => {
        if (center) {
          new mapboxgl.Marker({ color: "#6366F1" })
            .setLngLat([center.lng, center.lat])
            .setPopup(new mapboxgl.Popup().setHTML("<p style='font-size:11px;font-weight:700'>Your location</p>"))
            .addTo(map)
        }

        const bounds = new mapboxgl.LngLatBounds()

        withCoords.forEach((c) => {
          const color    = c.isFree ? "#22C55E" : c.isSliding ? "#3B82F6" : "#06B6D4"
          const badge    = c.isFree ? "Free" : c.isSliding ? "Sliding Scale" : "FQHC"
          const fullAddr = [c.address, c.city, c.state].filter(Boolean).join(", ")

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="font-family:sans-serif;font-size:12px;max-width:200px">
              <p style="font-weight:700;margin:0 0 2px">${c.name}</p>
              <p style="color:#6b7280;margin:0 0 4px">${fullAddr}</p>
              <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${c.isFree ? "#dcfce7" : c.isSliding ? "#dbeafe" : "#cffafe"};color:${c.isFree ? "#16a34a" : c.isSliding ? "#1d4ed8" : "#0e7490"}">
                ${badge}
              </span>
              ${c.phone ? `<p style="margin:6px 0 0;font-size:11px"><a href="tel:${c.phone}" style="color:#06B6D4;font-weight:600">${c.phone}</a></p>` : ""}
            </div>`,
          )

          new mapboxgl.Marker({ color })
            .setLngLat([c.lng!, c.lat!])
            .setPopup(popup)
            .addTo(map)

          bounds.extend([c.lng!, c.lat!])
        })

        if (withCoords.length > 1) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 12 })
        }
      })
    }

    init()
    return () => { map?.remove() }
  }, [clinics, center, mapboxToken])

  return <div ref={containerRef} className="w-full h-full" />
}
