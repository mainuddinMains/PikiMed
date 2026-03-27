"use client"

import Link from "next/link"
import { ShieldCheck, DollarSign, MapPin, Star, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import SearchBar from "./SearchBar"
import DoctorRow from "./DoctorRow"

const QUICK_LINKS = [
  {
    icon:  MapPin,
    label: "Free Clinics Near Me",
    sub:   "FQHC & sliding-scale centers",
    href:  "/search?type=clinic&free=true",
    color: "#1D9E75",
    bg:    "bg-green-50 dark:bg-green-950/20",
    border:"border-green-200 dark:border-green-800",
  },
  {
    icon:  DollarSign,
    label: "Cost Estimator",
    sub:   "See what a procedure costs near you",
    href:  "/cost-estimator",
    color: "#06B6D4",
    bg:    "bg-cyan-50 dark:bg-cyan-950/20",
    border:"border-cyan-200 dark:border-cyan-800",
  },
  {
    icon:  ShieldCheck,
    label: "Insurance Recommender",
    sub:   "Find the right plan for your needs",
    href:  "/insurance",
    color: "#0E7490",
    bg:    "bg-sky-50 dark:bg-sky-950/20",
    border:"border-sky-200 dark:border-sky-800",
  },
] as const

function InsurancePreviewCard() {
  return (
    <div className="rounded-2xl border border-[#06B6D4]/30 bg-gradient-to-br from-[#06B6D4]/5 to-[#1D9E75]/5 dark:from-[#06B6D4]/10 dark:to-[#1D9E75]/10 p-6">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 flex size-12 items-center justify-center rounded-2xl bg-[#06B6D4]/15">
          <ShieldCheck className="size-6 text-[#06B6D4]" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wide mb-1">
            Insurance Intelligence
          </p>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
            Know before you go
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Answer 5 quick questions to see which doctors and hospitals are in your network — before you book.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["PPO / HMO", "Medicaid", "Medicare", "CHIP", "Uninsured"].map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/insurance"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#06B6D4] hover:bg-[#0E7490] px-5 py-2.5 rounded-xl transition-colors"
          >
            Check My Coverage →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function USHome() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1D9E75]/10 via-white to-[#06B6D4]/5 dark:from-[#1D9E75]/5 dark:via-slate-900 dark:to-[#06B6D4]/5 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-[#1D9E75]/10 px-3 py-1 text-xs font-semibold text-[#1D9E75] mb-5">
            🇺🇸 United States
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
            Find care, check insurance,{" "}
            <span className="text-[#1D9E75]">locate free clinics</span>
          </h1>
          <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Search in-network doctors, compare procedure costs, and find FQHC clinics near you — no runaround.
          </p>
          <div className="mt-8">
            <SearchBar
              placeholder="Doctor, hospital, or specialty…"
              locationPlaceholder="City or ZIP"
            />
          </div>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">

        {/* Insurance Intelligence preview */}
        <InsurancePreviewCard />

        {/* Quick links */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ icon: Icon, label, sub, href, color, bg, border }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 transition-shadow hover:shadow-md",
                  bg,
                  border,
                )}
              >
                <span
                  className="flex-shrink-0 flex size-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="size-5" style={{ color }} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured doctors — in-network badge */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Featured Doctors
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <BadgeCheck className="size-3.5 text-[#1D9E75]" />
                In-network status shown after you add your insurance
              </p>
            </div>
            <Link
              href="/search?region=US&type=doctor"
              className="text-sm font-semibold text-[#1D9E75] hover:text-[#0E7490] transition-colors"
            >
              See all →
            </Link>
          </div>
          <DoctorRow region="US" />
        </section>

        {/* Trust strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
          {[
            { icon: "🏥", label: "Verified providers" },
            { icon: "🔒", label: "HIPAA-aware" },
            { icon: "💬", label: "Real patient reviews" },
            { icon: "📍", label: "Location-aware search" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 text-center"
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
            </div>
          ))}
        </section>

      </div>
    </div>
  )
}
