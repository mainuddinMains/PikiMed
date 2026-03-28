import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Google  from "next-auth/providers/google"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// ── Config ────────────────────────────────────────────────────────────────────

export const authConfig = {
  // ── Adapter: persists users/sessions/accounts to Postgres via Prisma ────────
  adapter: PrismaAdapter(prisma),

  // ── JWT strategy: keeps session data in a signed cookie, not the DB ─────────
  // This lets us embed region/role into the token so every request has them
  // without a DB round-trip.
  session: { strategy: "jwt" },

  // ── Providers ────────────────────────────────────────────────────────────────
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request the user's profile & email so we can persist them
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
      },
    }),

    // Magic-link email (requires EMAIL_SERVER + EMAIL_FROM in .env)
    // If not configured the provider is still registered but sending will fail
    // gracefully until real SMTP credentials are supplied.
    Nodemailer({
      server: process.env.EMAIL_SERVER ?? {
        host:   process.env.EMAIL_SERVER_HOST   ?? "smtp.ethereal.email",
        port:   Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER ?? "",
          pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
        },
      },
      from: process.env.EMAIL_FROM ?? "PikiMed <noreply@pikimed.com>",
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    // jwt fires on sign-in/sign-up and whenever the session is accessed.
    // We embed region + role so the session callback can expose them without
    // hitting the database on every request.
    async jwt({ token, user, trigger, session: updatePayload }) {
      if (user) {
        // First sign-in: pull region/role from the Prisma User record
        token.id     = user.id
        token.region = (user.region as "BD" | "US" | null) ?? null
        token.role   = (user.role   as "USER" | "ADMIN")   ?? "USER"
      }

      // Client called `update({ region })` to persist a newly-selected region
      if (trigger === "update" && updatePayload?.region) {
        const newRegion = updatePayload.region as "BD" | "US"
        token.region = newRegion
        // Persist to the User table as well
        if (token.sub) {
          await prisma.user.update({
            where: { id: token.sub },
            data:  { region: newRegion },
          })
        }
      }

      return token
    },

    // session is called whenever the client reads the session. We forward the
    // custom fields we embedded in the JWT.
    async session({ session, token }) {
      session.user.id     = token.sub!
      session.user.region = (token.region as "BD" | "US" | null) ?? null
      session.user.role   = (token.role   as "USER" | "ADMIN")   ?? "USER"
      return session
    },

    // redirect keeps the user on the same origin after sign-in / sign-out.
    // The RegionSelectorModal handles first-visit region prompting client-side.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/"))             return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  // ── Custom auth pages ────────────────────────────────────────────────────────
  // These routes don't exist yet — they're placeholders for future pages.
  pages: {
    signIn:        "/auth/signin",
    verifyRequest: "/auth/verify",
    error:         "/auth/error",
  },

  // ── Events (side-effects, no return values) ──────────────────────────────────
  events: {
    async createUser({ user }) {
      // Log new registrations; add analytics/welcome-email hooks here
      console.log("[PikiMed] New user registered:", user.email)
    },
  },

  // Use AUTH_SECRET (or NEXTAUTH_SECRET for v4 compat)
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
