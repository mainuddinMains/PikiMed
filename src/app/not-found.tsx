import Link from "next/link"
import PikiMedLogo from "@/components/PikiMedLogo"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <Link href="/" aria-label="Go to PikiMed home">
        <PikiMedLogo size="md" />
      </Link>

      {/* Illustration */}
      <div className="mt-10 mb-6" aria-hidden="true">
        <svg
          width="160"
          height="120"
          viewBox="0 0 160 120"
          fill="none"
          className="mx-auto"
          role="img"
          aria-label="404 illustration"
        >
          {/* Background circle */}
          <circle cx="80" cy="65" r="50" fill="#06B6D4" fillOpacity="0.08" />
          {/* Document */}
          <rect x="52" y="28" width="56" height="72" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
          {/* Lines */}
          <rect x="62" y="44" width="36" height="4" rx="2" fill="#CBD5E1" />
          <rect x="62" y="54" width="28" height="4" rx="2" fill="#CBD5E1" />
          <rect x="62" y="64" width="32" height="4" rx="2" fill="#CBD5E1" />
          {/* Sad face */}
          <circle cx="80" cy="80" r="14" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="75.5" cy="77" r="1.5" fill="#94A3B8" />
          <circle cx="84.5" cy="77" r="1.5" fill="#94A3B8" />
          <path d="M75 84 Q80 80 85 84" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* 404 text hint */}
          <text x="80" y="18" textAnchor="middle" fill="#06B6D4" fontSize="14" fontWeight="700" fontFamily="system-ui">404</text>
        </svg>
      </div>

      {/* Copy */}
      <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0E7490] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2"
        >
          Go home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2"
        >
          Search providers
        </Link>
      </div>
    </div>
  )
}
