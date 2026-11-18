import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/85 focus-visible:ring-ink/30',
  secondary: 'border border-control bg-surface text-ink hover:bg-raised focus-visible:ring-ink/20',
  ghost: 'text-muted hover:bg-raised hover:text-ink focus-visible:ring-ink/20',
  danger: 'bg-negative text-white hover:bg-negative/85 focus-visible:ring-negative/30',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-9 px-4 text-body',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
