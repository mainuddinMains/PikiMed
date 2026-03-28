"use client"

import { useState } from "react"
import { MapPin, Clock, DollarSign, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChamberSlot = {
  location?:    string   // clinic / chamber name
  address?:     string   // full street address (for Maps link)
  lat?:         number   // for multi-location map
  lng?:         number
  start?:       string   // "09:00"
  end?:         string   // "14:00"
  morning?:     { start: string; end: string }
  evening?:     { start: string; end: string }
  fee?:         number   // BDT per session
  maxPatients?: number
}

export type ChamberScheduleData = Record<string, ChamberSlot>

// BD week starts Saturday
const DAY_ORDER = ["saturday","sunday","monday","tuesday","wednesday","thursday","friday"]

const DAY_ABBR: Record<string, string> = {
  saturday:  "Sat",
  sunday:    "Sun",
  monday:    "Mon",
  tuesday:   "Tue",
  wednesday: "Wed",
  thursday:  "Thu",
  friday:    "Fri",
}

const JS_DAY_TO_NAME = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(t: string | undefined): string {
  if (!t) return "—"
  const [h, m] = t.split(":").map(Number)
  const ampm   = h >= 12 ? "PM" : "AM"
  const h12    = h % 12 || 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

function slotTimeLabel(slot: ChamberSlot): { morning: string; evening: string } {
  const morning = slot.morning
    ? `${fmtTime(slot.morning.start)} – ${fmtTime(slot.morning.end)}`
    : slot.start
    ? `${fmtTime(slot.start)} – ${fmtTime(slot.end)}`
    : "—"
  const evening = slot.evening
    ? `${fmtTime(slot.evening.start)} – ${fmtTime(slot.evening.end)}`
    : "—"
  return { morning, evening }
}

function mapsUrl(slot: ChamberSlot): string {
  const q = slot.address ?? slot.location
  if (!q) return "#"
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ", Bangladesh")}`
}

// ── Desktop table row ──────────────────────────────────────────────────────────

function TableRow({
  day,
  slot,
  isToday,
}: {
  day:     string
  slot:    ChamberSlot
  isToday: boolean
}) {
  const { morning, evening } = slotTimeLabel(slot)
  const url = mapsUrl(slot)

  return (
    <tr className={cn(
      "border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
      isToday ? "bg-[#06B6D4]/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
    )}>
      {/* Day */}
      <td className="py-3 pr-4 w-24">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize text-sm">
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </span>
          {isToday && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#06B6D4] text-white uppercase tracking-wide">
              Today
            </span>
          )}
        </div>
      </td>

      {/* Location */}
      <td className="py-3 pr-4">
        {slot.location ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#06B6D4] font-medium hover:underline"
          >
            <MapPin className="size-3 flex-shrink-0" />
            {slot.location}
          </a>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>

      {/* Time */}
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-0.5 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
          {morning !== "—" && (
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-slate-400" />
              {morning}
            </span>
          )}
          {evening !== "—" && (
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="size-3 text-slate-400" />
              {evening}
            </span>
          )}
          {morning === "—" && evening === "—" && <span className="text-slate-400">—</span>}
        </div>
      </td>

      {/* Fee */}
      <td className="py-3 text-right text-sm tabular-nums">
        {slot.fee != null ? (
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            ৳{slot.fee.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
    </tr>
  )
}

// ── Mobile accordion row ───────────────────────────────────────────────────────

function AccordionRow({
  day,
  slot,
  isToday,
}: {
  day:     string
  slot:    ChamberSlot
  isToday: boolean
}) {
  const [open, setOpen] = useState(isToday)
  const { morning, evening } = slotTimeLabel(slot)
  const url = mapsUrl(slot)

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      isToday
        ? "border-[#06B6D4] shadow-sm shadow-cyan-100/50"
        : "border-slate-200 dark:border-slate-700",
    )}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left",
          isToday
            ? "bg-[#06B6D4]/5"
            : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-bold text-slate-500 uppercase">{DAY_ABBR[day]}</span>
          {isToday && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#06B6D4] text-white uppercase tracking-wide">
              Today
            </span>
          )}
          {slot.location && (
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
              {slot.location}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp   className="size-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="size-4 text-slate-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Location link */}
          {slot.location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="size-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06B6D4] font-medium hover:underline leading-snug"
              >
                {slot.address ?? slot.location}
              </a>
            </div>
          )}

          {/* Times */}
          {morning !== "—" && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Clock className="size-3.5 text-slate-400 flex-shrink-0" />
              <span>Morning: <span className="tabular-nums font-medium">{morning}</span></span>
            </div>
          )}
          {evening !== "—" && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Clock className="size-3.5 text-slate-400 flex-shrink-0" />
              <span>Evening: <span className="tabular-nums font-medium">{evening}</span></span>
            </div>
          )}

          {/* Fee + max patients */}
          <div className="flex items-center gap-4 pt-0.5">
            {slot.fee != null && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <DollarSign className="size-3.5 text-slate-400" />
                ৳{slot.fee.toLocaleString()} / visit
              </div>
            )}
            {slot.maxPatients != null && (
              <p className="text-xs text-slate-400">
                Max {slot.maxPatients} patients/day
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ChamberScheduleProps {
  chambers: ChamberScheduleData
  className?: string
}

export default function ChamberSchedule({ chambers, className }: ChamberScheduleProps) {
  const orderedDays = DAY_ORDER.filter((d) => d in chambers)
  const todayName   = JS_DAY_TO_NAME[new Date().getDay()]

  if (orderedDays.length === 0) return null

  return (
    <div className={className}>
      {/* ── Desktop table ────────────────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 pr-4 w-28">Day</th>
              <th className="text-left pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 pr-4">Location</th>
              <th className="text-left pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 pr-4">Time</th>
              <th className="text-right pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">Fee (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {orderedDays.map((day) => (
              <TableRow
                key={day}
                day={day}
                slot={chambers[day]}
                isToday={day === todayName}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile accordion ─────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-2">
        {orderedDays.map((day) => (
          <AccordionRow
            key={day}
            day={day}
            slot={chambers[day]}
            isToday={day === todayName}
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        📞 Call ahead to confirm today&apos;s availability before visiting.
      </p>
    </div>
  )
}
