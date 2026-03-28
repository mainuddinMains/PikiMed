import { create } from "zustand"
import { persist } from "zustand/middleware"

export type InsurancePlanType = "PPO" | "HMO" | "HDHP" | "MEDICAID" | "MEDICARE" | "CHIP"

export interface CoverageDetails {
  preventiveCare?: string
  primaryCare?:    string
  specialist?:     string
  emergency?:      string
  mentalHealth?:   string
  dental?:         string
  vision?:         string
  outOfNetwork?:   string
  hsaEligible?:    boolean
  prescriptions?: {
    generic?:    string
    brand?:      string
    specialty?:  string
  }
}

export interface InsurancePlanData {
  id:             string
  name:           string
  provider:       string
  state:          string | null
  type:           InsurancePlanType
  deductible:     number | null
  copay:          number | null
  outOfPocketMax: number | null
  coverageDetails: CoverageDetails | null
}

export type EmploymentStatus =
  | "employed_full"
  | "employed_part"
  | "self_employed"
  | "unemployed"
  | "retired"
  | "student"

export interface EligibilityForm {
  age:               number
  state:             string
  income:            number    // annual household (single person basis)
  employmentStatus:  EmploymentStatus
  healthConditions:  string[]
}

export interface WizardLocation {
  lat:   number
  lng:   number
  label: string
}

const DEFAULT_ELIGIBILITY: EligibilityForm = {
  age:              35,
  state:            "",
  income:           40000,
  employmentStatus: "employed_full",
  healthConditions: [],
}

interface InsuranceWizardState {
  step:        1 | 2 | 3
  plan:        InsurancePlanData | null
  location:    WizardLocation | null
  eligibility: EligibilityForm

  setStep:        (s: 1 | 2 | 3) => void
  setPlan:        (plan: InsurancePlanData) => void
  setLocation:    (loc: WizardLocation | null) => void
  setEligibility: (patch: Partial<EligibilityForm>) => void
  reset:          () => void
}

export const useInsuranceWizard = create<InsuranceWizardState>()(
  persist(
    (set) => ({
      step:        1,
      plan:        null,
      location:    null,
      eligibility: DEFAULT_ELIGIBILITY,

      setStep:     (step)  => set({ step }),
      setPlan:     (plan)  => set({ plan }),
      setLocation: (loc)   => set({ location: loc }),
      setEligibility: (patch) =>
        set((s) => ({ eligibility: { ...s.eligibility, ...patch } })),
      reset: () => set({ step: 1, plan: null, location: null, eligibility: DEFAULT_ELIGIBILITY }),
    }),
    {
      name: "pikimed_insurance_wizard",
      partialize: (s) => ({
        step:        s.step,
        plan:        s.plan,
        location:    s.location,
        eligibility: s.eligibility,
      }),
    },
  ),
)
