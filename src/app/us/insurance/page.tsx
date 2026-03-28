import type { Metadata } from "next"
import { Shield } from "lucide-react"
import InsuranceWizard from "@/components/insurance/InsuranceWizard"

export const metadata: Metadata = {
  title:       "Insurance Intelligence | PikiMed",
  description: "Check your insurance coverage, find in-network hospitals, and get personalized eligibility guidance.",
  openGraph: {
    title:       "Insurance Intelligence — PikiMed",
    description: "Coverage checker · Hospital match · Eligibility guide",
    type:        "website",
  },
}

export default function InsurancePage() {
  const mapboxToken = process.env.MAPBOX_TOKEN

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#06B6D4]/10 mb-4">
            <Shield className="size-7 text-[#06B6D4]" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Insurance Intelligence
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Understand your coverage, find in-network hospitals, and discover which
            insurance options fit your situation.
          </p>
        </div>

        {/* Wizard card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-4 sm:p-8">
          <InsuranceWizard mapboxToken={mapboxToken} />
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-slate-400 max-w-md mx-auto">
          PikiMed provides informational guidance only. Premium estimates are approximate.
          Always verify your coverage details with your insurance provider.
        </p>
      </div>
    </main>
  )
}
