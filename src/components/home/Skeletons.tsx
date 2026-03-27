import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", className)} />
  )
}

export function HeroSkeleton() {
  return (
    <section className="bg-gradient-to-br from-[#06B6D4]/10 to-[#1D9E75]/5 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <Pulse className="mx-auto h-10 w-3/4" />
        <Pulse className="mx-auto h-6 w-1/2" />
        <Pulse className="mx-auto h-14 w-full max-w-xl rounded-2xl" />
      </div>
    </section>
  )
}

export function HospitalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Pulse className="h-5 w-3/5" />
          <Pulse className="h-4 w-2/5" />
        </div>
        <Pulse className="h-6 w-16 rounded-full" />
      </div>
      <Pulse className="h-4 w-1/3" />
    </div>
  )
}

export function DoctorCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <Pulse className="h-12 w-12 rounded-full" />
      <Pulse className="h-4 w-4/5" />
      <Pulse className="h-3 w-3/5" />
      <Pulse className="h-3 w-2/5" />
    </div>
  )
}

export function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <HospitalCardSkeleton key={i} />
      ))}
    </div>
  )
}
