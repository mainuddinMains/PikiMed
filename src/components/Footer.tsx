import Link from "next/link"
import PikiMedLogo from "@/components/PikiMedLogo"

const BD_FEATURES = [
  "Find Doctors by Specialty",
  "BMDC-Verified Profiles",
  "Chamber Schedules & Wait Times",
  "BDT Fee Transparency",
  "Hospital Finder (DMCH, Square, BIRDEM…)",
  "Emergency Contacts by District",
]

const US_FEATURES = [
  "Insurance Network Search",
  "NPI-Verified Providers",
  "Procedure Cost Estimates",
  "FQHC & Free Clinic Locator",
  "Appointment Availability",
  "Multilingual Provider Search",
]

const LEGAL_LINKS = [
  { href: "/about",   label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms",   label: "Terms" },
  { href: "/contact", label: "Contact" },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

          {/* Brand column */}
          <div className="space-y-4">
            <PikiMedLogo size="md" />
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The smarter way to find healthcare — connecting patients with verified
              providers across Bangladesh and the United States.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600">
              Built with care for better health outcomes.
            </p>
          </div>

          {/* Bangladesh features */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span aria-hidden="true">🇧🇩</span>
              Bangladesh
            </h3>
            <ul className="space-y-2.5">
              {BD_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 size-1.5 flex-shrink-0 rounded-full bg-[#06B6D4]"
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* US features */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span aria-hidden="true">🇺🇸</span>
              United States
            </h3>
            <ul className="space-y-2.5">
              {US_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 size-1.5 flex-shrink-0 rounded-full bg-[#1D9E75]"
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100 dark:border-slate-800/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:flex-row lg:px-8">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2025 PikiMed. All rights reserved.
          </p>
          <nav aria-label="Legal links" className="flex items-center gap-5">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
