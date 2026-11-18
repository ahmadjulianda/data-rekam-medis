import { cn } from '../../lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: string
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn('flex w-full gap-6 overflow-x-auto border-b border-line', className)}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 border-b-2 pb-2.5 pt-1 text-body transition-colors',
              selected
                ? 'border-accent font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
