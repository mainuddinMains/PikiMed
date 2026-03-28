"use client"

import { useState, useCallback } from "react"
import { useSession }    from "next-auth/react"
import { Bookmark }      from "lucide-react"
import { cn }            from "@/lib/utils"

interface SaveButtonProps {
  doctorId?:    string
  hospitalId?:  string
  initialSaved: boolean
  size?:        "sm" | "md"
  className?:   string
}

export default function SaveButton({
  doctorId,
  hospitalId,
  initialSaved,
  size      = "md",
  className,
}: SaveButtonProps) {
  const { data: session } = useSession()
  const [saved,   setSaved]   = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const toggle = useCallback(async (e: React.MouseEvent) => {
    // Don't bubble up to parent Link elements
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      window.location.href = "/auth/signin"
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/saved", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ doctorId, hospitalId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSaved(data.saved)
      }
    } finally {
      setLoading(false)
    }
  }, [session, doctorId, hospitalId])

  const icon = size === "sm" ? "size-3.5" : "size-4"

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? "Remove from saved" : "Save provider"}
      className={cn(
        "flex items-center justify-center rounded-lg transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50",
        "disabled:opacity-50",
        size === "sm"
          ? "w-7 h-7"
          : "w-8 h-8",
        saved
          ? "text-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20"
          : "text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 bg-transparent",
        className,
      )}
    >
      <Bookmark
        className={cn(icon, loading && "animate-pulse")}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  )
}
