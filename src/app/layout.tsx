import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"
import Providers from "@/components/Providers"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

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
  openGraph: {
    siteName: "PikiMed",
    type: "website",
    locale: "en_US",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#020817" },
  ],
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

          {/* Page content — offset by navbar height */}
          <main className="flex-1 pt-16">
            {children}
          </main>

          <Footer />
        </Providers>
      </body>
    </html>
  )
}
