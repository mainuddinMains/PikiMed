"use client"

import { useState } from "react"
import {
  ChevronDown, ChevronUp, Phone, MapPin, Star,
  Clock, Navigation, Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hospital } from "./types"
import { isCurrentlyOpen } from "./types"

const TYPE_LABEL: Record<Hospital["type"], string> = {
  GOVERNMENT:  "Govt.",
  PRIVATE:     "Private",
  DIAGNOSTIC:  "Diagnostic",
  FQHC:        "FQHC",
}

const TYPE_COLOR: Record<Hospital["type"], string> = {
  GOVERNMENT:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PRIVATE:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DIAGNOSTIC:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  FQHC:        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

interface HospitalCardProps {
  hospital: Hospital
  distanceKm?: number
}

export default function HospitalCard({ hospital, distanceKm }: HospitalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const open = isCurrentlyOpen(hospital.isOpen24h, hospital.openTime, hospital.closeTime)

  const directionsUrl = hospital.lat && hospital.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`
    : hospital.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`
      : null

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden transition-shadow hover:shadow-md">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-5 text-left"
        aria-expanded={expanded}
      >
        {/* Icon */}
        <span className="flex-shrink-0 flex size-10 items-center justify-center rounded-xl bg-[#06B6D4]/10">
          <Stethoscope className="size-5 text-[#06B6D4]" />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {hospital.name}
            </h3>
            {expanded ? (
              <ChevronUp className="size-4 text-slate-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="size-4 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TYPE_COLOR[hospital.type])}>
              {TYPE_LABEL[hospital.type]}
            </span>

            {/* Open / Closed */}
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                open
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {hospital.isOpen24h ? "Open 24h" : open ? "Open now" : "Closed"}
            </span>

            {/* Distance */}
            {distanceKm != null && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="size-3" />
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 pt-4 space-y-3">
          {hospital.address && (
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="size-4 flex-shrink-0 text-slate-400 mt-0.5" />
              <span>{hospital.address}</span>
            </div>
          )}

          {(hospital.phone || hospital.emergencyPhone) && (
            <div className="flex flex-wrap gap-3">
              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone}`}
                  className="flex items-center gap-1.5 text-sm text-[#06B6D4] hover:underline"
                >
                  <Phone className="size-3.5" />
                  {hospital.phone}
                </a>
              )}
              {hospital.emergencyPhone && (
                <a
                  href={`tel:${hospital.emergencyPhone}`}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:underline font-medium"
                >
                  <Phone className="size-3.5" />
                  Emergency: {hospital.emergencyPhone}
                </a>
              )}
            </div>
          )}

          {!hospital.isOpen24h && hospital.openTime && hospital.closeTime && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="size-4" />
              <span>{hospital.openTime} – {hospital.closeTime}</span>
            </div>
          )}

          {hospital.avgRating != null && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{hospital.avgRating.toFixed(1)}</span>
              <span className="text-slate-400">({hospital.reviewCount} reviews)</span>
            </div>
          )}

          {hospital.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hospital.specialties.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-0.5"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-1 text-sm font-semibold text-white bg-[#06B6D4] hover:bg-[#0E7490] px-4 py-2 rounded-xl transition-colors"
            >
              <Navigation className="size-4" />
              Get Directions
            </a>
          )}
        </div>
      )}
    </div>
  )
}
