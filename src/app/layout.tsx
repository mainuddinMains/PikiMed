import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"
import Providers  from "@/components/Providers"
import Navbar     from "@/components/Navbar"
import Footer     from "@/components/Footer"
import BottomNav  from "@/components/BottomNav"

// ── Fonts ─────────────────────────────────────────────────────────────────────

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "PikiMed — The smarter way to find care.",
    template: "%s | PikiMed",
  },
  description:
    "Connect with verified healthcare providers across Bangladesh and the United States. " +
    "Find doctors, hospitals, insurance plans, and cost estimates — fast, simple, and stress-free.",
  keywords: ["doctor finder", "hospital search", "healthcare Bangladesh", "US healthcare", "insurance", "PikiMed"],
  authors: [{ name: "PikiMed" }],
  metadataBase: new URL("https://pikimed.com"),
  alternates: {
    canonical: "https://pikimed.com",
  },
  openGraph: {
    siteName: "PikiMed",
    type: "website",
    locale: "en_US",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06B6D4" },
    { media: "(prefers-color-scheme: dark)",  color: "#020817" },
  ],
  width:          "device-width",
  initialScale:   1,
  minimumScale:   1,
  viewportFit:    "cover",
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      // next-themes injects class="dark" here — suppress the mismatch warning
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          {/* Sticky navbar — 64px (h-16) tall */}
          <Navbar />

          {/* Page content — offset by navbar height, extra bottom pad for mobile bottom nav */}
          <main className="flex-1 pt-16 pb-16 md:pb-0">
            {children}
          </main>

          <Footer />

          {/* Mobile-only bottom navigation */}
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
