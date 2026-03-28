import { prisma } from "@/lib/prisma"
import { Stethoscope, Building2, Users, MessageSquare } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Admin Dashboard | PikiMed" }

export default async function AdminPage() {
  const [doctors, hospitals, users, reviews] = await Promise.all([
    prisma.doctor.count(),
    prisma.hospital.count(),
    prisma.user.count(),
    prisma.review.count(),
  ])

  const recentReviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user:     { select: { name: true, email: true } },
      doctor:   { select: { name: true } },
      hospital: { select: { name: true } },
    },
  })

  const recentDoctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, specialty: true, region: true, city: true, createdAt: true },
  })

  const CARDS = [
    { label: "Doctors",   value: doctors,   icon: Stethoscope,  href: "/admin/doctors",   color: "text-[#06B6D4] bg-[#06B6D4]/10" },
    { label: "Hospitals", value: hospitals, icon: Building2,    href: "/admin/hospitals", color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20" },
    { label: "Users",     value: users,     icon: Users,        href: "#",                color: "text-green-600 bg-green-100 dark:bg-green-900/20" },
    { label: "Reviews",   value: reviews,   icon: MessageSquare,href: "/admin/reviews",   color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent reviews */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Reviews</h2>
            <Link href="/admin/reviews" className="text-xs text-[#06B6D4] hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentReviews.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {r.user.name ?? r.user.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {r.doctor?.name ?? r.hospital?.name ?? "—"}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-semibold text-amber-500">★ {r.overallRating.toFixed(1)}</span>
                  <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
            {recentReviews.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate-400">No reviews yet</li>
            )}
          </ul>
        </div>

        {/* Recent doctors */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recently Added Doctors</h2>
            <Link href="/admin/doctors" className="text-xs text-[#06B6D4] hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentDoctors.map((d) => (
              <li key={d.id} className="px-5 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.specialty} · {d.city}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.region === "BD" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {d.region}
                </span>
              </li>
            ))}
            {recentDoctors.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate-400">No doctors yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
