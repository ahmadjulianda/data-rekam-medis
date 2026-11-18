import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { ROLE_LABELS } from '../../lib/constants'
import { Avatar } from '../ui/Avatar'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, isDemo } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/pasien?q=${encodeURIComponent(q)}` : '/pasien')
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Buka menu"
        className="rounded-control p-1.5 text-muted hover:bg-active lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={submit} role="search" className="ml-auto hidden max-w-[548px] flex-1 md:block">
        <div className="relative">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, NIK, atau nomor rekam medis"
            aria-label="Cari pasien"
            className="h-8 w-full rounded-control border border-control bg-surface pl-9 pr-3 text-body text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>
      </form>

      <button
        type="button"
        onClick={() => navigate('/profil')}
        className="ml-auto flex items-center gap-2.5 rounded-control py-1 pl-2 pr-1 transition-colors hover:bg-active md:ml-0"
      >
        <span className="hidden text-right leading-tight sm:block">
          <span className="block text-small font-medium text-ink">{user?.fullName}</span>
          <span className="block text-[11px] text-muted">
            {user ? ROLE_LABELS[user.role] : ''}{isDemo ? ' · demo' : ''}
          </span>
        </span>
        <Avatar name={user?.fullName ?? 'Pengguna'} size="sm" />
      </button>
    </header>
  )
}
