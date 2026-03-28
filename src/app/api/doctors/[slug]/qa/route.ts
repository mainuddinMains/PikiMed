import { NextRequest, NextResponse } from "next/server"
import { auth }         from "@/auth"
import { getClientIp }  from "@/lib/rateLimit"
import { z }            from "zod"

// ── In-memory store ────────────────────────────────────────────────────────────
// Resets on server restart. Replace with a DB model for production.

export interface QAPost {
  id:        string
  userId:    string
  userName:  string
  text:      string
  createdAt: string
}

const store = new Map<string, QAPost[]>()   // key: doctorSlug

// Per-user rate limit: 1 post per 5 minutes per doctor
const POST_WINDOW_MS = 5 * 60 * 1000
const postRateStore  = new Map<string, number>()

function checkPostRateLimit(userId: string, slug: string): boolean {
  const key = `${userId}:${slug}`
  const now  = Date.now()
  const last = postRateStore.get(key)
  if (last && now - last < POST_WINDOW_MS) return false
  postRateStore.set(key, now)
  return true
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const posts = (store.get(params.slug) ?? []).slice(0, 50)
  return NextResponse.json(posts)
}

// ── POST ───────────────────────────────────────────────────────────────────────

const PostSchema = z.object({
  text: z.string().trim().min(5).max(280),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!checkPostRateLimit(session.user.id, params.slug)) {
    return NextResponse.json({ error: "Please wait a few minutes before posting again." }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const post: QAPost = {
    id:        crypto.randomUUID(),
    userId:    session.user.id,
    userName:  session.user.name ?? "Anonymous",
    text:      parsed.data.text,
    createdAt: new Date().toISOString(),
  }

  const existing = store.get(params.slug) ?? []
  store.set(params.slug, [post, ...existing].slice(0, 100))   // cap at 100

  return NextResponse.json(post, { status: 201 })
}
