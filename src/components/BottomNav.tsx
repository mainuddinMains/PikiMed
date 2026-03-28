"use client"

import Link        from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Search, Building2, ShieldCheck, Zap, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRegion } from "@/lib/region"

// ── Tab definitions ────────────────────────────────────────────────────────────

const COMMON_TABS = [
  { id: "home",      href: "/",                      label: "Home",      icon: Home      },
  { id: "search",    href: "/search",                label: "Search",    icon: Search    },
  { id: "hospitals", href: "/search?type=hospital",  label: "Hospitals", icon: Building2 },
] as const

const BD_TAB   = { id: "emergency", href: "/emergency", label: "Emergency", icon: Zap         }
const US_TAB   = { id: "insurance", href: "/insurance", label: "Insurance", icon: ShieldCheck  }
const PROFILE  = { id: "profile",   href: "/profile",   label: "Profile",   icon: User         }

// ── Component ──────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const pathname = usePathname()
  const { region } = useRegion()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  // Hide on admin pages — they have their own sidebar nav
  if (pathname.startsWith("/admin")) return null

  const specialTab = !hydrated || region === "US" ? US_TAB : BD_TAB
  const tabs = [...COMMON_TABS, specialTab, PROFILE]

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    // Strip query string for comparison
    const base = href.split("?")[0]
    return pathname === base || pathname.startsWith(base + "/")
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed bottom-0 inset-x-0 z-40 md:hidden",
        "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md",
        "border-t border-slate-200 dark:border-slate-800",
        // Safe-area inset for iPhone notch/home-bar
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <div className="flex items-stretch">
        {tabs.map(({ id, href, label, icon: Icon }) => {
          const active = isActive(href)
          const isEmergency = id === "emergency"

          return (
            <Link
              key={id}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors",
                "text-[10px] font-medium",
                active
                  ? isEmergency
                    ? "text-red-500"
                    : "text-[#06B6D4]"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  active && "scale-110",
                  active && isEmergency && "text-red-500",
                  active && !isEmergency && "text-[#06B6D4]",
                )}
              />
              <span className="leading-none truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
