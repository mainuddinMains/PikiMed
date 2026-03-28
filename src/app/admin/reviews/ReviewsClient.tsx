"use client"

import { useState, useTransition } from "react"
import { Trash2, Search, CheckSquare, Square } from "lucide-react"
import toast from "react-hot-toast"
import { deleteReview, deleteReviews } from "@/app/admin/actions"

export type ReviewRow = {
  id:           string
  overallRating:number
  body:         string | null
  helpfulCount: number
  createdAt:    string
  user:         { name: string | null; email: string | null }
  doctor:       { name: string } | null
  hospital:     { name: string } | null
}

export default function ReviewsClient({ reviews: initial }: { reviews: ReviewRow[] }) {
  const [reviews,  setReviews]  = useState(initial)
  const [search,   setSearch]   = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending,  start]       = useTransition()

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.user.name?.toLowerCase().includes(q) ||
      r.user.email?.toLowerCase().includes(q) ||
      r.doctor?.name.toLowerCase().includes(q) ||
      r.hospital?.name.toLowerCase().includes(q) ||
      r.body?.toLowerCase().includes(q)
    )
  })

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((r) => r.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return
    start(async () => {
      try {
        await deleteReview(id)
        setReviews((prev) => prev.filter((r) => r.id !== id))
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
        toast.success("Review deleted")
      } catch {
        toast.error("Delete failed")
      }
    })
  }

  function handleBulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} review(s)? This cannot be undone.`)) return
    const ids = Array.from(selected)
    start(async () => {
      try {
        await deleteReviews(ids)
        setReviews((prev) => prev.filter((r) => !ids.includes(r.id)))
        setSelected(new Set())
        toast.success(`${ids.length} review(s) deleted`)
      } catch {
        toast.error("Bulk delete failed")
      }
    })
  }

  const Stars = ({ n }: { n: number }) => (
    <span className="text-amber-500 font-semibold text-sm">{"★".repeat(Math.round(n))}<span className="text-slate-300">{"★".repeat(5 - Math.round(n))}</span></span>
  )

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(new Set()) }}
            placeholder="Search reviews…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
          />
        </div>

        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={pending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* Stats */}
      <p className="text-xs text-slate-400 mb-3">
        {filtered.length} review{filtered.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-slate-600">
                    {allSelected ? <CheckSquare className="size-4 text-[#06B6D4]" /> : <Square className="size-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Reviewer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Provider</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Body</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Helpful</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`transition-colors ${selected.has(r.id) ? "bg-[#06B6D4]/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOne(r.id)} className="text-slate-400 hover:text-slate-600">
                      {selected.has(r.id)
                        ? <CheckSquare className="size-4 text-[#06B6D4]" />
                        : <Square className="size-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                      {r.user.name ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-[140px]">{r.user.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                    {r.doctor?.name ?? r.hospital?.name ?? "—"}
                    <span className="ml-1 text-xs text-slate-400">
                      {r.doctor ? "(doctor)" : r.hospital ? "(hospital)" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Stars n={r.overallRating} />
                    <p className="text-xs text-slate-400">{r.overallRating.toFixed(1)}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {r.body ? (
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-xs">{r.body}</p>
                    ) : (
                      <span className="text-slate-300 text-xs italic">No text</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-center">
                    {r.helpfulCount}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={pending}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Delete review"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {search ? "No reviews match your search" : "No reviews yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
