"use client"

import { useState, useCallback } from "react"
import { useSession }      from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageCircle, Send, Loader2, Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface QAPost {
  id:        string
  userName:  string
  text:      string
  createdAt: string   // ISO string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)    return "just now"
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchPosts(slug: string): Promise<QAPost[]> {
  const res = await fetch(`/api/doctors/${slug}/qa`)
  if (!res.ok) throw new Error("Failed to load")
  return res.json()
}

async function submitPost(slug: string, text: string): Promise<QAPost> {
  const res = await fetch(`/api/doctors/${slug}/qa`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text }),
  })
  if (res.status === 401) throw new Error("Sign in to post")
  if (res.status === 429) throw new Error("You've posted recently. Try again later.")
  if (!res.ok)            throw new Error("Failed to post")
  return res.json()
}

// ── Post card ──────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: QAPost }) {
  const initials = post.userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "?")
    .join("")
    .toUpperCase()

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#06B6D4]/20 flex items-center justify-center text-xs font-bold text-[#06B6D4]">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {post.userName}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="size-3" />
            {timeAgo(post.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {post.text}
        </p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const MAX_CHARS   = 280
const SHOW_LIMIT  = 5

interface PatientQAProps {
  doctorSlug: string
}

export default function PatientQA({ doctorSlug }: PatientQAProps) {
  const { data: session } = useSession()
  const queryClient       = useQueryClient()

  const [text,     setText]     = useState("")
  const [showAll,  setShowAll]  = useState(false)
  const [postError, setPostError] = useState("")

  const { data: posts = [], isFetching } = useQuery({
    queryKey:  ["qa", doctorSlug],
    queryFn:   () => fetchPosts(doctorSlug),
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: (t: string) => submitPost(doctorSlug, t),
    onSuccess:  (newPost) => {
      queryClient.setQueryData<QAPost[]>(["qa", doctorSlug], (old = []) => [newPost, ...old])
      setText("")
      setPostError("")
    },
    onError: (e: Error) => {
      setPostError(e.message)
    },
  })

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 5) { setPostError("Write at least 5 characters."); return }
    if (trimmed.length > MAX_CHARS)     { setPostError(`Max ${MAX_CHARS} characters.`);   return }
    setPostError("")
    mutation.mutate(trimmed)
  }, [text, mutation])

  const visible = showAll ? posts : posts.slice(0, SHOW_LIMIT)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="size-4 text-[#06B6D4]" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Has anyone visited recently?
        </h3>
        {posts.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] text-[10px] font-bold">
            {posts.length}
          </span>
        )}
      </div>

      {/* Post input */}
      {session?.user ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit()
            }}
            rows={3}
            placeholder="Share your experience… Did the doctor see patients today? How was the wait?"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span className={cn(
              "text-[10px] tabular-nums",
              text.length > MAX_CHARS
                ? "text-rose-500 font-semibold"
                : text.length > MAX_CHARS * 0.8
                ? "text-amber-500"
                : "text-slate-400",
            )}>
              {text.length} / {MAX_CHARS}
            </span>
            <div className="flex items-center gap-2">
              {postError && (
                <p className="text-xs text-rose-600">{postError}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending || !text.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-xs font-bold hover:bg-[#0E7490] transition-colors disabled:opacity-50"
              >
                {mutation.isPending
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Send className="size-3.5" />}
                Post
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Ctrl+Enter to post · Be respectful &amp; factual</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <a href="/auth/signin" className="text-[#06B6D4] font-semibold hover:underline">Sign in</a>
            {" "}to share a recent visit update.
          </p>
        </div>
      )}

      {/* Posts list */}
      {isFetching && posts.length === 0 && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isFetching && posts.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No updates yet — be the first to share!
          </p>
        </div>
      )}

      {visible.length > 0 && (
        <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((post, i) => (
            <div key={post.id} className={cn(i > 0 && "pt-4")}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {/* Show more */}
      {posts.length > SHOW_LIMIT && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-[#06B6D4] transition-colors"
        >
          <ChevronDown className="size-4" />
          Show {posts.length - SHOW_LIMIT} more update{posts.length - SHOW_LIMIT !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  )
}
