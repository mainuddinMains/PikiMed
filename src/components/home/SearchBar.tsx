"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  placeholder?: string
  locationPlaceholder?: string
  className?: string
}

export default function SearchBar({
  placeholder = "Search doctors, hospitals, specialties…",
  locationPlaceholder = "City or district",
  className,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (location) params.set("loc", location)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col sm:flex-row gap-2 w-full max-w-2xl mx-auto",
        className,
      )}
    >
      {/* Query input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-600",
            "shadow-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:border-[#06B6D4]",
            "placeholder:text-slate-400 text-slate-800 dark:text-slate-100",
          )}
        />
      </div>

      {/* Location input */}
      <div className="relative sm:w-48">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={locationPlaceholder}
          className={cn(
            "w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-600",
            "shadow-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:border-[#06B6D4]",
            "placeholder:text-slate-400 text-slate-800 dark:text-slate-100",
          )}
        />
      </div>

      <button
        type="submit"
        className={cn(
          "px-6 py-3.5 rounded-2xl text-sm font-semibold text-white",
          "bg-[#06B6D4] hover:bg-[#0E7490] active:scale-[0.98]",
          "transition-all duration-150 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50",
        )}
      >
        Search
      </button>
    </form>
  )
}
