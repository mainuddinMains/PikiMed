import type { Metadata } from "next"
import { Sparkles } from "lucide-react"
import RecommenderClient from "@/components/insurance/RecommenderClient"

export const metadata: Metadata = {
  title:       "Insurance Plan Recommender | PikiMed",
  description: "Answer 5 questions. Get your top 3 personalized insurance plan recommendations instantly.",
  openGraph: {
    title:       "Insurance Plan Recommender — PikiMed",
    description: "Personalized plan recommendations based on your age, health, budget, and employment.",
    type:        "website",
  },
}

export default function RecommenderPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs font-bold mb-5">
            <Sparkles className="size-3.5" />
            AI-Free · Rule-Based · Instant
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
            Find Your Best Insurance Plan
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-base">
            Answer a few questions about your health, budget, and employment.
            We&apos;ll rank the top insurance plan types for your situation — instantly.
          </p>
        </div>

        <RecommenderClient />
      </div>
    </main>
  )
}
