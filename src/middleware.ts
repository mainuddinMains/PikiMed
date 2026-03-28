import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // ── /profile — requires any authenticated session ──────────────────────────
  if (pathname.startsWith("/profile")) {
    if (!req.auth) {
      const signIn = new URL("/auth/signin", req.url)
      signIn.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signIn)
    }
  }

  // ── /admin — requires ADMIN role ───────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const signIn = new URL("/auth/signin", req.url)
      signIn.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signIn)
    }
    const role = (req.auth.user as { role?: string } | undefined)?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/?error=unauthorized", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*"],
}
