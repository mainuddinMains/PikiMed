"use client"

import SearchBar from "./SearchBar"
import EmergencyStrip from "./EmergencyStrip"
import NearbyHospitals from "./NearbyHospitals"
import InfoAccordion from "./InfoAccordion"
import DoctorRow from "./DoctorRow"

export default function BDHome() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#06B6D4]/10 via-white to-[#1D9E75]/5 dark:from-[#06B6D4]/5 dark:via-slate-900 dark:to-[#1D9E75]/5 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-[#06B6D4]/10 px-3 py-1 text-xs font-semibold text-[#0E7490] dark:text-[#06B6D4] mb-5">
            🇧🇩 Bangladesh
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
            Find doctors &amp; hospitals{" "}
            <span className="text-[#06B6D4]">in Bangladesh</span>
          </h1>
          <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Search BMDC-verified doctors, compare hospital fees in BDT, and find emergency services — all in one place.
          </p>
          <div className="mt-8">
            <SearchBar
              placeholder="Doctor name, specialty, or hospital…"
              locationPlaceholder="District or city"
            />
          </div>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">

        {/* Emergency strip */}
        <EmergencyStrip />

        {/* Nearby hospitals */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Nearby Hospitals
          </h2>
          <NearbyHospitals region="BD" />
        </section>

        {/* What you need to know */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            What you need to know
          </h2>
          <InfoAccordion />
        </section>

        {/* Doctor row */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Featured Doctors
            </h2>
            <a
              href="/search?region=BD&type=doctor"
              className="text-sm font-semibold text-[#06B6D4] hover:text-[#0E7490] transition-colors"
            >
              See all →
            </a>
          </div>
          <DoctorRow region="BD" />
        </section>

      </div>
    </div>
  )
}
