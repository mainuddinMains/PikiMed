"use client"

import { useEffect, useRef } from "react"
import { ExternalLink } from "lucide-react"

interface MiniMapProps {
  lat:         number
  lng:         number
  label:       string
  mapboxToken: string
}

export default function MiniMap({ lat, lng, label, mapboxToken }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !mapboxToken) return

    let map: import("mapbox-gl").Map | null = null

    async function init() {
      const mapboxgl = await import("mapbox-gl")
      await import("mapbox-gl/dist/mapbox-gl.css" as string)

      mapboxgl.default.accessToken = mapboxToken

      map = new mapboxgl.default.Map({
        container: containerRef.current!,
        style:     "mapbox://styles/mapbox/light-v11",
        center:    [lng, lat],
        zoom:      14,
        interactive: true,
      })

      map.addControl(new mapboxgl.default.NavigationControl(), "top-right")

      new mapboxgl.default.Marker({ color: "#06B6D4" })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.default.Popup({ offset: 25 })
            .setText(label),
        )
        .addTo(map)
    }

    init().catch(console.error)

    return () => { map?.remove() }
  }, [lat, lng, label, mapboxToken])

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700" />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#06B6D4] hover:text-[#0E7490] transition-colors"
      >
        <ExternalLink className="size-3.5" />
        Get directions
      </a>
    </div>
  )
}
