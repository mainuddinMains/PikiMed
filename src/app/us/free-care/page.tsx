import type { Metadata } from "next"
import { Heart } from "lucide-react"
import FreeCareClient from "@/components/free-care/FreeCareClient"

export const metadata: Metadata = {
  title:       "Free & Low-Cost Care | PikiMed",
  description: "Find free clinics, FQHCs, and sliding-scale healthcare near you.",
  openGraph: {
    title:       "Free & Low-Cost Care — PikiMed",
    description: "FQHCs, free clinics, and sliding-scale providers near you.",
    type:        "website",
  },
}

export default function FreeCarePage() {
  const mapboxToken = process.env.MAPBOX_TOKEN

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold mb-4">
            <Heart className="size-3.5" /> US Healthcare Access
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Free &amp; Low-Cost Care
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xl">
            Federally Qualified Health Centers (FQHCs), free clinics, and sliding-scale
            providers near you — care regardless of insurance or income.
          </p>
        </div>

        <FreeCareClient mapboxToken={mapboxToken} />
      </div>
    </main>
  )
}
