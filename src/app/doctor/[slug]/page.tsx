import { notFound } from "next/navigation"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Phone, Mail, Globe, Clock, Calendar, BadgeCheck,
  MapPin, Stethoscope, AlertCircle,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import StarRating from "@/components/detail/StarRating"
import ReviewsWidget from "@/components/ReviewsWidget"

const MiniMap = dynamic(() => import("@/components/detail/MiniMap"), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────────

type ChamberSlot = {
  start?:   string
  end?:     string
  morning?: { start: string; end: string }
  evening?: { start: string; end: string }
  maxPatients?: number
}

type ChamberSchedule = Record<string, ChamberSlot>

function parseChamberSchedule(val: unknown): ChamberSchedule {
  if (!val || typeof val !== "object" || Array.isArray(val)) return {}
  return val as ChamberSchedule
}

// ── Static params + metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const doctors = await prisma.doctor.findMany({ select: { slug: true } })
    return doctors.map(({ slug }) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const doc = await prisma.doctor.findUnique({
    where:  { slug: params.slug },
    select: { name: true, specialty: true, city: true, bio: true },
  })
  if (!doc) return { title: "Doctor Not Found" }

  const description =
    doc.bio?.slice(0, 155) ??
    `Find ${doc.name}, ${doc.specialty} in ${doc.city}. Book an appointment on PikiMed.`

  return {
    title: `${doc.name} — ${doc.specialty}`,
    description,
    openGraph: {
      title:       `${doc.name} | PikiMed`,
      description: `${doc.specialty} in ${doc.city}`,
      type:        "profile",
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_ORDER = ["saturday","sunday","monday","tuesday","wednesday","thursday","friday"]

function fmtTime(t: string | undefined) {
  if (!t) return "—"
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12  = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`
}

function fmtFee(min: number | null, max: number | null, currency: string) {
  if (min == null) return "—"
  const sym = currency === "BDT" ? "৳" : "$"
  return max ? `${sym}${min.toLocaleString()}–${max.toLocaleString()}` : `${sym}${min.toLocaleString()}+`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DoctorPage({ params }: { params: { slug: string } }) {
  const doctor = await prisma.doctor.findUnique({
    where:   { slug: params.slug },
    include: {
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take:    20,
      },
    },
  })

  if (!doctor) notFound()

  const isBD      = doctor.region === "BD"
  const initials  = doctor.name.split(" ").slice(0, 2).map((n) => n[0]).join("")
  const chambers  = parseChamberSchedule(doctor.chamberSchedule)
  const feeLabel  = fmtFee(doctor.consultFeeMin, doctor.consultFeeMax, doctor.currency)
  const mapToken  = process.env.MAPBOX_TOKEN ?? ""

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hero header ────────────────────────────────────────────────────────── */}
      <div className={cn(
        "bg-gradient-to-br px-4 pt-10 pb-8",
        isBD
          ? "from-[#06B6D4]/10 via-white to-[#1D9E75]/5 dark:from-[#06B6D4]/8 dark:via-slate-900 dark:to-slate-900"
          : "from-[#1D9E75]/10 via-white to-[#06B6D4]/5 dark:from-[#1D9E75]/8 dark:via-slate-900 dark:to-slate-900",
      )}>
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-[#06B6D4] transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/search?type=doctor" className="hover:text-[#06B6D4] transition-colors">Doctors</Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-600 dark:text-slate-300">{doctor.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className={cn(
              "flex-shrink-0 flex size-20 items-center justify-center rounded-3xl",
              "text-2xl font-extrabold text-white shadow-lg",
              isBD ? "bg-[#06B6D4]" : "bg-[#1D9E75]",
            )}>
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 sm:text-3xl">
                  {doctor.name}
                </h1>
                {/* Verified badge */}
                {(doctor.bmdc || doctor.npi) && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="size-3.5" />
                    {isBD ? "BMDC Verified" : "NPI Verified"}
                  </span>
                )}
              </div>

              <p className="text-base text-slate-500 dark:text-slate-400 mb-3">{doctor.specialty}</p>

              {/* Rating */}
              {doctor.avgRating != null && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating value={doctor.avgRating} size="md" showValue />
                  <span className="text-sm text-slate-400">
                    ({doctor.reviewCount} review{doctor.reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/appointments/new?doctor=${doctor.slug}`}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-sm",
                  "transition-all active:scale-[0.98]",
                  isBD ? "bg-[#06B6D4] hover:bg-[#0E7490]" : "bg-[#1D9E75] hover:bg-[#0d9488]",
                )}
              >
                <Calendar className="size-4" />
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Consultation Fee" value={feeLabel} />
          <StatCard
            label="Avg Wait"
            value={doctor.avgWaitMinutes != null ? `~${doctor.avgWaitMinutes} min` : "—"}
          />
          <StatCard
            label="Today"
            value={doctor.isAvailableToday ? "Available ✓" : "Not available"}
            valueClass={doctor.isAvailableToday ? "text-[#1D9E75]" : "text-slate-400"}
          />
          <StatCard
            label="Region"
            value={isBD ? "🇧🇩 Bangladesh" : "🇺🇸 United States"}
          />
        </div>

        {/* ── BD-specific ─────────────────────────────────────────────────────── */}
        {isBD && (
          <>
            {/* BMDC */}
            {doctor.bmdc && (
              <Card title="Registration">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="size-5 text-[#06B6D4]" />
                  <div>
                    <p className="text-xs text-slate-500">BMDC Registration Number</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                      {doctor.bmdc}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Chamber schedule */}
            {Object.keys(chambers).length > 0 && (
              <Card title="Chamber Schedule">
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm border-collapse min-w-[340px]">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wide">
                        <th className="text-left py-2 pr-4 font-semibold">Day</th>
                        <th className="text-left py-2 pr-4 font-semibold">Morning</th>
                        <th className="text-left py-2 pr-4 font-semibold">Evening</th>
                        <th className="text-right py-2 font-semibold">Max Patients</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {DAY_ORDER
                        .filter((d) => d in chambers)
                        .map((day) => {
                          const slot = chambers[day]
                          const morn = slot.morning
                            ? `${fmtTime(slot.morning.start)} – ${fmtTime(slot.morning.end)}`
                            : slot.start
                              ? `${fmtTime(slot.start)} – ${fmtTime(slot.end)}`
                              : "—"
                          const eve = slot.evening
                            ? `${fmtTime(slot.evening.start)} – ${fmtTime(slot.evening.end)}`
                            : "—"

                          return (
                            <tr key={day} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2.5 pr-4 font-medium text-slate-700 dark:text-slate-200 capitalize">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </td>
                              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300 tabular-nums">
                                {morn}
                              </td>
                              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300 tabular-nums">
                                {eve}
                              </td>
                              <td className="py-2.5 text-right text-slate-500 tabular-nums">
                                {slot.maxPatients ?? "—"}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Call to confirm today's schedule before visiting.
                </p>
              </Card>
            )}
          </>
        )}

        {/* ── US-specific ─────────────────────────────────────────────────────── */}
        {!isBD && (
          <Card title="Provider Information">
            <div className="space-y-4">
              {doctor.npi && (
                <div className="flex items-center gap-3">
                  <BadgeCheck className="size-5 text-[#1D9E75]" />
                  <div>
                    <p className="text-xs text-slate-500">NPI Number</p>
                    <p className="font-semibold font-mono text-slate-800 dark:text-slate-100">
                      {doctor.npi}
                    </p>
                  </div>
                </div>
              )}

              {/* Insurance placeholder — schema has no doctor-insurance relation */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="size-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Insurance Acceptance
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Insurance details are not yet linked to this provider profile. Contact the
                      office directly to confirm your plan is accepted before booking.
                    </p>
                    {doctor.phone && (
                      <a
                        href={`tel:${doctor.phone}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#06B6D4] hover:underline"
                      >
                        <Phone className="size-3.5" />
                        {doctor.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── About ───────────────────────────────────────────────────────────── */}
        {doctor.bio && (
          <Card title="About">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {doctor.bio}
            </p>
          </Card>
        )}

        {/* ── Contact ─────────────────────────────────────────────────────────── */}
        {(doctor.phone || doctor.email || doctor.website) && (
          <Card title="Contact">
            <div className="flex flex-wrap gap-4">
              {doctor.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[#06B6D4] transition-colors"
                >
                  <Phone className="size-4 text-slate-400" />
                  {doctor.phone}
                </a>
              )}
              {doctor.email && (
                <a
                  href={`mailto:${doctor.email}`}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[#06B6D4] transition-colors"
                >
                  <Mail className="size-4 text-slate-400" />
                  {doctor.email}
                </a>
              )}
              {doctor.website && (
                <a
                  href={doctor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[#06B6D4] transition-colors"
                >
                  <Globe className="size-4 text-slate-400" />
                  Website
                </a>
              )}
            </div>
          </Card>
        )}

        {/* ── Location map ─────────────────────────────────────────────────────── */}
        {doctor.lat != null && doctor.lng != null && (
          <Card title="Location">
            <div className="flex items-start gap-2 mb-3 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="size-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                {doctor.city}
                {doctor.district ? `, ${doctor.district}` : ""}
                {doctor.state ? `, ${doctor.state}` : ""}
              </span>
            </div>
            {mapToken ? (
              <MiniMap
                lat={doctor.lat}
                lng={doctor.lng}
                label={doctor.name}
                mapboxToken={mapToken}
              />
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${doctor.lat},${doctor.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#06B6D4] hover:underline"
              >
                Open in Google Maps →
              </a>
            )}
          </Card>
        )}

        {/* ── Reviews ──────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <ReviewsWidget
            doctorId={doctor.id}
            initialReviews={doctor.reviews.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
            }))}
            avgRating={doctor.avgRating}
            reviewCount={doctor.reviewCount}
          />
        </div>

      </div>
    </div>
  )
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Card({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6",
      className,
    )}>
      {title && (
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100", valueClass)}>
        {value}
      </p>
    </div>
  )
}
