import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/toaster'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
