"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  {
    question: "What should I know before visiting?",
    answer:
      "Bring your NID or passport for registration. Most hospitals require a referral for specialist consultations. Private hospitals typically require cash or a deposit upfront. Arrive 20–30 minutes early for OPD appointments. Check if the doctor has chamber hours scheduled for today.",
  },
  {
    question: "How do hospital fees work in Bangladesh?",
    answer:
      "Government hospitals charge nominal fees (₳50–200 for OPD, ₳500–2000 for specialist consultations). Private hospitals vary widely — specialist consultations typically range from ৳800–3000. Diagnostic tests are priced separately. Always ask for a cost estimate before any procedure.",
  },
  {
    question: "Emergency Room (ER) vs OPD — which one?",
    answer:
      "Go to the ER for life-threatening emergencies: chest pain, stroke symptoms, severe accidents, or unconsciousness. OPD (Outpatient Department) is for scheduled appointments and non-urgent issues. Many hospitals have a 24-hour emergency wing even when the OPD is closed. Call ahead if unsure.",
  },
  {
    question: "What are chamber hours?",
    answer:
      "Chambers are private consultation slots that doctors hold outside of hospital hours — often in the evening (5–9 PM). Many doctors practice at multiple hospitals or private clinics. Chamber schedules change, so confirm via phone before visiting. PikiMed shows live chamber availability where reported.",
  },
] as const

export default function InfoAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {ITEMS.map((item, i) => {
        const isOpen = openIdx === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              aria-expanded={isOpen}
            >
              {item.question}
              <ChevronDown
                className={cn(
                  "size-4 text-slate-400 flex-shrink-0 ml-3 transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {item.answer}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
