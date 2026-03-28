import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth }     from "@/auth"
import { prisma }   from "@/lib/prisma"
import ProfileClient from "./ProfileClient"
import type { ReviewWithUser } from "@/app/api/reviews/route"

export const metadata: Metadata = {
  title: "My Profile | PikiMed",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile")

  const userId = session.user.id

  // Fetch reviews written by this user
  const rawReviews = await prisma.review.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, image: true } } },
  })

  const reviews: ReviewWithUser[] = rawReviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  // Fetch saved providers
  const saved = await prisma.savedProvider.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: {
        select: {
          id: true, name: true, slug: true, specialty: true,
          city: true, avgRating: true, reviewCount: true,
        },
      },
      hospital: {
        select: {
          id: true, name: true, slug: true, type: true,
          city: true, avgRating: true, reviewCount: true,
        },
      },
    },
  })

  const user = {
    id:     session.user.id,
    name:   session.user.name   ?? null,
    email:  session.user.email  ?? null,
    image:  session.user.image  ?? null,
    region: (session.user as { region?: string }).region ?? null,
    role:   (session.user as { role?: string }).role     ?? null,
  }

  const savedSerialized = saved.map((s) => ({
    id:        s.id,
    createdAt: s.createdAt.toISOString(),
    doctor:    s.doctor   ?? null,
    hospital:  s.hospital
      ? { ...s.hospital, type: s.hospital.type as string }
      : null,
  }))

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-6 pb-16">
      <ProfileClient user={user} reviews={reviews} saved={savedSerialized} />
    </main>
  )
}
