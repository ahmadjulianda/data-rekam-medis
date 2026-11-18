import type { ReactNode } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import type { RecordStatus } from '../../types'
import { STATUS_LABELS } from '../../lib/constants'

export function LoadingState({ label = 'Memuat data…' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-body text-muted">
      <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-6 w-6 text-negative" aria-hidden />
      <p className="text-body text-ink">{message}</p>
      {onRetry && <Button size="sm" onClick={onRetry}>Coba lagi</Button>}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-section font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-body text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

const STATUS_STYLES: Record<RecordStatus, string> = {
  draft: 'bg-raised text-muted',
  completed: 'bg-[#dcfae5] text-[#04250e]',
  archived: 'bg-[#fffbeb] text-[#92400e]',
}

export function StatusPill({ status }: { status: RecordStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-small font-medium',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-title font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-body text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-section font-medium text-ink">{title}</h2>
      {action}
    </div>
  )
}
