import { prisma } from "@/lib/prisma"
import HospitalsClient from "./HospitalsClient"

export const metadata = { title: "Hospitals | PikiMed Admin" }

export default async function AdminHospitalsPage() {
  const hospitals = await prisma.hospital.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, type: true, region: true,
      address: true, city: true, district: true, state: true,
      phone: true, emergencyPhone: true,
      isOpen24h: true, openTime: true, closeTime: true,
      lat: true, lng: true,
      specialties: true, avgRating: true, reviewCount: true,
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hospitals</h1>
        <p className="text-sm text-slate-500 mt-0.5">{hospitals.length} total</p>
      </div>
      <HospitalsClient hospitals={hospitals} />
    </div>
  )
}
