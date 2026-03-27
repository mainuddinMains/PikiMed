import type { Metadata } from "next"
import { Calculator } from "lucide-react"
import CostEstimatorClient from "@/components/cost-estimator/CostEstimatorClient"

export const metadata: Metadata = {
  title:       "Medical Cost Estimator | PikiMed",
  description: "Compare procedure costs with and without insurance. Powered by CMS public data.",
  openGraph: {
    title:       "Medical Cost Estimator — PikiMed",
    description: "See what you'd pay with vs. without insurance for any medical procedure.",
    type:        "website",
  },
}

export default function CostEstimatorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#06B6D4]/10 mb-4">
            <Calculator className="size-7 text-[#06B6D4]" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Medical Cost Estimator
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Find out what you&apos;d pay for a procedure — with and without insurance.
            Compare real costs and understand your potential savings.
          </p>
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-6 sm:p-8">
          <CostEstimatorClient />
        </div>

      </div>
    </main>
  )
}
