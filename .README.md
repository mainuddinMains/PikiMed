# PikiMed

**The smarter way to find care.**

PikiMed is a Next.js 14 healthcare platform that helps patients find and book medical care providers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth v5 + Google OAuth |
| State | Zustand + TanStack Query |
| Maps | Mapbox GL |
| Validation | Zod |

---

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database (local or hosted)

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd pikimed
npm install
```

### 2. Configure environment variables

Edit `.env.local` and fill in your values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your app (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `MAPBOX_TOKEN` | Mapbox public token |

### 3. Set up the database

```bash
# Push schema to your database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── health/        # GET /api/health
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                # shadcn/ui components
└── lib/
    └── utils.ts
prisma/
└── schema.prisma          # Database schema
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma db push` | Sync schema to database |
| `npx prisma migrate dev` | Create & apply migration |

---

## API Routes

### `GET /api/health`

Health check endpoint.

```json
{
  "status": "ok",
  "version": "1.0.0",
  "app": "PikiMed",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary (Cyan) | `#06B6D4` | Buttons, links, highlights |
| Dark (Teal) | `#0E7490` | Headers, dark surfaces |
| Accent (Green) | `#1D9E75` | Success states, badges |
| Slate | `#1E293B` | Sidebar, dark backgrounds |

---

## Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret into `.env.local`

---

## License

Private — PikiMed © 2024
