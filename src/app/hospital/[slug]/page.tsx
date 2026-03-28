import { notFound } from "next/navigation"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Phone, MapPin, Clock, AlertCircle, Building2,
  BadgeCheck, ShieldCheck, Zap,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { isCurrentlyOpen } from "@/components/home/types"
import StarRating from "@/components/detail/StarRating"
import ReviewsWidget from "@/components/ReviewsWidget"

const MiniMap = dynamic(() => import("@/components/detail/MiniMap"), { ssr: false })

export const revalidate = 3600

// ── Type helpers ──────────────────────────────────────────────────────────────

const TYPE_LABEL = {
  GOVERNMENT:  "Government Hospital",
  PRIVATE:     "Private Hospital",
  DIAGNOSTIC:  "Diagnostic Centre",
  FQHC:        "Federally Qualified Health Center",
} as const

const TYPE_COLOR = {
  GOVERNMENT:  "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  PRIVATE:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DIAGNOSTIC:  "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  FQHC:        "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
} as const

const INSURANCE_TYPE_COLOR = {
  PPO:      "bg-sky-100     text-sky-700     dark:bg-sky-900/30     dark:text-sky-400",
  HMO:      "bg-violet-100  text-violet-700  dark:bg-violet-900/30  dark:text-violet-400",
  HDHP:     "bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400",
  MEDICAID: "bg-teal-100    text-teal-700    dark:bg-teal-900/30    dark:text-teal-400",
  MEDICARE: "bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400",
  CHIP:     "bg-pink-100    text-pink-700    dark:bg-pink-900/30    dark:text-pink-400",
} as const

// ── Static params + metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const hospitals = await prisma.hospital.findMany({ select: { slug: true } })
    return hospitals.map(({ slug }) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const h = await prisma.hospital.findUnique({
    where:  { slug: params.slug },
    select: { name: true, type: true, city: true },
  })
  if (!h) return { title: "Hospital Not Found" }

  return {
    title:       `${h.name} — ${TYPE_LABEL[h.type]}`,
    description: `${h.name} in ${h.city}. Find departments, insurance, directions, and patient reviews on PikiMed.`,
    openGraph: {
      title:       `${h.name} | PikiMed`,
      description: `${TYPE_LABEL[h.type]} in ${h.city}`,
      type:        "website",
    },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(t: string | undefined | null) {
  if (!t) return "—"
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HospitalPage({ params }: { params: { slug: string } }) {
  const hospital = await prisma.hospital.findUnique({
    where:   { slug: params.slug },
    include: {
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take:    20,
      },
      hospitalInsurance: {
        include: { insurancePlan: true },
        orderBy: { insurancePlan: { name: "asc" } },
      },
    },
  })

  if (!hospital) notFound()

  const isBD     = hospital.region === "BD"
  const isOpen   = isCurrentlyOpen(hospital.isOpen24h, hospital.openTime, hospital.closeTime)
  const mapToken = process.env.MAPBOX_TOKEN ?? ""

  const isMedicaid = hospital.hospitalInsurance.some(
    (hi) => hi.insurancePlan.type === "MEDICAID",
  )
  const isMedicare = hospital.hospitalInsurance.some(
    (hi) => hi.insurancePlan.type === "MEDICARE",
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hero header ────────────────────────────────────────────────────────── */}
      <div className={cn(
        "bg-gradient-to-br px-4 pt-10 pb-8",
        isBD
          ? "from-[#06B6D4]/10 via-white to-slate-50 dark:from-[#06B6D4]/8 dark:via-slate-900 dark:to-slate-900"
          : "from-[#1D9E75]/10 via-white to-slate-50 dark:from-[#1D9E75]/8 dark:via-slate-900 dark:to-slate-900",
      )}>
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-[#06B6D4] transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/search?type=hospital" className="hover:text-[#06B6D4] transition-colors">Hospitals</Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-600 dark:text-slate-300">{hospital.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Icon */}
            <div className="flex-shrink-0 flex size-20 items-center justify-center rounded-3xl bg-slate-200 dark:bg-slate-700 shadow-sm">
              <Building2 className="size-9 text-slate-500" />
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                  TYPE_COLOR[hospital.type],
                )}>
                  {TYPE_LABEL[hospital.type]}
                </span>

                {/* 24h Emergency */}
                {hospital.isOpen24h && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/40">
                    <Zap className="size-3" />
                    24h Emergency
                  </span>
                )}

                {/* FQHC */}
                {hospital.type === "FQHC" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="size-3" />
                    Free / Sliding-Scale
                  </span>
                )}

                {/* Open/Closed */}
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                  isOpen
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                )}>
                  {hospital.isOpen24h ? "Open 24h" : isOpen ? "Open now" : "Closed"}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 sm:text-3xl mb-2">
                {hospital.name}
              </h1>

              {/* Location */}
              {hospital.address && (
                <p className="flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <MapPin className="size-4 flex-shrink-0 mt-0.5" />
                  {hospital.address}
                </p>
              )}

              {/* Rating */}
              {hospital.avgRating != null && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating value={hospital.avgRating} size="md" showValue />
                  <span className="text-sm text-slate-400">
                    ({hospital.reviewCount} review{hospital.reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-2">
                {hospital.lat != null && hospital.lng != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-sm",
                      "transition-all active:scale-[0.98]",
                      isBD ? "bg-[#06B6D4] hover:bg-[#0E7490]" : "bg-[#1D9E75] hover:bg-[#0d9488]",
                    )}
                  >
                    <MapPin className="size-4" />
                    Get Directions
                  </a>
                )}
                {hospital.phone && (
                  <a
                    href={`tel:${hospital.phone}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Phone className="size-4" />
                    {hospital.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Type" value={TYPE_LABEL[hospital.type].split(" ")[0]} />
          <StatCard
            label="Hours"
            value={hospital.isOpen24h
              ? "Open 24 hours"
              : hospital.openTime && hospital.closeTime
                ? `${fmtTime(hospital.openTime)} – ${fmtTime(hospital.closeTime)}`
                : "—"
            }
          />
          <StatCard
            label="Departments"
            value={hospital.specialties.length > 0 ? `${hospital.specialties.length} listed` : "—"}
          />
          <StatCard
            label="Region"
            value={isBD ? "🇧🇩 Bangladesh" : "🇺🇸 United States"}
          />
        </div>

        {/* Emergency contact */}
        {hospital.emergencyPhone && (
          <div className="flex items-center gap-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4">
            <AlertCircle className="size-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Emergency Contact</p>
              <a
                href={`tel:${hospital.emergencyPhone}`}
                className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400 hover:underline"
              >
                {hospital.emergencyPhone}
              </a>
            </div>
          </div>
        )}

        {/* Specialties / Departments */}
        {hospital.specialties.length > 0 && (
          <Card title="Departments & Specialties">
            <div className="flex flex-wrap gap-2">
              {hospital.specialties.map((s) => (
                <span
                  key={s}
                  className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* ── BD-specific ─────────────────────────────────────────────────────── */}
        {isBD && (
          <Card title="Visiting Information">
            <div className="space-y-4">
              {/* Fee context */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Fee Information
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {hospital.type === "GOVERNMENT" &&
                    "Government-regulated fees apply. OPD registration: ৳10–50. Specialist consultations: ৳100–500. Emergency treatment may be subsidised."}
                  {hospital.type === "PRIVATE" &&
                    "Fees are set by the hospital and vary by department. Ask for a written cost estimate before procedures. Emergency department charges may differ."}
                  {hospital.type === "DIAGNOSTIC" &&
                    "Diagnostic test fees vary. Request a printed fee schedule at the reception. Package deals may be available for multiple tests."}
                  {hospital.type === "FQHC" &&
                    "Community health services with subsidised fees. Sliding-scale payments available based on income."}
                </p>
              </div>

              {/* Hours */}
              {!hospital.isOpen24h && hospital.openTime && hospital.closeTime && (
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">OPD Hours</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      {fmtTime(hospital.openTime)} – {fmtTime(hospital.closeTime)}
                    </p>
                  </div>
                </div>
              )}

              {hospital.isOpen24h && (
                <div className="flex items-center gap-3">
                  <Zap className="size-4 text-red-400" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Emergency department open 24 hours
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── US-specific ─────────────────────────────────────────────────────── */}
        {!isBD && (
          <>
            {/* FQHC info */}
            {hospital.type === "FQHC" && (
              <div className="flex items-start gap-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-5">
                <ShieldCheck className="size-6 text-[#1D9E75] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Federally Qualified Health Center
                  </p>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-400 leading-relaxed">
                    This is an FQHC — a federally funded community health center offering comprehensive
                    care on a sliding-scale fee basis. No one is turned away for inability to pay.
                  </p>
                </div>
              </div>
            )}

            {/* Medicare / Medicaid participation */}
            {(isMedicaid || isMedicare) && (
              <div className="flex flex-wrap gap-3">
                {isMedicare && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                    <BadgeCheck className="size-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      Medicare Accepted
                    </span>
                  </div>
                )}
                {isMedicaid && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30">
                    <BadgeCheck className="size-4 text-teal-500" />
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                      Medicaid Accepted
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Insurance list */}
            {hospital.hospitalInsurance.length > 0 && (
              <Card title="Accepted Insurance Networks">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hospital.hospitalInsurance.map(({ insurancePlan: plan }) => (
                    <div key={plan.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {plan.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{plan.provider}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          INSURANCE_TYPE_COLOR[plan.type],
                        )}>
                          {plan.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 px-2 py-0.5 rounded-full">
                          <BadgeCheck className="size-3" />
                          In-Network
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost summary */}
                {hospital.hospitalInsurance.some((hi) => hi.insurancePlan.deductible != null) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                      Example Plan Costs
                    </p>
                    <div className="space-y-2">
                      {hospital.hospitalInsurance
                        .filter((hi) => hi.insurancePlan.deductible != null)
                        .slice(0, 3)
                        .map(({ insurancePlan: plan }) => (
                          <div key={plan.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[60%]">
                              {plan.name}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                              {plan.deductible != null && `Ded. $${plan.deductible.toLocaleString()}`}
                              {plan.copay != null && ` · Copay $${plan.copay}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* ── Location map ─────────────────────────────────────────────────────── */}
        {hospital.lat != null && hospital.lng != null && (
          <Card title="Location">
            {hospital.address && (
              <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3">
                <MapPin className="size-4 text-slate-400 flex-shrink-0 mt-0.5" />
                {hospital.address}
              </p>
            )}
            {mapToken ? (
              <MiniMap
                lat={hospital.lat}
                lng={hospital.lng}
                label={hospital.name}
                mapboxToken={mapToken}
              />
            ) : (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
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
            hospitalId={hospital.id}
            initialReviews={hospital.reviews.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
            }))}
            avgRating={hospital.avgRating}
            reviewCount={hospital.reviewCount}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}
