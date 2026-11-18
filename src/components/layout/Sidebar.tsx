import { NavLink } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Pill,
  UserCog,
  Users,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Logo } from './Logo'
import { cn } from '../../lib/cn'
import { useAuth } from '../../features/auth/AuthContext'
import { can, type Permission } from '../../lib/permissions'
import { ROLE_LABELS } from '../../lib/constants'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission: Permission
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard, permission: 'records.view', end: true },
  { to: '/pasien', label: 'Pasien', icon: Users, permission: 'patients.view' },
  { to: '/rekam-medis', label: 'Rekam medis', icon: FileText, permission: 'records.view' },
  { to: '/resep', label: 'Resep', icon: Pill, permission: 'prescriptions.view' },
  { to: '/staf', label: 'Tenaga medis', icon: UserCog, permission: 'staff.manage' },
]

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  const { user, signOut, isDemo } = useAuth()
  const items = NAV.filter((item) => can(item.permission, user?.role))

  return (
    <aside className={cn('flex w-sidebar shrink-0 flex-col bg-frame px-3 py-5', className)}>
      <div className="px-3">
        <Logo />
      </div>

      <nav aria-label="Navigasi utama" className="mt-9 flex flex-col gap-1">
        <p className="mb-2 px-3 text-small text-muted">Menu utama</p>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-3 rounded-control px-3 text-body transition-colors',
                isActive
                  ? 'bg-active font-medium text-ink'
                  : 'text-muted hover:bg-active/60 hover:text-ink',
              )
            }
          >
            <Icon aria-hidden className="h-4 w-4" strokeWidth={1.6} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <NavLink
          to="/profil"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex h-9 items-center gap-3 rounded-control px-3 text-body transition-colors',
              isActive ? 'bg-active font-medium text-ink' : 'text-muted hover:bg-active/60 hover:text-ink',
            )
          }
        >
          <UserRound aria-hidden className="h-4 w-4" strokeWidth={1.6} />
          Profil saya
        </NavLink>
        {user && (
          <div className="px-3 pb-1 pt-2">
            <p className="truncate text-body font-medium text-ink">{user.fullName}</p>
            <p className="text-small text-muted">
              {ROLE_LABELS[user.role]}{isDemo ? ' · demo' : ''}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => void signOut().then(onNavigate)}
          className="flex h-9 items-center gap-3 rounded-control px-3 text-body text-muted transition-colors hover:bg-active/60 hover:text-ink"
        >
          <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.6} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
