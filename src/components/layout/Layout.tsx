import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
