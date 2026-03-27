"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore, type Region } from "@/lib/store"
import PikiMedLogo from "@/components/PikiMedLogo"

// ── Nav links (region-conditional) ───────────────────────────────────────────

const NAV_LINKS = [
  { href: "/doctors",   label: "Find Doctors", regions: ["BD", "US"] as Region[] },
  { href: "/hospitals", label: "Hospitals",    regions: ["BD", "US"] as Region[] },
  { href: "/insurance", label: "Insurance",    regions: ["US"]        as Region[] },
  { href: "/emergency", label: "Emergency",    regions: ["BD"]        as Region[] },
] as const

// ── Region pill ───────────────────────────────────────────────────────────────

interface RegionPillProps {
  region: Region
  setRegion: (r: Region) => void
  compact?: boolean
}

function RegionPill({ region, setRegion, compact = false }: RegionPillProps) {
  return (
    <div
      role="group"
      aria-label="Region selector"
      className={cn(
        "flex items-center rounded-full border border-slate-200 dark:border-slate-700",
        "bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5",
      )}
    >
      <button
        onClick={() => setRegion("BD")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/60",
          region === "BD"
            ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
          compact && "px-2 py-0.5",
        )}
        aria-pressed={region === "BD"}
      >
        🇧🇩{compact ? "" : " Bangladesh"}
      </button>
      <button
        onClick={() => setRegion("US")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/60",
          region === "US"
            ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
          compact && "px-2 py-0.5",
        )}
        aria-pressed={region === "US"}
      >
        🇺🇸{compact ? "" : " United States"}
      </button>
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname()
  const region    = useAppStore((s) => s.region)
  const setRegion = useAppStore((s) => s.setRegion)

  const [scrolled,    setScrolled]    = useState(false)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  // Defer region-dependent rendering until after Zustand rehydrates from localStorage
  const [hydrated,    setHydrated]    = useState(false)

  // ── Scroll detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // ── Zustand hydration ───────────────────────────────────────────────────────
  useEffect(() => setHydrated(true), [])

  // ── Drawer: close on Escape / body-scroll lock ──────────────────────────────
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false) }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  // Close drawer on route change
  const prevPath = useRef(pathname)
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setDrawerOpen(false)
      prevPath.current = pathname
    }
  }, [pathname])

  const visibleLinks = NAV_LINKS.filter((l) =>
    !hydrated || l.regions.includes(region),
  )

  return (
    <>
      {/* ── Sticky navbar ──────────────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-16 transition-all duration-200",
          scrolled
            ? "bg-white/80 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 shadow-sm"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left — logo */}
          <Link href="/" aria-label="PikiMed home">
            {/* Full wordmark on md+, icon-only on mobile */}
            <span className="hidden md:inline-flex">
              <PikiMedLogo size="sm" />
            </span>
            <span className="inline-flex md:hidden">
              <PikiMedLogo variant="icon" size="sm" />
            </span>
          </Link>

          {/* Centre — nav links (desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1"
          >
            {visibleLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/60",
                    active
                      ? "text-[#06B6D4] bg-[#06B6D4]/8 dark:bg-[#06B6D4]/12"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right — region pill + sign in (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {hydrated && (
              <RegionPill region={region} setRegion={setRegion} />
            )}
            <Link
              href="/api/auth/signin"
              className={cn(
                "rounded-lg bg-[#06B6D4] px-4 py-2 text-sm font-semibold text-white",
                "transition-colors hover:bg-[#0E7490] focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#06B6D4]/70 focus-visible:ring-offset-2",
              )}
            >
              Sign In
            </Link>
          </div>

          {/* Mobile — hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className={cn(
              "inline-flex md:hidden items-center justify-center rounded-lg p-2",
              "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/60",
            )}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden",
          "transition-opacity duration-200",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 md:hidden",
          "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800",
          "flex flex-col shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <PikiMedLogo size="sm" />
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className={cn(
              "rounded-lg p-2 text-slate-500 dark:text-slate-400",
              "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/60",
            )}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Drawer links */}
        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-[#06B6D4] bg-[#06B6D4]/8 dark:bg-[#06B6D4]/12"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Drawer footer — region + sign in */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-3">
          {hydrated && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                Region
              </span>
              <RegionPill region={region} setRegion={setRegion} />
            </div>
          )}
          <Link
            href="/api/auth/signin"
            className={cn(
              "flex w-full items-center justify-center rounded-lg",
              "bg-[#06B6D4] px-4 py-2.5 text-sm font-semibold text-white",
              "transition-colors hover:bg-[#0E7490]",
            )}
          >
            Sign In
          </Link>
        </div>
      </aside>
    </>
  )
}
