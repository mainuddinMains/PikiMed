import { prisma } from "@/lib/prisma"
import DoctorsClient from "./DoctorsClient"

export const metadata = { title: "Doctors | PikiMed Admin" }

export default async function AdminDoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, specialty: true,
      region: true, city: true, district: true, state: true,
      phone: true, email: true, website: true,
      bmdc: true, npi: true,
      consultFeeMin: true, consultFeeMax: true, currency: true,
      isAvailableToday: true, avgRating: true, reviewCount: true,
      bio: true, avgWaitMinutes: true, lat: true, lng: true,
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Doctors</h1>
        <p className="text-sm text-slate-500 mt-0.5">{doctors.length} total</p>
      </div>
      <DoctorsClient doctors={doctors} />
    </div>
  )
}
