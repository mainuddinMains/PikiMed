import { redirect } from "next/navigation"
import Link          from "next/link"
import { auth }      from "@/auth"
import { LayoutDashboard, Stethoscope, Building2, MessageSquare, ChevronRight } from "lucide-react"

const NAV = [
  { href: "/admin",           label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/doctors",   label: "Doctors",   icon: Stethoscope     },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2       },
  { href: "/admin/reviews",   label: "Reviews",   icon: MessageSquare   },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || role !== "ADMIN") redirect("/")

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="font-bold text-sm text-[#06B6D4] tracking-wide uppercase">PikiMed Admin</span>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#06B6D4] transition-colors group"
            >
              <Icon className="size-4 text-slate-400 group-hover:text-[#06B6D4] transition-colors" />
              {label}
              <ChevronRight className="size-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          {session.user.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
