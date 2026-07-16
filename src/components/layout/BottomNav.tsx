import { Link, useLocation } from 'react-router-dom'
import { Home, Package, BookOpen, ArrowLeftRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/boosters', label: 'Booster', icon: Package },
  { href: '/collection', label: 'Sammlung', icon: BookOpen },
  { href: '/trading', label: 'Handel', icon: ArrowLeftRight },
  { href: '/leaderboard', label: 'Rangliste', icon: Trophy },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/50 bg-background/90 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 h-full">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = location.pathname === href
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'scale-110 transition-transform')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
