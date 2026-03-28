"use client"

import Link from "next/link"
import { Star, Clock, Phone, MapPin, Navigation, BadgeCheck, Stethoscope, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { isCurrentlyOpen } from "@/components/home/types"
import type { SearchItem } from "@/app/api/search/route"
import SaveButton from "@/components/SaveButton"

const HOSPITAL_TYPE_LABEL = {
  GOVERNMENT:  "Govt.",
  PRIVATE:     "Private",
  DIAGNOSTIC:  "Diagnostic",
  FQHC:        "FQHC",
} as const

const HOSPITAL_TYPE_COLOR = {
  GOVERNMENT:  "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  PRIVATE:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DIAGNOSTIC:  "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  FQHC:        "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
} as const

interface ResultCardProps {
  item:          SearchItem
  distanceKm?:   number
  inNetwork?:    boolean   // US: insurance match
  savedIds?:     Set<string>   // pre-fetched saved entity IDs
}

export default function ResultCard({ item, distanceKm, inNetwork, savedIds }: ResultCardProps) {
  const isSaved = savedIds?.has(item.id) ?? false
  if (item.itemType === "doctor") return <DoctorCard item={item} distanceKm={distanceKm} inNetwork={inNetwork} initialSaved={isSaved} />
  return <HospitalCard item={item} distanceKm={distanceKm} initialSaved={isSaved} />
}

// ── Doctor card ───────────────────────────────────────────────────────────────

function DoctorCard({ item, distanceKm, inNetwork, initialSaved = false }: ResultCardProps & { item: Extract<SearchItem, { itemType: "doctor" }>; initialSaved?: boolean }) {
  const initials = item.name.split(" ").slice(0, 2).map((n) => n[0]).join("")

  const feeLabel =
    item.consultFeeMin != null
      ? item.currency === "BDT"
        ? `৳${item.consultFeeMin}${item.consultFeeMax ? `–${item.consultFeeMax}` : "+"}`
        : `$${item.consultFeeMin}${item.consultFeeMax ? `–${item.consultFeeMax}` : "+"}`
      : null

  return (
    <Link
      href={`/doctors/${item.slug}`}
      className={cn(
        "group flex gap-4 rounded-2xl border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-900 p-4",
        "hover:shadow-md hover:border-[#06B6D4]/40 transition-all duration-150",
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 flex size-12 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] font-bold text-sm">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug truncate group-hover:text-[#06B6D4] transition-colors">
              {item.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.specialty}</p>
          </div>

          {/* Badges + Save */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {item.isAvailableToday && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                Today
              </span>
            )}
            {inNetwork && (
              <span className="flex items-center gap-1 text-xs bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-0.5 rounded-full font-medium">
                <BadgeCheck className="size-3" />
                In-Network
              </span>
            )}
            <SaveButton doctorId={item.id} initialSaved={initialSaved} size="sm" />
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" />
            {item.city}{item.district ? `, ${item.district}` : ""}
          </span>

          {item.avgRating != null && (
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{item.avgRating.toFixed(1)}</span>
              <span className="text-slate-400">({item.reviewCount})</span>
            </span>
          )}

          {item.avgWaitMinutes != null && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="size-3" />
              ~{item.avgWaitMinutes} min
            </span>
          )}

          {distanceKm != null && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Navigation className="size-3" />
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
            </span>
          )}

          {feeLabel && (
            <span className="text-xs font-semibold text-[#06B6D4]">{feeLabel}</span>
          )}
        </div>

        {/* BMDC / NPI badge */}
        {(item.bmdc || item.npi) && (
          <p className="mt-1.5 text-xs text-slate-400">
            {item.bmdc ? `BMDC: ${item.bmdc}` : `NPI: ${item.npi}`}
          </p>
        )}
      </div>

      {/* Phone — stop propagation so the tel: link works */}
      {item.phone && (
        <a
          href={`tel:${item.phone}`}
          onClick={(e) => e.preventDefault()}
          className="hidden sm:flex flex-shrink-0 items-center gap-1 self-center text-xs text-slate-400 hover:text-[#06B6D4] transition-colors"
        >
          <Phone className="size-3.5" />
          {item.phone}
        </a>
      )}
    </Link>
  )
}

// ── Hospital card ─────────────────────────────────────────────────────────────

function HospitalCard({ item, distanceKm, initialSaved = false }: ResultCardProps & { item: Extract<SearchItem, { itemType: "hospital" }>; initialSaved?: boolean }) {
  const open = isCurrentlyOpen(item.isOpen24h, item.openTime, item.closeTime)

  return (
    <Link
      href={`/hospitals/${item.slug}`}
      className={cn(
        "group flex gap-4 rounded-2xl border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-900 p-4",
        "hover:shadow-md hover:border-[#06B6D4]/40 transition-all duration-150",
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Building2 className="size-5 text-slate-500" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug truncate group-hover:text-[#06B6D4] transition-colors">
            {item.name}
          </h3>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                open
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {item.isOpen24h ? "24h" : open ? "Open" : "Closed"}
            </span>
            <SaveButton hospitalId={item.id} initialSaved={initialSaved} size="sm" />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", HOSPITAL_TYPE_COLOR[item.type])}>
            {HOSPITAL_TYPE_LABEL[item.type]}
          </span>

          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" />
            {item.city}
          </span>

          {item.avgRating != null && (
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{item.avgRating.toFixed(1)}</span>
              <span className="text-slate-400">({item.reviewCount})</span>
            </span>
          )}

          {distanceKm != null && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Navigation className="size-3" />
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
            </span>
          )}
        </div>

        {item.address && (
          <p className="mt-1 text-xs text-slate-400 truncate">{item.address}</p>
        )}
      </div>
    </Link>
  )
}
