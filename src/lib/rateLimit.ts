/**
 * Sliding-window in-memory rate limiter.
 * Suitable for single-process deployments. For multi-instance, swap the
 * Map store for Redis / Upstash.
 */

const WINDOW_MS = 1_000  // 1 second
const MAX_REQS  = 10     // requests per window

// module-level store — survives across requests in the same process
const store = new Map<string, number[]>()

export function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now    = Date.now()
  const cutoff = now - WINDOW_MS
  const all    = store.get(ip) ?? []
  const fresh  = all.filter((t) => t > cutoff)

  // Probabilistic GC (~1% of calls) to prevent unbounded store growth
  if (Math.random() < 0.01) {
    Array.from(store.entries()).forEach(([key, ts]) => {
      const live = ts.filter((t: number) => t > cutoff)
      if (live.length === 0) store.delete(key)
      else store.set(key, live)
    })
  }

  if (fresh.length >= MAX_REQS) {
    store.set(ip, fresh)
    return { ok: false, remaining: 0 }
  }

  fresh.push(now)
  store.set(ip, fresh)
  return { ok: true, remaining: MAX_REQS - fresh.length }
}

/** Extract the real client IP from a Next.js request */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
