import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/35 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'my-auto w-full rounded-sheet border border-line bg-surface shadow-overlay',
          size === 'lg' ? 'max-w-3xl' : 'max-w-xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
          <div>
            <h2 className="text-section font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-small text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-control p-1 text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-rule px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
