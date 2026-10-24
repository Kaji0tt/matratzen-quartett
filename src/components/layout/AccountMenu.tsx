import { useCallback, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { ArrowLeftRight, Bell, ChevronDown, Shield, Store, Trophy, User, Camera, SquarePen, Crown } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

export function AccountMenu() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.user ? state.profile : null)
  const notificationCount = useAppStore((state) => state.notificationCount)
  const location = useLocation()
  const [canScrollDown, setCanScrollDown] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)
  const nodeRef = useRef<HTMLDivElement | null>(null)

  const updateScrollHint = useCallback(() => {
    const node = nodeRef.current
    if (node) setCanScrollDown(node.scrollHeight - node.scrollTop - node.clientHeight > 2)
  }, [])

  // Callback ref: the scroll area only exists while the portal is open.
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    nodeRef.current = node
    if (!node) return
    observerRef.current = new ResizeObserver(updateScrollHint)
    observerRef.current.observe(node)
    Array.from(node.children).forEach((child) => observerRef.current?.observe(child))
    updateScrollHint()
  }, [updateScrollHint])

  const xpProgress = profile && profile.xp_to_next_level > 0
    ? Math.min(100, (profile.xp / profile.xp_to_next_level) * 100)
    : 0
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
        <button id="account-menu-trigger" type="button" aria-label="Profil und weitere Funktionen" className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl text-left outline-none transition-[filter] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-purple-400 data-[state=open]:brightness-125">
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
        <DropdownMenu.Content align="start" sideOffset={12} collisionPadding={12} className="account-menu-panel floating-gradient-border floating-navigation z-[60] flex flex-col rounded-2xl text-slate-200 outline-none">
          <div ref={scrollRef} onScroll={updateScrollHint} className="account-menu-scroll">
          <DropdownMenu.Label className="account-menu-player">
            {profile ? (
              <>
                <Avatar.Root className="account-menu-player__avatar">
                  <Avatar.Image src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  <Avatar.Fallback className="flex h-full w-full items-center justify-center font-bold text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span className="account-menu-player__details">
                  <span className="account-menu-player__eyebrow"><Crown aria-hidden="true" /> SPIELERKARTE</span>
                  <span className="account-menu-player__name">{profile.username}</span>
                  <span className="account-menu-player__level">LEVEL {profile.level}</span>
                  <span className="account-menu-player__xp" role="progressbar" aria-label="Fortschritt bis zum nächsten Level" aria-valuemin={0} aria-valuemax={profile.xp_to_next_level} aria-valuenow={Math.min(profile.xp, profile.xp_to_next_level)}>
                    <span style={{ width: `${xpProgress}%` }} />
                  </span>
                  <span className="account-menu-player__xp-label">{profile.xp.toLocaleString('de-DE')} / {profile.xp_to_next_level.toLocaleString('de-DE')} XP</span>
                </span>
              </>
            ) : (
              <span className="account-menu-player__guest">
                <span className="account-menu-player__eyebrow"><Crown aria-hidden="true" /> SPIELERKARTE</span>
                <span className="account-menu-player__name">Dein Account</span>
                <span className="account-menu-player__xp-label">Melde dich an und werde Teil des Spiels.</span>
              </span>
            )}
          </DropdownMenu.Label>
          <DropdownMenu.Label className="account-menu-section">DEIN BEREICH</DropdownMenu.Label>
          {items.map(({ href, label, icon: Icon }) => (
            <DropdownMenu.Item key={href} asChild>
              <Link to={href} aria-current={location.pathname === href ? 'page' : undefined} className={cn(
                'account-menu-item group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold outline-none',
                location.pathname === href && 'account-menu-item--active'
              )}>
                <span className="account-menu-item__icon"><Icon aria-hidden="true" /></span>
                <span className="account-menu-item__label">{label}</span>
                {href === '/notifications' && notificationCount > 0 && <span className="account-menu-item__count" aria-label={`${notificationCount} ungelesen`}>{notificationCount > 99 ? '99+' : notificationCount}</span>}
              </Link>
            </DropdownMenu.Item>
          ))}
          {user && !profile?.is_banned && (profile?.is_admin || profile?.is_moderator) && <>
            <DropdownMenu.Separator className="account-menu-separator" />
            <DropdownMenu.Label className="account-menu-section account-menu-section--admin">VERWALTUNG</DropdownMenu.Label>
            {[
              { href: '/admin', label: 'Administration', icon: Shield },
              { href: '/admin/cards', label: 'Manueller Karteneditor', icon: SquarePen },
            ].map(({ href, label, icon: Icon }) => <DropdownMenu.Item key={href} asChild>
              <Link to={href} aria-current={location.pathname === href ? 'page' : undefined} className={cn(
                'account-menu-item group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold outline-none',
                location.pathname === href && 'account-menu-item--active'
              )}><span className="account-menu-item__icon"><Icon aria-hidden="true" /></span><span className="account-menu-item__label">{label}</span></Link>
            </DropdownMenu.Item>)}
          </>}
          </div>
          <div className={cn('account-menu-more', canScrollDown && 'account-menu-more--visible')} aria-hidden="true">
            <ChevronDown />
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
