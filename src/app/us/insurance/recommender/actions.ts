"use server"

// ── Types ──────────────────────────────────────────────────────────────────────

export type HealthCondition =
  | "diabetes"
  | "heart_disease"
  | "mental_health"
  | "pregnancy"
  | "chronic_pain"
  | "none"

export type EmploymentStatus =
  | "employed_full"
  | "employed_part"
  | "self_employed"
  | "unemployed"
  | "student"
  | "retired"

export type PlanKey =
  | "MEDICAID"
  | "MEDICARE"
  | "CHIP"
  | "EMPLOYER_HMO"
  | "EMPLOYER_PPO"
  | "ACA_BRONZE"
  | "ACA_SILVER"
  | "ACA_GOLD"
  | "HDHP_HSA"

export interface RecommenderInput {
  age:                  number
  conditions:           HealthCondition[]
  monthlyBudget:        number
  preferredDoctorCount: number
  employmentStatus:     EmploymentStatus
  state:                string
}

export interface Recommendation {
  planKey:              PlanKey
  label:                string
  score:                number   // 0–100 (normalised)
  description:          string
  whyItFits:            string[]
  pros:                 string[]
  cons:                 string[]
  estimatedMonthlyLow:  number
  estimatedMonthlyHigh: number
  learnMoreUrl:         string
  learnMoreLabel:       string
}

// ── Constants ──────────────────────────────────────────────────────────────────

// States that have NOT adopted ACA Medicaid expansion (as of 2024)
const NON_EXPANSION_STATES = new Set([
  "AL", "GA", "KS", "MS", "SC", "TN", "TX", "WY", "WI",
])

// Chronic conditions (not pregnancy) that drive up care utilisation
const CHRONIC: HealthCondition[] = ["diabetes", "heart_disease", "chronic_pain"]

const FPL_SINGLE_2024 = 15_060   // Federal Poverty Level single person

// ── Static plan metadata ───────────────────────────────────────────────────────

const PLAN_META: Record<PlanKey, {
  label:       string
  description: string
  pros:        string[]
  cons:        string[]
  url:         string
  urlLabel:    string
}> = {
  MEDICAID: {
    label:       "Medicaid",
    description: "Free or nearly-free government coverage for low-income individuals.",
    pros: [
      "No or very low premiums",
      "Comprehensive coverage including dental and vision in many states",
      "Open enrollment year-round",
      "No deductible in most states",
    ],
    cons: [
      "Income eligibility limits — you may lose coverage if income rises",
      "Provider network can be narrower than private plans",
      "Not available in all states equally (expansion vs non-expansion)",
    ],
    url:      "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/",
    urlLabel: "Check Medicaid eligibility",
  },
  MEDICARE: {
    label:       "Medicare",
    description: "Federal health insurance for Americans 65+ or those with qualifying disabilities.",
    pros: [
      "Guaranteed coverage regardless of health status",
      "Wide provider acceptance",
      "Prescription drug coverage available (Part D)",
      "Supplemental Medigap plans available for extra protection",
    ],
    cons: [
      "Part B premium ~$174/mo (can be higher with higher income)",
      "Doesn't cover dental, vision, or hearing without supplemental plan",
      "Coverage gaps if not enrolled in time",
    ],
    url:      "https://www.medicare.gov/sign-up-change-plans/how-do-i-get-parts-a-b",
    urlLabel: "Medicare enrollment",
  },
  CHIP: {
    label:       "CHIP (Children's Health Insurance Program)",
    description: "Low-cost coverage for children in families with income too high for Medicaid.",
    pros: [
      "Very low or no premiums for children",
      "Comprehensive child-focused benefits",
      "Open enrollment year-round",
    ],
    cons: [
      "For children under 19 only",
      "Income eligibility limits vary by state",
    ],
    url:      "https://www.healthcare.gov/medicaid-chip/childrens-health-insurance-program/",
    urlLabel: "Find your state CHIP program",
  },
  EMPLOYER_HMO: {
    label:       "Employer-Sponsored HMO",
    description: "Group health coverage through your employer using a Health Maintenance Organization network.",
    pros: [
      "Employer pays a large portion of premiums (avg 70–80%)",
      "Lower copays and out-of-pocket costs",
      "No deductible for in-network care in many plans",
      "Coordinated care through a primary care physician",
    ],
    cons: [
      "Must stay in-network; no out-of-network coverage except emergencies",
      "Referral required to see specialists",
      "Coverage lost if you leave your job",
    ],
    url:      "https://www.dol.gov/general/topic/health-plans/hmo",
    urlLabel: "Learn about employer HMOs",
  },
  EMPLOYER_PPO: {
    label:       "Employer-Sponsored PPO",
    description: "Flexible group health plan through your employer; see any doctor without a referral.",
    pros: [
      "See any doctor, in or out of network",
      "No referral needed for specialists",
      "Employer subsidises most of the premium",
      "Best fit if you have preferred specialists",
    ],
    cons: [
      "Higher premiums than HMO",
      "Out-of-network care costs significantly more",
      "Coverage tied to employment",
    ],
    url:      "https://www.healthcare.gov/glossary/preferred-provider-organization-ppo/",
    urlLabel: "Learn about PPOs",
  },
  ACA_BRONZE: {
    label:       "ACA Bronze Plan",
    description: "Lowest-premium Marketplace plan; covers 60% of costs on average. Best for rarely-sick individuals.",
    pros: [
      "Lowest monthly premiums of ACA tiers",
      "Counts as qualifying health coverage",
      "Subsidies may lower premium further",
      "Covers preventive care at no cost",
    ],
    cons: [
      "High deductible (avg $6,000+/yr)",
      "High out-of-pocket costs if you get sick",
      "Not ideal if you have ongoing prescriptions",
    ],
    url:      "https://www.healthcare.gov/choose-a-plan/plans-categories/",
    urlLabel: "Browse Bronze plans",
  },
  ACA_SILVER: {
    label:       "ACA Silver Plan",
    description: "Middle-tier Marketplace plan covering 70% of costs. Best value with income-based subsidies.",
    pros: [
      "Eligible for Cost Sharing Reductions (CSR) if income is 100–250% FPL",
      "Balanced premiums and out-of-pocket costs",
      "Most popular ACA tier",
    ],
    cons: [
      "Higher premiums than Bronze",
      "Still has moderate deductible",
      "Network may be narrower than employer plans",
    ],
    url:      "https://www.healthcare.gov/choose-a-plan/plans-categories/",
    urlLabel: "Browse Silver plans",
  },
  ACA_GOLD: {
    label:       "ACA Gold Plan",
    description: "Higher-premium ACA plan covering 80% of costs; best for frequent or ongoing care needs.",
    pros: [
      "Lower deductible than Bronze/Silver",
      "Better coverage for chronic conditions and specialist visits",
      "More predictable yearly costs",
    ],
    cons: [
      "Higher monthly premium",
      "May cost more than employer coverage if you have access",
    ],
    url:      "https://www.healthcare.gov/choose-a-plan/plans-categories/",
    urlLabel: "Browse Gold plans",
  },
  HDHP_HSA: {
    label:       "HDHP + HSA",
    description: "High-Deductible Health Plan paired with a tax-advantaged Health Savings Account.",
    pros: [
      "Lowest premiums among comprehensive plans",
      "HSA contributions are triple tax-advantaged",
      "HSA funds roll over every year (no use-it-or-lose-it)",
      "Great for self-employed with high income",
    ],
    cons: [
      "High deductible ($1,600+ individual, $3,200+ family in 2024)",
      "Significant out-of-pocket risk if you get seriously ill",
      "Not ideal with chronic conditions or frequent care",
    ],
    url:      "https://www.healthcare.gov/glossary/high-deductible-health-plan/",
    urlLabel: "Learn about HDHPs + HSAs",
  },
}

// ── Premium estimates (monthly) ────────────────────────────────────────────────

const BASE_PREMIUMS: Record<PlanKey, [number, number]> = {
  MEDICAID:     [0,    0   ],
  MEDICARE:     [174,  594 ],
  CHIP:         [0,    50  ],
  EMPLOYER_HMO: [50,   200 ],
  EMPLOYER_PPO: [100,  300 ],
  ACA_BRONZE:   [80,   250 ],
  ACA_SILVER:   [200,  480 ],
  ACA_GOLD:     [350,  700 ],
  HDHP_HSA:     [60,   180 ],
}

// ── Scoring engine ─────────────────────────────────────────────────────────────

function score(input: RecommenderInput): Array<{ key: PlanKey; raw: number; reasons: string[] }> {
  const {
    age, conditions, monthlyBudget, preferredDoctorCount,
    employmentStatus, state,
  } = input

  const hasChronicCondition   = CHRONIC.some((c) => conditions.includes(c))
  const hasAnyCondition       = conditions.length > 0 && !conditions.includes("none")
  const isPregnant            = conditions.includes("pregnancy")
  const isMentalHealth        = conditions.includes("mental_health")
  const isEmployedFull        = employmentStatus === "employed_full"
  const isEmployedPart        = employmentStatus === "employed_part"
  const isSelfEmployed        = employmentStatus === "self_employed"
  const isUnemployed          = employmentStatus === "unemployed"
  const isStudent             = employmentStatus === "student"
  const isRetired             = employmentStatus === "retired"
  const inExpansionState      = !NON_EXPANSION_STATES.has(state.toUpperCase())
  const hasPreferredDoctors   = preferredDoctorCount > 0

  // Approximated FPL % from monthly budget (rough proxy):
  // Budget $0-150 → likely < 138% FPL (Medicaid range)
  // Budget $150-300 → 138-250% (Silver CSR range)
  // Budget > 300 → 250%+
  const estimatedAnnualAffordable = monthlyBudget * 12
  const approxFplPct = estimatedAnnualAffordable / FPL_SINGLE_2024 * 100

  const results: Array<{ key: PlanKey; raw: number; reasons: string[] }> = []

  // ── MEDICAID ────────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (age >= 65) { s -= 100 }
    else if (monthlyBudget < 100 || isUnemployed || isStudent) {
      s += 60; r.push("Low or zero budget suggests you may qualify for Medicaid")
    }
    if (inExpansionState) {
      s += 20; r.push(`${state} has expanded Medicaid, broadening eligibility`)
    } else {
      s -= 20; r.push(`${state} has stricter Medicaid eligibility (non-expansion)`)
    }
    if (isPregnant) { s += 30; r.push("Pregnancy often qualifies for Medicaid regardless of income") }
    if (hasChronicCondition) { s += 15; r.push("Chronic conditions may qualify you for expanded Medicaid") }
    if (isEmployedFull) { s -= 30 }
    if (isSelfEmployed && approxFplPct > 200) { s -= 20 }
    results.push({ key: "MEDICAID", raw: Math.max(0, s), reasons: r })
  }

  // ── MEDICARE ────────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (age >= 65) {
      s = 100; r.push("You are 65+ and eligible for Medicare by age")
    } else if (age >= 60) {
      s = 40; r.push("You are approaching Medicare eligibility at 65")
    } else {
      s = 0
    }
    if (isRetired) { s += 10; r.push("Retirement aligns with Medicare as your primary coverage") }
    results.push({ key: "MEDICARE", raw: Math.max(0, s), reasons: r })
  }

  // ── CHIP ────────────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (age < 19) {
      s = 90; r.push("CHIP is designed for children and teens under 19")
      if (monthlyBudget < 200) { s += 10; r.push("Your budget fits CHIP's low-cost model") }
    }
    results.push({ key: "CHIP", raw: Math.max(0, s), reasons: r })
  }

  // ── EMPLOYER HMO ────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (isEmployedFull) {
      s += 65; r.push("Full-time employment typically comes with employer-sponsored HMO options")
    } else if (isEmployedPart) {
      s += 25; r.push("Some part-time employers offer HMO coverage")
    }
    if (!hasPreferredDoctors) {
      s += 10; r.push("HMO works best when you don't have specific preferred doctors outside a network")
    } else {
      s -= 10
    }
    if (monthlyBudget < 300) { s += 10; r.push("HMO premiums after employer contribution typically fit lower budgets") }
    results.push({ key: "EMPLOYER_HMO", raw: Math.max(0, s), reasons: r })
  }

  // ── EMPLOYER PPO ────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (isEmployedFull) {
      s += 55; r.push("Full-time employment often includes PPO options")
    } else if (isEmployedPart) {
      s += 20
    }
    if (hasPreferredDoctors) {
      s += 25; r.push(`You have ${preferredDoctorCount} preferred doctor(s) — PPO lets you see any provider without referral`)
    }
    if (hasChronicCondition) {
      s += 15; r.push("Chronic conditions benefit from PPO's specialist access without referrals")
    }
    if (isMentalHealth) {
      s += 10; r.push("PPO plans typically have broader mental health provider networks")
    }
    results.push({ key: "EMPLOYER_PPO", raw: Math.max(0, s), reasons: r })
  }

  // ── ACA BRONZE ──────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (age >= 18 && age <= 30 && !hasAnyCondition) {
      s += 50; r.push("Young and healthy individuals often find Bronze plans cost-effective")
    }
    if (monthlyBudget < 150) {
      s += 30; r.push("Bronze has the lowest premiums on the ACA Marketplace")
    } else if (monthlyBudget < 250) {
      s += 15
    }
    if (hasChronicCondition) {
      s -= 30; r.push("High Bronze deductibles can be costly with chronic conditions")
    }
    if (!isEmployedFull && !isRetired && age < 65) {
      s += 20; r.push("ACA plans are ideal when employer coverage isn't available")
    }
    results.push({ key: "ACA_BRONZE", raw: Math.max(0, s), reasons: r })
  }

  // ── ACA SILVER ──────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (approxFplPct >= 100 && approxFplPct <= 300) {
      s += 45; r.push("Your budget suggests you may qualify for ACA Silver subsidies (Cost Sharing Reductions)")
    }
    if (monthlyBudget >= 150 && monthlyBudget <= 450) {
      s += 20; r.push("Your premium budget aligns with Silver plan costs after subsidies")
    }
    if (hasAnyCondition && !hasChronicCondition) {
      s += 15; r.push("Silver balances premiums with reasonable cost-sharing for moderate care needs")
    }
    if (isPregnant) {
      s += 20; r.push("Silver plans cover maternity care with manageable cost-sharing")
    }
    if (!isEmployedFull && !isRetired && age < 65) {
      s += 15; r.push("Silver is the most popular ACA tier for those without employer coverage")
    }
    results.push({ key: "ACA_SILVER", raw: Math.max(0, s), reasons: r })
  }

  // ── ACA GOLD ────────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (hasChronicCondition) {
      s += 50; r.push("Chronic conditions mean frequent care — Gold's lower deductible reduces your total spend")
    }
    if (isMentalHealth) {
      s += 20; r.push("Gold plans provide better mental health coverage with lower cost-sharing")
    }
    if (monthlyBudget >= 350) {
      s += 25; r.push("Your premium budget fits ACA Gold tier pricing")
    }
    if (hasPreferredDoctors) {
      s += 10; r.push("Gold plans tend to have broader networks, helpful for keeping your preferred providers")
    }
    if (!isEmployedFull && !isRetired && age < 65) {
      s += 10
    }
    results.push({ key: "ACA_GOLD", raw: Math.max(0, s), reasons: r })
  }

  // ── HDHP + HSA ──────────────────────────────────────────────────────────────
  {
    let s = 0
    const r: string[] = []
    if (isSelfEmployed) {
      s += 50; r.push("Self-employed individuals benefit significantly from HSA tax deductions")
    }
    if (!hasChronicCondition && !isPregnant && !hasAnyCondition) {
      s += 35; r.push("Healthy individuals rarely hit the high deductible, keeping total costs low")
    }
    if (monthlyBudget < 200) {
      s += 20; r.push("HDHP has the lowest premiums among comprehensive plans")
    }
    if (age >= 25 && age <= 55 && !hasAnyCondition) {
      s += 15; r.push("Prime working-age adults with good health are ideal HDHP candidates")
    }
    if (hasChronicCondition) {
      s -= 40; r.push("Chronic conditions can make the high deductible financially painful")
    }
    if (isUnemployed || isStudent) {
      s -= 20
    }
    results.push({ key: "HDHP_HSA", raw: Math.max(0, s), reasons: r })
  }

  return results
}

// ── Server action ──────────────────────────────────────────────────────────────

export async function getRecommendations(input: RecommenderInput): Promise<Recommendation[]> {
  const scores = score(input)

  // Exclude CHIP if age >= 19, exclude MEDICARE if age < 65 (unless close)
  const eligible = scores.filter(({ key, raw }) => {
    if (key === "CHIP"     && input.age >= 19) return false
    if (key === "MEDICARE" && input.age < 55)  return false
    return raw > 0
  })

  // Sort by raw score
  eligible.sort((a, b) => b.raw - a.raw)

  // Normalise top score to 100
  const topRaw = eligible[0]?.raw ?? 1
  const top3   = eligible.slice(0, 3)

  return top3.map(({ key, raw, reasons }) => {
    const meta        = PLAN_META[key]
    const [low, high] = BASE_PREMIUMS[key]
    const normalized  = Math.min(100, Math.round((raw / topRaw) * 100))

    // Personalise "why it fits" with scored reasons
    const whyItFits = reasons.filter(Boolean).slice(0, 4)
    if (whyItFits.length === 0) whyItFits.push("This plan matches your overall profile")

    return {
      planKey:              key,
      label:                meta.label,
      score:                normalized,
      description:          meta.description,
      whyItFits,
      pros:                 meta.pros,
      cons:                 meta.cons,
      estimatedMonthlyLow:  low,
      estimatedMonthlyHigh: high,
      learnMoreUrl:         meta.url,
      learnMoreLabel:       meta.urlLabel,
    }
  })
}
