import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle, ShieldX } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { can, type Permission } from '../../lib/permissions'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-frame text-body text-muted">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Memuat sesi…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RoleGuard({ permission }: { permission: Permission }) {
  const { user } = useAuth()
  if (!user || can(permission, user.role)) return <Outlet />
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
      <ShieldX className="h-7 w-7 text-negative" aria-hidden />
      <h1 className="text-title font-semibold text-ink">Akses tidak tersedia</h1>
      <p className="max-w-sm text-body text-muted">
        Peran Anda tidak memiliki izin untuk membuka halaman ini. Hubungi admin klinik bila perlu
        akses.
      </p>
    </div>
  )
}
