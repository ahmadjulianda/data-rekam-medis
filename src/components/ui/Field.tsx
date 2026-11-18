import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-body font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-negative">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-small text-negative" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-small text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

const CONTROL =
  'w-full rounded-control border border-control bg-surface px-3 text-body text-ink placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, 'h-10', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(CONTROL, 'h-10 pr-8', className)} {...props}>
        {children}
      </select>
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL, 'resize-y py-2', className)} {...props} />
  },
)
