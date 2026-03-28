import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE = "https://pikimed.com"

export const revalidate = 3600 // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all slugs — safe fallback if DB is unavailable
  let doctorSlugs:   string[] = []
  let hospitalSlugs: string[] = []

  try {
    const [doctors, hospitals] = await Promise.all([
      prisma.doctor.findMany({ select: { slug: true }, orderBy: { createdAt: "desc" } }),
      prisma.hospital.findMany({ select: { slug: true }, orderBy: { createdAt: "desc" } }),
    ])
    doctorSlugs   = doctors.map((d) => d.slug)
    hospitalSlugs = hospitals.map((h) => h.slug)
  } catch {
    // DB offline during build — return static routes only
  }

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/search`,        lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/bd`,            lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/us`,            lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/us/insurance`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/us/free-care`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/bd/cost`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/profile`,       lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ]

  const doctorRoutes: MetadataRoute.Sitemap = doctorSlugs.map((slug) => ({
    url:             `${BASE}/doctor/${slug}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }))

  const hospitalRoutes: MetadataRoute.Sitemap = hospitalSlugs.map((slug) => ({
    url:             `${BASE}/hospital/${slug}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }))

  return [...staticRoutes, ...doctorRoutes, ...hospitalRoutes]
}
