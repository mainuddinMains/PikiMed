# Changelog

All notable changes to PikiMed are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-03-27

### Added

#### Core Platform
- Next.js 14 App Router project scaffold with TypeScript, Tailwind CSS, and Geist font
- Prisma 7 schema: `User`, `Doctor`, `Hospital`, `Review`, `SavedProvider`, `Account`, `Session`, `VerificationToken`
- Region-aware architecture supporting Bangladesh (BD) and United States (US)
- Zustand region store with localStorage persistence and SSR hydration guard

#### Authentication
- NextAuth v5 (beta) with Google OAuth provider and `@auth/prisma-adapter`
- Region + role selection flow on first sign-in
- Middleware protecting `/profile` and `/admin` routes
- Admin seed user (`admin@pikimed.com`, role: `ADMIN`)

#### Homepage
- BD homepage: hero search, doctor horizontal scroll row, nearby hospitals map, emergency helpline strip
- US homepage: hero search, quick links (insurance, free care, cost estimator), doctor row
- `RegionSelectorModal` shown on first visit if no region stored

#### Search
- Full-text search across doctors and hospitals with infinite scroll
- Filters: type, specialty, city, min rating, max fee, available today
- Sort: relevance, rating, price (asc/desc), distance (client-side Haversine)
- Map view via Mapbox GL with distance-sorted pins
- Bottom-sheet filter drawer on mobile

#### Doctor & Hospital Detail Pages
- Rich detail pages with stats, ratings, availability, chamber schedule, patient Q&A
- Mapbox mini-map with multi-location pins
- Reviews widget (paginated, sortable, with helpfulness votes)
- Review form with per-category star ratings
- SaveButton for bookmarking (authenticated users only)
- ISR with `revalidate = 3600`

#### Profile Page
- Three-tab layout: My Reviews, Saved Providers, Settings
- Inline review editing (rating + body) and delete
- Saved providers list with unsave action
- Region display, sign-out, and account deletion (danger zone)

#### Admin Dashboard
- Protected by `role === "ADMIN"` in middleware and server-side layout guard
- Dashboard: metric cards (doctors, hospitals, users, reviews), recent activity panels
- Doctors table: searchable, add/edit/delete, `isAvailableToday` toggle
- Hospitals table: searchable, add/edit/delete, type badge
- Reviews table: per-row delete, bulk select + bulk delete

#### Region Features (BD)
- Cost estimator: service cost lookup by hospital category
- Free care finder: DGDA-licensed free/subsidised clinic locator with map
- Emergency strip: expandable helpline numbers (999, 16430, 10655, etc.)

#### Region Features (US)
- Insurance wizard: Step 1 coverage overview → Step 2 in-network hospital finder
- Insurance recommender: questionnaire-based plan recommender
- Cost estimator with CPT-code lookup and insurance discount calculation
- Free care finder: FQHC locator with map

#### API Routes
- `GET/POST /api/reviews` — paginated reviews, create review
- `GET/PATCH/DELETE /api/reviews/[id]` — single review management
- `POST /api/reviews/[id]/helpful` — helpfulness vote
- `GET /api/doctors` — paginated doctor list with filters
- `GET /api/doctors/[slug]` — single doctor
- `POST /api/doctors/[slug]/availability` — availability toggle (rate-limited)
- `GET/POST /api/doctors/[slug]/qa` — patient Q&A
- `GET /api/hospitals` — paginated hospital list
- `GET /api/hospitals/[slug]` — single hospital
- `GET /api/search` — unified doctor + hospital search
- `GET/POST /api/saved` — saved providers toggle
- `GET /api/insurance/plans` — insurance plans
- `GET /api/insurance/hospitals` — in-network hospitals
- `GET /api/costs` — cost data lookup
- `GET /api/clinics` — free care clinic lookup
- `DELETE /api/account` — account deletion
- `GET /api/health` — health check endpoint

#### SEO & Performance
- Dynamic metadata with OG tags on doctor/hospital detail pages
- Canonical URLs on all key pages
- `robots.txt` blocking `/admin`, `/api`, `/auth`
- Auto-generated `sitemap.xml` from DB slugs (ISR hourly)
- `app/not-found.tsx` — friendly 404 with SVG illustration
- `app/error.tsx` — global error boundary with retry

#### Mobile & PWA
- Fully responsive layout (mobile-first breakpoints)
- Bottom navigation bar (Home, Search, Hospitals, Emergency/Insurance, Profile)
- PWA manifest with `display: standalone`, theme color, shortcuts
- Safe-area inset padding for iPhone home bar
- Snap-scroll doctor row cards

#### Shared Libraries
- `src/lib/apiError.ts` — typed `{ error, code }` API error helper
- `src/lib/recalcRating.ts` — shared review aggregate recalculation
- `src/lib/rateLimit.ts` — in-memory sliding window rate limiter
- `src/lib/region.ts` — Zustand region store + hydration hook

---

[1.0.0]: https://github.com/your-org/pikimed/releases/tag/v1.0.0
