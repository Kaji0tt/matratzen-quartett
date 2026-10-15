import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/ui/toaster'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="floating-footer-content min-h-screen">
        <Outlet />
      </main>
      <Navbar />
      <Toaster />
    </div>
  )
}
