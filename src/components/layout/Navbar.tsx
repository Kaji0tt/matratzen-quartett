import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Package, BookOpen, ArrowLeftRight, Trophy, User, Bell, Menu, X, Shield, Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/boosters', label: 'Boosters', icon: Package },
  { href: '/collection', label: 'Sammlung', icon: BookOpen },
  { href: '/trading', label: 'Handel', icon: ArrowLeftRight },
  { href: '/leaderboard', label: 'Rangliste', icon: Trophy },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { profile } = useAuthStore()
  const { notificationCount } = useAppStore()

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <span className="text-2xl">🛏️</span>
            <span className="hidden sm:block font-gaming text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MATRATZEN
              <br />
              QUARTETT
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === href
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {profile && (
              <>
                {/* Coins */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">
                    {profile.coins.toLocaleString()}
                  </span>
                </div>

                {/* Notifications */}
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-4 h-4" />
                    {notificationCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      >
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </motion.span>
                    )}
                  </Button>
                </Link>

                {/* Profile */}
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>

                {/* Admin */}
                {(profile.is_admin || profile.is_moderator) && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon">
                      <Shield className="w-4 h-4 text-amber-400" />
                    </Button>
                  </Link>
                )}
              </>
            )}

            {!profile && (
              <Link to="/auth">
                <Button variant="gaming" size="sm">Anmelden</Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border md:hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                    location.pathname === href
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
