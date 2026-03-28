"use server"

import { revalidatePath } from "next/cache"
import { auth }   from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Region, HospitalType } from "@prisma/client"

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Unauthorized")
  return session
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTORS
// ─────────────────────────────────────────────────────────────────────────────

export async function createDoctor(data: {
  name: string; specialty: string; bio?: string
  region: Region; city: string; district?: string; state?: string
  phone?: string; email?: string; website?: string
  bmdc?: string; npi?: string
  consultFeeMin?: number; consultFeeMax?: number; currency?: string
  lat?: number; lng?: number; avgWaitMinutes?: number
}) {
  await requireAdmin()
  const slug = toSlug(data.name) + "-" + Math.random().toString(36).slice(2, 6)
  await prisma.doctor.create({
    data: {
      ...data,
      slug,
      currency: data.currency ?? (data.region === "BD" ? "BDT" : "USD"),
    },
  })
  revalidatePath("/admin/doctors")
}

export async function updateDoctor(id: string, data: {
  name?: string; specialty?: string; bio?: string
  city?: string; district?: string; state?: string
  phone?: string; email?: string; website?: string
  bmdc?: string; npi?: string
  consultFeeMin?: number | null; consultFeeMax?: number | null; currency?: string
  lat?: number | null; lng?: number | null; avgWaitMinutes?: number | null
  isAvailableToday?: boolean
}) {
  await requireAdmin()
  await prisma.doctor.update({ where: { id }, data })
  revalidatePath("/admin/doctors")
}

export async function deleteDoctor(id: string) {
  await requireAdmin()
  await prisma.doctor.delete({ where: { id } })
  revalidatePath("/admin/doctors")
}

export async function toggleDoctorAvailability(id: string, value: boolean) {
  await requireAdmin()
  await prisma.doctor.update({ where: { id }, data: { isAvailableToday: value } })
  revalidatePath("/admin/doctors")
}

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITALS
// ─────────────────────────────────────────────────────────────────────────────

export async function createHospital(data: {
  name: string; type: HospitalType; region: Region
  city: string; address?: string; district?: string; state?: string
  phone?: string; emergencyPhone?: string
  isOpen24h?: boolean; openTime?: string; closeTime?: string
  lat?: number; lng?: number
  specialties?: string[]
}) {
  await requireAdmin()
  const slug = toSlug(data.name) + "-" + Math.random().toString(36).slice(2, 6)
  await prisma.hospital.create({
    data: { ...data, slug, specialties: data.specialties ?? [] },
  })
  revalidatePath("/admin/hospitals")
}

export async function updateHospital(id: string, data: {
  name?: string; type?: HospitalType
  city?: string; address?: string; district?: string; state?: string
  phone?: string; emergencyPhone?: string
  isOpen24h?: boolean; openTime?: string | null; closeTime?: string | null
  lat?: number | null; lng?: number | null
  specialties?: string[]
}) {
  await requireAdmin()
  await prisma.hospital.update({ where: { id }, data })
  revalidatePath("/admin/hospitals")
}

export async function deleteHospital(id: string) {
  await requireAdmin()
  await prisma.hospital.delete({ where: { id } })
  revalidatePath("/admin/hospitals")
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteReview(id: string) {
  await requireAdmin()
  await prisma.review.delete({ where: { id } })
  revalidatePath("/admin/reviews")
}

export async function deleteReviews(ids: string[]) {
  await requireAdmin()
  await prisma.review.deleteMany({ where: { id: { in: ids } } })
  revalidatePath("/admin/reviews")
}
