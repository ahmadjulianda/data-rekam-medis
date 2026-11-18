export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-accent text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-body font-semibold text-ink">Rekam Medis</span>
          <span className="block text-small text-muted">EMR Klinik</span>
        </span>
      )}
    </div>
  )
}
