"use client"

import { useQuery } from "@tanstack/react-query"
import { Star, Clock, Phone } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DoctorCardSkeleton } from "./Skeletons"
import type { Doctor } from "./types"
import type { Region } from "@/store/regionStore"

async function fetchDoctors(region: string): Promise<Doctor[]> {
  const res = await fetch(`/api/doctors?region=${region}`)
  if (!res.ok) throw new Error("Failed to fetch doctors")
  return res.json()
}

interface DoctorCardProps {
  doctor: Doctor
}

function DoctorCard({ doctor }: DoctorCardProps) {
  const feeLabel =
    doctor.consultFeeMin != null
      ? doctor.currency === "BDT"
        ? `৳${doctor.consultFeeMin}${doctor.consultFeeMax ? `–${doctor.consultFeeMax}` : ""}`
        : `$${doctor.consultFeeMin}${doctor.consultFeeMax ? `–${doctor.consultFeeMax}` : ""}`
      : null

  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      className={cn(
        "flex-shrink-0 w-52 rounded-2xl border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-900 p-4 space-y-2",
        "hover:shadow-md hover:border-[#06B6D4]/40 transition-all duration-150",
      )}
    >
      {/* Avatar initials */}
      <div className="flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#06B6D4]/10 text-[#06B6D4] font-bold text-sm">
          {doctor.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </div>
        {doctor.isAvailableToday && (
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
            Today
          </span>
        )}
      </div>

      <div>
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">
          {doctor.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
          {doctor.specialty}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{doctor.city}</p>
      </div>

      <div className="space-y-1">
        {doctor.avgRating != null && (
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-medium">{doctor.avgRating.toFixed(1)}</span>
            <span className="text-slate-400">({doctor.reviewCount})</span>
          </div>
        )}
        {doctor.avgWaitMinutes != null && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="size-3" />
            ~{doctor.avgWaitMinutes} min wait
          </div>
        )}
        {feeLabel && (
          <p className="text-xs font-semibold text-[#06B6D4]">{feeLabel}</p>
        )}
      </div>

      {doctor.phone && (
        <a
          href={`tel:${doctor.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#06B6D4] transition-colors"
        >
          <Phone className="size-3" />
          {doctor.phone}
        </a>
      )}
    </Link>
  )
}

interface DoctorRowProps {
  region: Region
  inNetworkOnly?: boolean
}

export default function DoctorRow({ region, inNetworkOnly = false }: DoctorRowProps) {
  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors", region],
    queryFn: () => fetchDoctors(region!),
    enabled: !!region,
  })

  return (
    <div>
      <div className="flex overflow-x-auto gap-3 pb-3 -mx-1 px-1 scrollbar-hide">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <DoctorCardSkeleton key={i} />)}

        {!isLoading && doctors?.length === 0 && (
          <p className="text-sm text-slate-400 py-4">No doctors found for your region yet.</p>
        )}

        {!isLoading &&
          doctors?.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
      </div>
    </div>
  )
}
