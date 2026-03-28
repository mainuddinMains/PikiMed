"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import toast from "react-hot-toast"
import Modal from "@/app/admin/_components/Modal"
import { Field, Input, Select, FormGrid, FormActions } from "@/app/admin/_components/Field"
import { createHospital, updateHospital, deleteHospital } from "@/app/admin/actions"
import type { Region, HospitalType } from "@prisma/client"

// ── Types ─────────────────────────────────────────────────────────────────────

export type HospitalRow = {
  id: string; name: string; slug: string; type: HospitalType; region: Region
  address: string | null; city: string; district: string | null; state: string | null
  phone: string | null; emergencyPhone: string | null
  isOpen24h: boolean; openTime: string | null; closeTime: string | null
  lat: number | null; lng: number | null
  specialties: string[]; avgRating: number | null; reviewCount: number
}

const HOSPITAL_TYPES: HospitalType[] = ["GOVERNMENT", "PRIVATE", "DIAGNOSTIC", "FQHC"]

const BLANK = {
  name: "", type: "PRIVATE" as HospitalType, region: "BD" as Region,
  address: "", city: "", district: "", state: "",
  phone: "", emergencyPhone: "",
  isOpen24h: false, openTime: "", closeTime: "",
  lat: null as number | null, lng: null as number | null,
  specialties: "",
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HospitalsClient({ hospitals: initial }: { hospitals: HospitalRow[] }) {
  const [hospitals, setHospitals] = useState(initial)
  const [search, setSearch]       = useState("")
  const [modal, setModal]         = useState<"add" | "edit" | null>(null)
  const [editing, setEditing]     = useState<HospitalRow | null>(null)
  const [form, setForm]           = useState<typeof BLANK>(BLANK)
  const [pending, start]          = useTransition()

  const filtered = hospitals.filter((h) =>
    [h.name, h.city, h.region, h.type].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  )

  function openAdd() {
    setForm(BLANK)
    setEditing(null)
    setModal("add")
  }

  function openEdit(h: HospitalRow) {
    setEditing(h)
    setForm({
      name: h.name, type: h.type, region: h.region,
      address: h.address ?? "", city: h.city, district: h.district ?? "", state: h.state ?? "",
      phone: h.phone ?? "", emergencyPhone: h.emergencyPhone ?? "",
      isOpen24h: h.isOpen24h, openTime: h.openTime ?? "", closeTime: h.closeTime ?? "",
      lat: h.lat, lng: h.lng,
      specialties: h.specialties.join(", "),
    })
    setModal("edit")
  }

  function f(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm((prev) => ({ ...prev, [key]: val }))
    }
  }

  const specialtiesArr = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      try {
        const specialties = specialtiesArr(form.specialties)
        if (modal === "add") {
          await createHospital({
            name: form.name, type: form.type, region: form.region,
            address:       form.address       || undefined,
            city:          form.city,
            district:      form.district      || undefined,
            state:         form.state         || undefined,
            phone:         form.phone         || undefined,
            emergencyPhone:form.emergencyPhone || undefined,
            isOpen24h:     form.isOpen24h,
            openTime:      form.openTime      || undefined,
            closeTime:     form.closeTime     || undefined,
            lat: form.lat ?? undefined,
            lng: form.lng ?? undefined,
            specialties,
          })
          toast.success("Hospital created")
        } else if (editing) {
          await updateHospital(editing.id, {
            name: form.name, type: form.type,
            address:       form.address       || undefined,
            city:          form.city,
            district:      form.district      || undefined,
            state:         form.state         || undefined,
            phone:         form.phone         || undefined,
            emergencyPhone:form.emergencyPhone || undefined,
            isOpen24h:     form.isOpen24h,
            openTime:      form.openTime      || null,
            closeTime:     form.closeTime     || null,
            lat: form.lat,
            lng: form.lng,
            specialties,
          })
          toast.success("Hospital updated")
        }
        setModal(null)
        window.location.reload()
      } catch {
        toast.error("Something went wrong")
      }
    })
  }

  function handleDelete(h: HospitalRow) {
    if (!confirm(`Delete "${h.name}"? This cannot be undone.`)) return
    start(async () => {
      try {
        await deleteHospital(h.id)
        setHospitals((prev) => prev.filter((x) => x.id !== h.id))
        toast.success("Hospital deleted")
      } catch {
        toast.error("Delete failed")
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
            placeholder="Search hospitals…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-sm font-medium hover:bg-[#0E7490] transition-colors"
        >
          <Plus className="size-4" />
          Add Hospital
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Region / City</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Hours</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{h.name}</p>
                    {h.phone && <p className="text-xs text-slate-400">{h.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={h.type} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.region === "BD" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {h.region}
                    </span>
                    <span className="ml-2 text-slate-500">{h.city}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {h.isOpen24h
                      ? <span className="text-green-600 text-xs font-medium">24h</span>
                      : h.openTime
                        ? <span className="text-xs">{h.openTime}–{h.closeTime}</span>
                        : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {h.avgRating != null ? (
                      <span className="text-amber-500 font-semibold">★ {h.avgRating.toFixed(1)}</span>
                    ) : "—"}
                    <span className="text-xs text-slate-400 ml-1">({h.reviewCount})</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(h)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors"
                        aria-label="Edit hospital"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h)}
                        disabled={pending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        aria-label="Delete hospital"
                        title="Delete"
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
                    {search ? "No hospitals match your search" : "No hospitals yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Hospital" : "Edit Hospital"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGrid>
            <Field label="Name" required>
              <Input value={form.name} onChange={f("name")} required placeholder="Apollo Hospital" />
            </Field>
            <Field label="Type" required>
              <Select value={form.type} onChange={f("type")}>
                {HOSPITAL_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </Select>
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Region" required>
              <Select value={form.region} onChange={f("region")} disabled={modal === "edit"}>
                <option value="BD">Bangladesh (BD)</option>
                <option value="US">United States (US)</option>
              </Select>
            </Field>
            <Field label="City" required>
              <Input value={form.city} onChange={f("city")} required placeholder="Dhaka" />
            </Field>
          </FormGrid>

          <Field label="Address">
            <Input value={form.address ?? ""} onChange={f("address")} placeholder="123 Main St" />
          </Field>

          <FormGrid>
            <Field label={form.region === "BD" ? "District" : "State"}>
              <Input
                value={form.region === "BD" ? form.district : form.state}
                onChange={f(form.region === "BD" ? "district" : "state")}
                placeholder={form.region === "BD" ? "Dhaka" : "NY"}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={f("phone")} type="tel" placeholder="+880..." />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Emergency phone">
              <Input value={form.emergencyPhone ?? ""} onChange={f("emergencyPhone")} type="tel" placeholder="+880..." />
            </Field>
            <Field label="Specialties" hint="Comma-separated">
              <Input value={form.specialties} onChange={f("specialties")} placeholder="Cardiology, Ortho" />
            </Field>
          </FormGrid>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="open24"
              checked={form.isOpen24h}
              onChange={f("isOpen24h")}
              className="rounded"
            />
            <label htmlFor="open24" className="text-sm text-slate-700 dark:text-slate-200">Open 24 hours</label>
          </div>

          {!form.isOpen24h && (
            <FormGrid>
              <Field label="Open time">
                <Input value={form.openTime ?? ""} onChange={f("openTime")} type="time" />
              </Field>
              <Field label="Close time">
                <Input value={form.closeTime ?? ""} onChange={f("closeTime")} type="time" />
              </Field>
            </FormGrid>
          )}

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

          <FormActions onCancel={() => setModal(null)} submitting={pending} />
        </form>
      </Modal>
    </>
  )
}

function TypeBadge({ type }: { type: HospitalType }) {
  const colors: Record<HospitalType, string> = {
    GOVERNMENT: "bg-blue-100 text-blue-700",
    PRIVATE:    "bg-purple-100 text-purple-700",
    DIAGNOSTIC: "bg-amber-100 text-amber-700",
    FQHC:       "bg-green-100 text-green-700",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type]}`}>
      {TYPE_LABEL[type]}
    </span>
  )
}

const TYPE_LABEL: Record<HospitalType, string> = {
  GOVERNMENT: "Govt.", PRIVATE: "Private", DIAGNOSTIC: "Diagnostic", FQHC: "FQHC",
}
