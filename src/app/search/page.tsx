import { Suspense } from "react"
import type { Metadata } from "next"
import SearchPageClient from "@/components/search/SearchPageClient"

export const metadata: Metadata = {
  title: "Search",
  description: "Find doctors, hospitals, and clinics near you.",
  alternates: { canonical: "https://pikimed.com/search" },
}

export default function SearchPage() {
  // MAPBOX_TOKEN is a server-only env var. We pass it as a prop so the client
  // map component can use it without exposing it via NEXT_PUBLIC_.
  const mapboxToken = process.env.MAPBOX_TOKEN ?? ""

  return (
    <Suspense>
      <SearchPageClient mapboxToken={mapboxToken} />
    </Suspense>
  )
}
