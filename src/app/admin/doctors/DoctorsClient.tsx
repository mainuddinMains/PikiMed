"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react"
import toast from "react-hot-toast"
import Modal from "@/app/admin/_components/Modal"
import { Field, Input, Select, Textarea, FormGrid, FormActions } from "@/app/admin/_components/Field"
import {
  createDoctor, updateDoctor, deleteDoctor, toggleDoctorAvailability,
} from "@/app/admin/actions"
import type { Region } from "@prisma/client"

// ── Types ─────────────────────────────────────────────────────────────────────

export type DoctorRow = {
  id: string; name: string; slug: string; specialty: string
  region: Region; city: string; district: string | null; state: string | null
  phone: string | null; email: string | null; bmdc: string | null; npi: string | null
  consultFeeMin: number | null; consultFeeMax: number | null; currency: string
  isAvailableToday: boolean; avgRating: number | null; reviewCount: number
  bio: string | null; website: string | null; avgWaitMinutes: number | null
  lat: number | null; lng: number | null
}

// ── Blank form state ───────────────────────────────────────────────────────────

const BLANK: Omit<DoctorRow, "id" | "slug" | "avgRating" | "reviewCount"> = {
  name: "", specialty: "", bio: "", region: "BD",
  city: "", district: "", state: "",
  phone: "", email: "", website: "",
  bmdc: "", npi: "",
  consultFeeMin: null, consultFeeMax: null, currency: "BDT",
  isAvailableToday: false, avgWaitMinutes: null,
  lat: null, lng: null,
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DoctorsClient({ doctors: initial }: { doctors: DoctorRow[] }) {
  const [doctors, setDoctors]   = useState(initial)
  const [search,  setSearch]    = useState("")
  const [modal,   setModal]     = useState<"add" | "edit" | null>(null)
  const [editing, setEditing]   = useState<DoctorRow | null>(null)
  const [form,    setForm]       = useState<typeof BLANK>(BLANK)
  const [pending, startTransition] = useTransition()

  const filtered = doctors.filter((d) =>
    [d.name, d.specialty, d.city, d.region].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  )

  function openAdd() {
    setForm(BLANK)
    setEditing(null)
    setModal("add")
  }

  function openEdit(d: DoctorRow) {
    setEditing(d)
    setForm({
      name: d.name, specialty: d.specialty, bio: d.bio ?? "",
      region: d.region, city: d.city, district: d.district ?? "", state: d.state ?? "",
      phone: d.phone ?? "", email: d.email ?? "", website: d.website ?? "",
      bmdc: d.bmdc ?? "", npi: d.npi ?? "",
      consultFeeMin: d.consultFeeMin, consultFeeMax: d.consultFeeMax, currency: d.currency,
      isAvailableToday: d.isAvailableToday, avgWaitMinutes: d.avgWaitMinutes,
      lat: d.lat, lng: d.lng,
    })
    setModal("edit")
  }

  function f(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm((prev) => ({ ...prev, [key]: val }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        if (modal === "add") {
          await createDoctor({
            name: form.name, specialty: form.specialty,
            bio:     form.bio      || undefined,
            region:  form.region as Region,
            city:    form.city,
            district: form.district || undefined,
            state:    form.state    || undefined,
            phone:    form.phone    || undefined,
            email:    form.email    || undefined,
            website:  form.website  || undefined,
            bmdc:     form.bmdc     || undefined,
            npi:      form.npi      || undefined,
            consultFeeMin: form.consultFeeMin ?? undefined,
            consultFeeMax: form.consultFeeMax ?? undefined,
            currency: form.currency,
            avgWaitMinutes: form.avgWaitMinutes ?? undefined,
            lat: form.lat ?? undefined,
            lng: form.lng ?? undefined,
          })
          toast.success("Doctor created")
        } else if (editing) {
          await updateDoctor(editing.id, {
            name: form.name, specialty: form.specialty,
            bio:     form.bio      || undefined,
            city:    form.city,
            district: form.district || undefined,
            state:    form.state    || undefined,
            phone:    form.phone    || undefined,
            email:    form.email    || undefined,
            website:  form.website  || undefined,
            bmdc:     form.bmdc     || undefined,
            npi:      form.npi      || undefined,
            consultFeeMin: form.consultFeeMin,
            consultFeeMax: form.consultFeeMax,
            currency: form.currency,
            isAvailableToday: form.isAvailableToday,
            avgWaitMinutes: form.avgWaitMinutes,
            lat: form.lat,
            lng: form.lng,
          })
          toast.success("Doctor updated")
        }
        setModal(null)
        // Refresh data from server — next render will re-fetch
        window.location.reload()
      } catch {
        toast.error("Something went wrong")
      }
    })
  }

  function handleDelete(d: DoctorRow) {
    if (!confirm(`Delete "${d.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteDoctor(d.id)
        setDoctors((prev) => prev.filter((x) => x.id !== d.id))
        toast.success("Doctor deleted")
      } catch {
        toast.error("Delete failed")
      }
    })
  }

  function handleToggle(d: DoctorRow) {
    const next = !d.isAvailableToday
    startTransition(async () => {
      try {
        await toggleDoctorAvailability(d.id, next)
        setDoctors((prev) => prev.map((x) => x.id === d.id ? { ...x, isAvailableToday: next } : x))
      } catch {
        toast.error("Toggle failed")
      }
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-sm font-medium hover:bg-[#0E7490] transition-colors"
        >
          <Plus className="size-4" />
          Add Doctor
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Specialty</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Region / City</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Available</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{d.name}</p>
                    {d.bmdc && <p className="text-xs text-slate-400">BMDC: {d.bmdc}</p>}
                    {d.npi  && <p className="text-xs text-slate-400">NPI: {d.npi}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.specialty}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.region === "BD" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {d.region}
                    </span>
                    <span className="ml-2 text-slate-500">{d.city}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {d.avgRating != null ? (
                      <span className="text-amber-500 font-semibold">★ {d.avgRating.toFixed(1)}</span>
                    ) : "—"}
                    <span className="text-xs text-slate-400 ml-1">({d.reviewCount})</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(d)}
                      disabled={pending}
                      title={d.isAvailableToday ? "Mark unavailable" : "Mark available"}
                      className="transition-colors disabled:opacity-50"
                    >
                      {d.isAvailableToday ? (
                        <ToggleRight className="size-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="size-6 text-slate-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors"
                        title="Edit"
                        aria-label="Edit doctor"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        disabled={pending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete"
                        aria-label="Delete doctor"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {search ? "No doctors match your search" : "No doctors yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Doctor" : "Edit Doctor"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGrid>
            <Field label="Full name" required>
              <Input value={form.name} onChange={f("name")} required placeholder="Dr. John Smith" />
            </Field>
            <Field label="Specialty" required>
              <Input value={form.specialty} onChange={f("specialty")} required placeholder="Cardiology" />
            </Field>
          </FormGrid>

          <Field label="Bio">
            <Textarea value={form.bio ?? ""} onChange={f("bio")} rows={3} placeholder="Short biography…" />
          </Field>

          <FormGrid>
            <Field label="Region" required>
              <Select value={form.region} onChange={f("region")} disabled={modal === "edit"}>
                <option value="BD">Bangladesh (BD)</option>
                <option value="US">United States (US)</option>
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={form.currency} onChange={f("currency")}>
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
              </Select>
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="City" required>
              <Input value={form.city} onChange={f("city")} required placeholder="Dhaka" />
            </Field>
            <Field label={form.region === "BD" ? "District" : "State"}>
              <Input
                value={form.region === "BD" ? (form.district ?? "") : (form.state ?? "")}
                onChange={f(form.region === "BD" ? "district" : "state")}
                placeholder={form.region === "BD" ? "Dhaka" : "NY"}
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={f("phone")} placeholder="+880..." type="tel" />
            </Field>
            <Field label="Email">
              <Input value={form.email ?? ""} onChange={f("email")} placeholder="dr@example.com" type="email" />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label={form.region === "BD" ? "BMDC No." : "NPI No."}>
              <Input
                value={form.region === "BD" ? (form.bmdc ?? "") : (form.npi ?? "")}
                onChange={f(form.region === "BD" ? "bmdc" : "npi")}
                placeholder={form.region === "BD" ? "A-12345" : "1234567890"}
              />
            </Field>
            <Field label="Avg wait (min)">
              <Input
                value={form.avgWaitMinutes ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, avgWaitMinutes: e.target.value ? Number(e.target.value) : null }))}
                type="number" min={0} placeholder="30"
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Consult fee min">
              <Input
                value={form.consultFeeMin ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, consultFeeMin: e.target.value ? Number(e.target.value) : null }))}
                type="number" min={0} placeholder="500"
              />
            </Field>
            <Field label="Consult fee max">
              <Input
                value={form.consultFeeMax ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, consultFeeMax: e.target.value ? Number(e.target.value) : null }))}
                type="number" min={0} placeholder="1500"
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Latitude">
              <Input
                value={form.lat ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value ? Number(e.target.value) : null }))}
                type="number" step="any" placeholder="23.726"
              />
            </Field>
            <Field label="Longitude">
              <Input
                value={form.lng ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value ? Number(e.target.value) : null }))}
                type="number" step="any" placeholder="90.388"
              />
            </Field>
          </FormGrid>

          {modal === "edit" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="avail"
                checked={form.isAvailableToday}
                onChange={f("isAvailableToday")}
                className="rounded"
              />
              <label htmlFor="avail" className="text-sm text-slate-700 dark:text-slate-200">
                Available today
              </label>
            </div>
          )}

          <FormActions onCancel={() => setModal(null)} submitting={pending} />
        </form>
      </Modal>
    </>
  )
}
