import { Link, useLocation } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { ArrowLeftRight, Bell, ChevronDown, Shield, Store, Trophy, User, Camera, SquarePen } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

export function AccountMenu() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.user ? state.profile : null)
  const notificationCount = useAppStore((state) => state.notificationCount)
  const location = useLocation()
  const items = user
    ? [
      { href: '/profile', label: 'Profil & Einstellungen', icon: User },
      { href: '/submissions', label: 'Meine Einreichungen', icon: Camera },
      { href: '/notifications', label: 'Benachrichtigungen', icon: Bell },
      { href: '/trading', label: 'Handel', icon: ArrowLeftRight },
      { href: '/leaderboard', label: 'Rangliste', icon: Trophy },
      { href: '/shop', label: 'Shop (Demo)', icon: Store },
    ]
    : [
      { href: '/auth', label: 'Anmelden', icon: User },
      { href: '/auth/register', label: 'Registrieren', icon: User },
    ]

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button id="account-menu-trigger" type="button" aria-label="Profil und weitere Funktionen" className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
          <span className="relative shrink-0">
            <Avatar.Root className="flex h-11 w-11 overflow-hidden rounded-full border border-sky-200/40 bg-gradient-to-br from-sky-500 to-purple-700 shadow-lg">
              <Avatar.Image src={profile?.avatar_url} alt="" className="h-full w-full object-cover" />
              <Avatar.Fallback className="flex h-full w-full items-center justify-center font-bold text-white">
                {profile ? profile.username.charAt(0).toUpperCase() : <User aria-hidden="true" className="h-6 w-6" />}
              </Avatar.Fallback>
            </Avatar.Root>
            {profile && <span className="absolute -bottom-1 right-0 rounded-full border border-purple-300/60 bg-purple-950 px-1 text-[10px] text-purple-100" aria-label={`Level ${profile.level}`}>{profile.level}</span>}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{profile?.username ?? 'Willkommen'}</span>
            <span className="block text-xs text-muted-foreground">{user ? 'Profil & mehr' : 'Anmelden / Registrieren'}</span>
          </span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
          {profile && notificationCount > 0 && <span className="rounded-full bg-purple-500/25 px-2 text-xs text-purple-200" aria-label={`${notificationCount} ungelesene Benachrichtigungen`}>{notificationCount > 99 ? '99+' : notificationCount}</span>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="start" sideOffset={12} collisionPadding={12} className="floating-header floating-gradient-border floating-navigation z-[60] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-transparent p-2 text-slate-200 outline-none">
          <DropdownMenu.Label className="px-3 py-2 text-xs text-slate-400">{user ? 'Profil & weitere Funktionen' : 'Dein Account'}</DropdownMenu.Label>
          {items.map(({ href, label, icon: Icon }) => (
            <DropdownMenu.Item key={href} asChild>
              <Link to={href} aria-current={location.pathname === href ? 'page' : undefined} className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-white/10 data-[highlighted]:text-white',
                location.pathname === href && 'bg-purple-400/15 text-purple-200'
              )}>
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}
          {user && !profile?.is_banned && (profile?.is_admin || profile?.is_moderator) && <>
            <DropdownMenu.Separator className="my-2 h-px bg-white/20" />
            <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-amber-200">Verwaltung</DropdownMenu.Label>
            {[
              { href: '/admin', label: 'Administration', icon: Shield },
              { href: '/admin/cards', label: 'Manueller Karteneditor', icon: SquarePen },
            ].map(({ href, label, icon: Icon }) => <DropdownMenu.Item key={href} asChild>
              <Link to={href} aria-current={location.pathname === href ? 'page' : undefined} className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-white/10 data-[highlighted]:text-white',
                location.pathname === href && 'bg-purple-400/15 text-purple-200'
              )}><Icon aria-hidden="true" className="h-4 w-4" />{label}</Link>
            </DropdownMenu.Item>)}
          </>}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
