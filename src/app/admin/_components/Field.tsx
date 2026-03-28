import { cn } from "@/lib/utils"

interface FieldProps {
  label:     string
  required?: boolean
  children:  React.ReactNode
  hint?:     string
}

export function Field({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
        "px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]",
        "disabled:opacity-50",
        className,
      )}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
        "px-3 py-2 text-sm text-slate-800 dark:text-slate-100",
        "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]",
        className,
      )}
    >
      {children}
    </select>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
        "px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none",
        "focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]",
        className,
      )}
    />
  )
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}

export function FormActions({ onCancel, submitting, submitLabel = "Save" }: {
  onCancel:    () => void
  submitting:  boolean
  submitLabel?: string
}) {
  return (
    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-[#06B6D4] text-white hover:bg-[#0E7490] transition-colors disabled:opacity-50"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </div>
  )
}
