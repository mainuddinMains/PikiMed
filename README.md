# PikiMed

Healthcare intelligence for Bangladesh and the United States.

Find verified doctors, hospitals, insurance plans, cost estimates, and emergency helplines — fast, simple, and stress-free.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL via Prisma 7 |
| Auth | NextAuth v5 (beta) + Google OAuth |
| State | Zustand 5 |
| Data fetching | TanStack Query v5 |
| Maps | Mapbox GL JS 3 |
| Charts | Recharts |
| Validation | Zod 4 |
| UI primitives | Base UI (Radix-compatible) |
| Toast | react-hot-toast |
| Fonts | Geist (local) |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or a hosted instance such as Neon, Supabase, or Railway)
- A Google OAuth app (for sign-in)
- A Mapbox account (for maps)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/pikimed.git
cd pikimed
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in every value (see [Environment Variables](#environment-variables) below).

### 4. Push the database schema

```bash
npx prisma db push
```

This creates all tables without generating a migration file — suitable for a fresh database.

### 5. Seed initial data

```bash
npx prisma db seed
```

This creates:
- Sample doctors (BD + US)
- Sample hospitals (BD + US)
- Sample reviews
- Admin user: `admin@pikimed.com` (role: `ADMIN`)

> The admin account has no password — sign in via Google OAuth and the role is set automatically when the email matches.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

All variables are listed in `.env.example`. Below is a full explanation of each.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use `postgresql://` for direct connections, `prisma+postgres://` for Prisma Accelerate. |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte secret for signing JWTs. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | Full URL of the deployment, e.g. `https://pikimed.com`. Omit in Vercel (auto-set). |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 client ID from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 client secret from Google Cloud Console. |
| `MAPBOX_TOKEN` | Yes | Server-side Mapbox token. Not exposed to the browser. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Client-side Mapbox token. Exposed to the browser — restrict by URL in Mapbox dashboard. |
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL used for canonical links and OG metadata. |

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://pikimed.com/api/auth/callback/google` (prod)

---

## Folder Structure

```
pikimed/
├── prisma/
│   ├── schema.prisma        # Database schema (models, enums, relations)
│   └── seed.ts              # Seed script
├── public/
│   ├── manifest.json        # PWA manifest
│   └── robots.txt           # Search engine crawl rules
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard (ADMIN role required)
│   │   │   ├── _components/ # Shared modal, field, form primitives
│   │   │   ├── doctors/     # Doctor management table
│   │   │   ├── hospitals/   # Hospital management table
│   │   │   ├── reviews/     # Review moderation table
│   │   │   ├── actions.ts   # Server actions (CRUD + requireAdmin guard)
│   │   │   ├── layout.tsx   # Admin sidebar layout
│   │   │   └── page.tsx     # Dashboard metrics
│   │   ├── api/             # API route handlers
│   │   │   ├── account/     # DELETE /api/account
│   │   │   ├── auth/        # NextAuth handler
│   │   │   ├── clinics/     # Free care clinic lookup
│   │   │   ├── costs/       # Cost data
│   │   │   ├── doctors/     # Doctor CRUD + availability + Q&A
│   │   │   ├── health/      # Health check
│   │   │   ├── hospitals/   # Hospital CRUD
│   │   │   ├── insurance/   # Plans + in-network hospitals
│   │   │   ├── reviews/     # Reviews CRUD + helpful votes
│   │   │   ├── saved/       # Saved providers toggle
│   │   │   └── search/      # Unified doctor + hospital search
│   │   ├── bd/              # Bangladesh-specific pages (cost, free-care)
│   │   ├── doctor/[slug]/   # Doctor detail page
│   │   ├── hospital/[slug]/ # Hospital detail page
│   │   ├── profile/         # User profile (reviews, saved, settings)
│   │   ├── search/          # Search page
│   │   ├── us/              # US-specific pages (insurance, cost-estimator, free-care)
│   │   ├── error.tsx        # Global error boundary
│   │   ├── globals.css      # Tailwind base + custom utilities
│   │   ├── layout.tsx       # Root layout (Navbar, BottomNav, Footer, Providers)
│   │   ├── not-found.tsx    # 404 page
│   │   ├── page.tsx         # Homepage (region-aware: BD or US)
│   │   └── sitemap.ts       # Auto-generated sitemap from DB
│   ├── components/
│   │   ├── detail/          # Doctor/hospital detail sub-components (MiniMap, StarRating)
│   │   ├── free-care/       # Free care finder wizard
│   │   ├── home/            # Homepage components (BDHome, USHome, DoctorRow, etc.)
│   │   ├── insurance/       # Insurance wizard steps
│   │   ├── search/          # Search page components (ResultCard, FilterSidebar, MapView)
│   │   ├── ui/              # Base UI primitives
│   │   ├── BottomNav.tsx    # Mobile bottom navigation bar
│   │   ├── Navbar.tsx       # Site navbar with mobile drawer
│   │   ├── Providers.tsx    # QueryClient, SessionProvider, ThemeProvider, Toaster
│   │   ├── ReviewForm.tsx   # Multi-category star review submission form
│   │   ├── ReviewsWidget.tsx# Paginated, sortable reviews list
│   │   └── SaveButton.tsx   # Bookmark toggle button
│   ├── lib/
│   │   ├── apiError.ts      # Typed { error, code } API error helper
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── rateLimit.ts     # In-memory sliding window rate limiter
│   │   ├── recalcRating.ts  # Review aggregate recalculation
│   │   ├── region.ts        # Zustand region store + hydration hook
│   │   └── utils.ts         # cn() and other shared utilities
│   ├── store/
│   │   └── regionStore.ts   # Zustand store definition
│   ├── auth.ts              # NextAuth configuration
│   └── middleware.ts        # Route protection (profile, admin)
├── .env.example             # Environment variable template
├── CHANGELOG.md
├── vercel.json              # Vercel deployment config
└── package.json
```

---

## Adding a Doctor or Hospital

### Via the Admin Panel

1. Sign in with `admin@pikimed.com` (Google OAuth).
2. Navigate to `/admin`.
3. Go to **Doctors** or **Hospitals** in the sidebar.
4. Click **Add Doctor** / **Add Hospital**.
5. Fill in the form. Required fields are marked.
6. Click **Save**. The record appears in the table immediately.

A URL slug is auto-generated from the name with a random 4-character suffix to avoid collisions.

### Via the Seed Script

Add an entry to `prisma/seed.ts` and re-run:

```bash
npx prisma db seed
```

The seed uses `upsert` so existing records are updated rather than duplicated.

---

## Deployment on Vercel

### 1. Import the repository

Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.

### 2. Set environment variables

In the Vercel project settings → Environment Variables, add all variables from `.env.example` with real values.

> `NEXTAUTH_URL` is not needed on Vercel — it auto-sets `VERCEL_URL`. NextAuth v5 detects this automatically.

### 3. Configure the database

Use a Postgres provider that supports connection pooling for serverless:
- **Neon** (recommended) — enable connection pooling, use the pooler URL
- **Supabase** — use the transaction pooler URL (port 6543)
- **Railway** — works out of the box

For Prisma Accelerate (optional, for edge caching), replace `postgresql://` with `prisma+postgres://` in `DATABASE_URL`.

### 4. Deploy

Click **Deploy**. Vercel runs `prisma generate && next build` automatically (configured in `vercel.json`).

### 5. Run migrations on first deploy

After the first successful deploy, run the seed via Vercel's CLI or a one-off job:

```bash
npx vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

### Custom domain

Add your domain in Vercel → Domains. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to match.

### Cron for sitemap revalidation

The sitemap revalidates every hour via Next.js ISR (`export const revalidate = 3600` in `src/app/sitemap.ts`). No additional cron setup is needed.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio (DB browser) |
| `npx prisma db push` | Push schema changes to DB |
| `npx prisma db seed` | Seed the database |
| `npx tsc --noEmit` | TypeScript type check only |
