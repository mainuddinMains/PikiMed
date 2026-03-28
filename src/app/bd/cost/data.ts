// ── BD Healthcare Cost Data (BDT) ─────────────────────────────────────────────
// Source: Aggregated from patient reports, hospital websites, and NGO surveys.
// Last updated: March 2024. Prices are approximate and vary by facility.

export type HospitalCategory = "government" | "private" | "diagnostic"

export interface PriceRow {
  service:  string
  emoji:    string
  note?:    string   // e.g. "per session"
}

export interface PriceEntry {
  low:   number | null   // BDT, null = free / not available
  high:  number | null
  free?: boolean         // completely free (government)
}

export type PriceTable = Record<HospitalCategory, PriceEntry>

export interface ServiceRow extends PriceRow {
  prices: PriceTable
}

// ── Rows ───────────────────────────────────────────────────────────────────────

export const SERVICE_ROWS: ServiceRow[] = [
  {
    service: "Consultation",
    emoji:   "👨‍⚕️",
    prices: {
      government: { low: 0,    high: 10,   free: true },
      private:    { low: 500,  high: 2000  },
      diagnostic: { low: 300,  high: 800   },
    },
  },
  {
    service: "CBC (Complete Blood Count)",
    emoji:   "🩸",
    prices: {
      government: { low: 0,    high: 50,   free: true },
      private:    { low: 400,  high: 800   },
      diagnostic: { low: 300,  high: 600   },
    },
  },
  {
    service: "X-Ray (Chest)",
    emoji:   "🦴",
    prices: {
      government: { low: 50,   high: 150   },
      private:    { low: 500,  high: 1200  },
      diagnostic: { low: 400,  high: 900   },
    },
  },
  {
    service: "MRI (Brain/Spine)",
    emoji:   "🧲",
    prices: {
      government: { low: 2000, high: 4000  },
      private:    { low: 6000, high: 15000 },
      diagnostic: { low: 4000, high: 9000  },
    },
  },
  {
    service: "ECG",
    emoji:   "❤️",
    prices: {
      government: { low: 0,    high: 100,  free: true },
      private:    { low: 300,  high: 700   },
      diagnostic: { low: 200,  high: 500   },
    },
  },
  {
    service: "Ultrasound (Abdomen)",
    emoji:   "📡",
    prices: {
      government: { low: 100,  high: 300   },
      private:    { low: 1200, high: 3000  },
      diagnostic: { low: 800,  high: 2000  },
    },
  },
  {
    service: "Blood Sugar (Fasting)",
    emoji:   "💉",
    prices: {
      government: { low: 0,    high: 30,   free: true },
      private:    { low: 150,  high: 350   },
      diagnostic: { low: 100,  high: 250   },
    },
  },
  {
    service: "Thyroid Function (TSH)",
    emoji:   "🦋",
    prices: {
      government: { low: 200,  high: 500   },
      private:    { low: 800,  high: 1500  },
      diagnostic: { low: 600,  high: 1200  },
    },
  },
  {
    service: "Echocardiogram",
    emoji:   "🫀",
    prices: {
      government: { low: 500,  high: 1000  },
      private:    { low: 3000, high: 7000  },
      diagnostic: { low: 2000, high: 5000  },
    },
  },
  {
    service: "Endoscopy (Upper GI)",
    emoji:   "🔬",
    prices: {
      government: { low: 500,  high: 1500  },
      private:    { low: 3000, high: 8000  },
      diagnostic: { low: 2500, high: 6000  },
    },
  },
]

export const CATEGORY_META: Record<HospitalCategory, { label: string; emoji: string; description: string; color: string }> = {
  government: {
    label:       "Government Hospitals",
    emoji:       "🏛️",
    description: "DGHS, BSMMU, Dhaka Medical, district hospitals. Low-cost to free, but wait times can be long.",
    color:       "text-green-700 dark:text-green-400",
  },
  private: {
    label:       "Private Hospitals",
    emoji:       "🏥",
    description: "Square, Labaid, United, Ibn Sina, Popular and similar chains. Higher cost, shorter waits.",
    color:       "text-blue-700 dark:text-blue-400",
  },
  diagnostic: {
    label:       "Diagnostic Centers",
    emoji:       "🔬",
    description: "Popular Diagnostic, Delta Medical, Medinova, Shomrita. Lower cost than private hospitals for tests.",
    color:       "text-purple-700 dark:text-purple-400",
  },
}
