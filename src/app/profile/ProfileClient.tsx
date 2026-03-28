"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import {
  User, Bookmark, Settings, Star, Trash2, Pencil, Check, X,
  LogOut, AlertTriangle, MapPin, Building2, Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReviewWithUser } from "@/app/api/reviews/route"

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "reviews" | "saved" | "settings"

interface SavedEntry {
  id:         string
  createdAt:  string
  doctor?:    { id: string; name: string; slug: string; specialty: string; city: string; avgRating: number | null; reviewCount: number } | null
  hospital?:  { id: string; name: string; slug: string; type: string; city: string; avgRating: number | null; reviewCount: number } | null
}

interface ProfileClientProps {
  user: {
    id:     string
    name:   string | null
    email:  string | null
    image:  string | null
    region: string | null
    role:   string | null
  }
  reviews: ReviewWithUser[]
  saved:   SavedEntry[]
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfileClient({ user, reviews: initialReviews, saved: initialSaved }: ProfileClientProps) {
  const [tab, setTab]       = useState<Tab>("reviews")
  const [reviews, setReviews] = useState(initialReviews)
  const [saved, setSaved]   = useState(initialSaved)

  const TABS = [
    { id: "reviews"  as Tab, label: "My Reviews",       icon: Star      },
    { id: "saved"    as Tab, label: "Saved",            icon: Bookmark  },
    { id: "settings" as Tab, label: "Settings",         icon: Settings  },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? ""}
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <div className="size-16 rounded-full bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] font-bold text-xl">
            {(user.name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user.name ?? "User"}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
          {user.region && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <MapPin className="size-3" />
              {user.region === "BD" ? "Bangladesh" : "United States"}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-[#06B6D4] text-[#06B6D4]"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            <Icon className="size-4" />
            {label}
            {id === "reviews" && reviews.length > 0 && (
              <span className="ml-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-1.5 py-0.5 text-slate-500">
                {reviews.length}
              </span>
            )}
            {id === "saved" && saved.length > 0 && (
              <span className="ml-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-1.5 py-0.5 text-slate-500">
                {saved.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "reviews" && (
        <ReviewsTab reviews={reviews} setReviews={setReviews} userId={user.id} />
      )}
      {tab === "saved" && (
        <SavedTab saved={saved} setSaved={setSaved} />
      )}
      {tab === "settings" && (
        <SettingsTab user={user} />
      )}
    </div>
  )
}

// ── Reviews tab ───────────────────────────────────────────────────────────────

function ReviewsTab({
  reviews,
  setReviews,
  userId,
}: {
  reviews: ReviewWithUser[]
  setReviews: React.Dispatch<React.SetStateAction<ReviewWithUser[]>>
  userId: string
}) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg width="100" height="88" viewBox="0 0 100 88" fill="none" aria-hidden="true" className="mb-4">
          <circle cx="50" cy="44" r="34" fill="#06B6D4" fillOpacity="0.07" />
          <rect x="28" y="24" width="44" height="40" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M50 36 L52.4 42.8 L59.5 42.8 L53.8 47.1 L56.1 54 L50 49.7 L43.9 54 L46.2 47.1 L40.5 42.8 L47.6 42.8 Z" fill="#E2E8F0" />
        </svg>
        <p className="font-medium text-slate-600 dark:text-slate-300">No reviews yet</p>
        <p className="text-sm mt-1 text-slate-400">Reviews you write will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} setReviews={setReviews} />
      ))}
    </div>
  )
}

function ReviewRow({
  review,
  setReviews,
}: {
  review: ReviewWithUser
  setReviews: React.Dispatch<React.SetStateAction<ReviewWithUser[]>>
}) {
  const [editing, setEditing]     = useState(false)
  const [body, setBody]           = useState(review.body ?? "")
  const [rating, setRating]       = useState(review.overallRating)
  const [saving, startSave]       = useTransition()
  const [deleting, startDelete]   = useTransition()
  const [error, setError]         = useState("")

  const handleSave = () => {
    startSave(async () => {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ overallRating: rating, body }),
      })
      if (res.ok) {
        const updated = await res.json()
        setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, ...updated } : r))
        setEditing(false)
      } else {
        const d = await res.json()
        setError(d.error ?? "Save failed")
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("Delete this review?")) return
    startDelete(async () => {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" })
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== review.id))
      }
    })
  }

  const targetLabel = review.doctorId ? "Doctor" : "Hospital"
  const date = new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full px-2 py-0.5">{targetLabel}</span>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors"
              title="Edit review"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Delete review"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Rating stars */}
      {editing ? (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Star
                className={cn(
                  "size-5 transition-colors",
                  s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600",
                )}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "size-4",
                s <= review.overallRating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700",
              )}
            />
          ))}
        </div>
      )}

      {/* Body */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium bg-[#06B6D4] text-white px-3 py-1.5 rounded-lg hover:bg-[#0E7490] transition-colors disabled:opacity-50"
            >
              <Check className="size-3.5" />
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setError(""); setBody(review.body ?? ""); setRating(review.overallRating) }}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        review.body && <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{review.body}</p>
      )}
    </div>
  )
}

// ── Saved tab ──────────────────────────────────────────────────────────────────

function SavedTab({
  saved,
  setSaved,
}: {
  saved: SavedEntry[]
  setSaved: React.Dispatch<React.SetStateAction<SavedEntry[]>>
}) {
  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg width="100" height="88" viewBox="0 0 100 88" fill="none" aria-hidden="true" className="mb-4">
          <circle cx="50" cy="44" r="34" fill="#06B6D4" fillOpacity="0.07" />
          <path d="M38 28 L62 28 L62 62 L50 54 L38 62 Z" fill="white" stroke="#E2E8F0" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <p className="font-medium text-slate-600 dark:text-slate-300">No saved providers</p>
        <p className="text-sm mt-1 text-slate-400">Bookmark doctors and hospitals to find them here.</p>
      </div>
    )
  }

  const unsave = async (entry: SavedEntry) => {
    const body = entry.doctor
      ? { doctorId: entry.doctor.id }
      : { hospitalId: entry.hospital!.id }

    const res = await fetch("/api/saved", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    if (res.ok) {
      setSaved((prev) => prev.filter((s) => s.id !== entry.id))
    }
  }

  return (
    <div className="space-y-3">
      {saved.map((entry) => {
        if (entry.doctor) {
          const d = entry.doctor
          return (
            <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex-shrink-0 flex size-10 items-center justify-center rounded-xl bg-[#06B6D4]/10">
                <Stethoscope className="size-5 text-[#06B6D4]" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/doctors/${d.slug}`} className="font-semibold text-slate-800 dark:text-slate-100 hover:text-[#06B6D4] transition-colors truncate block">
                  {d.name}
                </Link>
                <p className="text-xs text-slate-500 truncate">{d.specialty} · {d.city}</p>
                {d.avgRating != null && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {d.avgRating.toFixed(1)} ({d.reviewCount})
                  </span>
                )}
              </div>
              <button
                onClick={() => unsave(entry)}
                className="flex-shrink-0 p-1.5 rounded-lg text-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 transition-colors"
                title="Remove from saved"
              >
                <Bookmark className="size-4 fill-current" />
              </button>
            </div>
          )
        }

        if (entry.hospital) {
          const h = entry.hospital
          return (
            <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex-shrink-0 flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Building2 className="size-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/hospitals/${h.slug}`} className="font-semibold text-slate-800 dark:text-slate-100 hover:text-[#06B6D4] transition-colors truncate block">
                  {h.name}
                </Link>
                <p className="text-xs text-slate-500 truncate">{h.type} · {h.city}</p>
                {h.avgRating != null && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {h.avgRating.toFixed(1)} ({h.reviewCount})
                  </span>
                )}
              </div>
              <button
                onClick={() => unsave(entry)}
                className="flex-shrink-0 p-1.5 rounded-lg text-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 transition-colors"
                title="Remove from saved"
              >
                <Bookmark className="size-4 fill-current" />
              </button>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// ── Settings tab ───────────────────────────────────────────────────────────────

function SettingsTab({ user }: { user: ProfileClientProps["user"] }) {
  const router                    = useRouter()
  const [confirm, setConfirm]     = useState(false)
  const [deleting, startDelete]   = useTransition()
  const [deleteError, setDeleteError] = useState("")

  const handleDeleteAccount = () => {
    startDelete(async () => {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (res.ok) {
        await signOut({ callbackUrl: "/" })
      } else {
        setDeleteError("Failed to delete account. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Region */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MapPin className="size-4 text-[#06B6D4]" />
          Region
        </h2>
        <p className="text-sm text-slate-500">
          Currently set to <strong>{user.region === "BD" ? "Bangladesh 🇧🇩" : "United States 🇺🇸"}</strong>.
          To change your region, sign out and select a different region on the sign-in page.
        </p>
        <div className="flex gap-2">
          <Link
            href="/bd"
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              user.region === "BD"
                ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#06B6D4]/40",
            )}
          >
            🇧🇩 Bangladesh
          </Link>
          <Link
            href="/us"
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              user.region === "US"
                ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#06B6D4]/40",
            )}
          >
            🇺🇸 United States
          </Link>
        </div>
      </section>

      {/* Sign out */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <LogOut className="size-4 text-slate-500" />
          Sign Out
        </h2>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
        >
          Sign out of PikiMed
        </button>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-red-600 flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Danger Zone
        </h2>
        <p className="text-sm text-slate-500">
          Deleting your account is permanent. All reviews, saved providers, and personal data will be removed.
        </p>
        {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete permanently"}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
