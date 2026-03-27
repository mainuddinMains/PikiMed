"use client"

import { useEffect, useState } from "react"
import { useInsuranceWizard } from "@/store/insuranceWizardStore"
import ProgressBar    from "@/components/insurance/ProgressBar"
import Step1Coverage  from "@/components/insurance/Step1Coverage"
import Step2Hospitals from "@/components/insurance/Step2Hospitals"
import Step3Eligibility from "@/components/insurance/Step3Eligibility"

interface InsuranceWizardProps {
  mapboxToken?: string
}

export default function InsuranceWizard({ mapboxToken }: InsuranceWizardProps) {
  const { step, setStep } = useInsuranceWizard()

  // Prevent hydration mismatch — Zustand persist rehydrates on client only
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-9 rounded-full bg-slate-100 dark:bg-slate-800 w-2/3" />
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    )
  }

  return (
    <div>
      <ProgressBar step={step} onStepClick={setStep} />

      <div className="transition-all">
        {step === 1 && <Step1Coverage />}
        {step === 2 && <Step2Hospitals mapboxToken={mapboxToken} />}
        {step === 3 && <Step3Eligibility />}
      </div>
    </div>
  )
}
