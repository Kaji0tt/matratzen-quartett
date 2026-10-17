import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-background">
      <main className="min-h-dvh pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <Outlet />
      </main>
      {!['/', '/collection', '/auth', '/auth/register'].includes(pathname) && (
        <Link to="/" className="page-back" aria-label="Zurück zu Home" title="Zurück zu Home">
          <ArrowLeft aria-hidden="true" />
        </Link>
      )}
      <Toaster />
    </div>
  )
}
