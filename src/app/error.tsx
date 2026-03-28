"use client"

import { useEffect } from "react"
import Link from "next/link"
import PikiMedLogo from "@/components/PikiMedLogo"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
          aria-label="Error illustration"
        >
          {/* Background circle */}
          <circle cx="80" cy="65" r="50" fill="#EF4444" fillOpacity="0.06" />
          {/* Shield */}
          <path
            d="M80 22 L104 32 L104 58 C104 74 92 86 80 90 C68 86 56 74 56 58 L56 32 Z"
            fill="white"
            stroke="#E2E8F0"
            strokeWidth="2"
          />
          {/* X mark */}
          <path d="M72 50 L88 66" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 50 L72 66" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          {/* Exclamation label */}
          <text x="80" y="18" textAnchor="middle" fill="#EF4444" fontSize="13" fontWeight="700" fontFamily="system-ui">
            Error
          </text>
        </svg>
      </div>

      {/* Copy */}
      <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm">
        An unexpected error occurred. You can try again or return to the home page.
      </p>

      {/* Dev error detail */}
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className="mt-4 max-w-md text-left text-xs bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 overflow-x-auto">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0E7490] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
