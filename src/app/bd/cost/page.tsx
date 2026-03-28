import type { Metadata } from "next"
import { TrendingDown } from "lucide-react"
import CostClient from "./CostClient"

export const metadata: Metadata = {
  title:       "Healthcare Costs in Bangladesh | PikiMed",
  description: "Transparent price guide for consultations, tests, and procedures at government hospitals, private hospitals, and diagnostic centers in Bangladesh.",
  openGraph: {
    title:       "BD Healthcare Cost Guide — PikiMed",
    description: "Compare CBC, MRI, X-Ray, ECG prices across government, private, and diagnostic centers.",
    type:        "website",
  },
}

export default function BDCostPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-bold mb-5">
            🇧🇩 Bangladesh · BDT prices
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Healthcare Cost Guide
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Community-sourced price ranges for common consultations, tests, and
            procedures — across government hospitals, private hospitals, and diagnostic centers.
          </p>

          {/* Summary stats */}
          <div className="mt-6 inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">Free</p>
              <p className="text-xs text-slate-400">Govt. CBC</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">৳300</p>
              <p className="text-xs text-slate-400">Diagnostic CBC</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center flex items-center gap-1">
              <TrendingDown className="size-5 text-green-600" />
              <div>
                <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">75%</p>
                <p className="text-xs text-slate-400">avg. savings govt.</p>
              </div>
            </div>
          </div>
        </div>

        <CostClient />
      </div>
    </main>
  )
}
