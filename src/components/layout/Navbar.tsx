import { Link, useLocation } from 'react-router-dom'
import { House, PackageOpen, Swords } from 'lucide-react'
import { PlayingCards } from '@/components/ui/playing-cards'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Home', icon: House },
  { href: '/training', label: 'Spielen', icon: Swords },
  { href: '/collection', label: 'Kollektion', icon: PlayingCards },
  { href: '/boosters', label: 'Booster', icon: PackageOpen },
]

export function Navbar() {
  const { pathname } = useLocation()
  const activeHref = pathname === '/shop' ? '/boosters'
    : items.find(({ href }) => href !== '/' && pathname === href)?.href ?? '/'

  return (
    <footer className="floating-footer-position pointer-events-none fixed inset-x-0 z-40 px-3 sm:px-6">
      <nav
        aria-label="Hauptnavigation"
        className="floating-header floating-gradient-border home-navigation pointer-events-auto mx-auto grid w-full max-w-[960px] grid-cols-4 gap-1 rounded-[1.5rem] border border-transparent p-2 text-slate-100 sm:gap-3"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = activeHref === href
          return (
            <Link
              key={href}
              to={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-purple-400',
                isActive ? 'bg-purple-400/15 text-purple-100' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <span className={cn(
                'floating-gradient-border flex h-10 w-10 items-center justify-center rounded-full border border-transparent',
                isActive ? 'floating-booster-button text-purple-950' : 'floating-menu-trigger text-slate-200'
              )}>
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </footer>
  )
}
