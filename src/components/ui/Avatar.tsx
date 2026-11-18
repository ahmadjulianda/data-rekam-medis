import { PERSON_TINTS } from '../../lib/constants'
import { inisial } from '../../lib/format'
import { cn } from '../../lib/cn'

function tintFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PERSON_TINTS[hash % PERSON_TINTS.length]
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const tint = tintFor(name)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-small',
      )}
      style={{ backgroundColor: tint.bg, color: tint.ink }}
    >
      {inisial(name)}
    </span>
  )
}
