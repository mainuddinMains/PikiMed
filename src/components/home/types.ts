export type HospitalType = "GOVERNMENT" | "PRIVATE" | "DIAGNOSTIC" | "FQHC"

export interface Hospital {
  id: string
  name: string
  slug: string
  type: HospitalType
  address: string | null
  city: string
  district: string | null
  state: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  emergencyPhone: string | null
  isOpen24h: boolean
  openTime: string | null
  closeTime: string | null
  specialties: string[]
  avgRating: number | null
  reviewCount: number
}

export interface Doctor {
  id: string
  name: string
  slug: string
  specialty: string
  city: string
  district: string | null
  state: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  bmdc: string | null
  npi: string | null
  consultFeeMin: number | null
  consultFeeMax: number | null
  currency: string
  isAvailableToday: boolean
  avgWaitMinutes: number | null
  avgRating: number | null
  reviewCount: number
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

/** Returns true if the facility is currently open */
export function isCurrentlyOpen(
  isOpen24h: boolean,
  openTime: string | null,
  closeTime: string | null,
): boolean {
  if (isOpen24h) return true
  if (!openTime || !closeTime) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = openTime.split(":").map(Number)
  const [ch, cm] = closeTime.split(":").map(Number)
  return cur >= oh * 60 + om && cur < ch * 60 + cm
}
