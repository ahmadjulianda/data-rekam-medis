import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '../../lib/cn'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-frame text-ink">
      <Sidebar className="sticky top-0 hidden h-screen lg:flex" />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <Sidebar
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] shadow-overlay transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main
          className={cn(
            'min-h-[calc(100vh-48px)] flex-1 border border-line bg-surface px-5 py-6',
            'mb-2 mr-2 rounded-sheet sm:px-6',
            'max-lg:mb-0 max-lg:mr-0 max-lg:rounded-none max-lg:border-0',
          )}
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
