import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { Bell, ArrowLeftRight, Trophy, Star, Package, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types'

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1', user_id: 'me', type: 'trade_offer', title: 'Neues Handelsangebot',
    message: 'MatresMaster99 möchte eine Karte tauschen.', is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2', user_id: 'me', type: 'achievement_unlocked', title: 'Erfolg freigeschaltet!',
    message: 'Du hast den Erfolg "Sammler" freigeschaltet und 200 XP erhalten.', is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3', user_id: 'me', type: 'card_approved', title: 'Karte genehmigt',
    message: 'Deine Karte "Neuköllner Bettfund" wurde von einem Moderator genehmigt.',
    is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '4', user_id: 'me', type: 'battle_result', title: 'Kampf beendet',
    message: 'Du hast gegen BürgersteigKing gewonnen! +18 Elo.', is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5', user_id: 'me', type: 'level_up', title: 'Level Up! 🎉',
    message: 'Du bist jetzt Level 15! Neue Inhalte wurden freigeschaltet.', is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

const notifConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  trade_offer: { icon: ArrowLeftRight, color: 'text-blue-400' },
  trade_accepted: { icon: CheckCircle, color: 'text-green-400' },
  trade_declined: { icon: ArrowLeftRight, color: 'text-red-400' },
  achievement_unlocked: { icon: Trophy, color: 'text-amber-400' },
  level_up: { icon: Star, color: 'text-purple-400' },
  card_approved: { icon: CheckCircle, color: 'text-green-400' },
  card_rejected: { icon: Package, color: 'text-red-400' },
  battle_challenge: { icon: Trophy, color: 'text-orange-400' },
  battle_result: { icon: Trophy, color: 'text-amber-400' },
  system: { icon: Bell, color: 'text-blue-400' },
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.floor(hours / 24)
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`
}

export function NotificationsPage() {
  const { profile } = useAuthStore()
  if (!profile) return <Navigate to="/auth" replace />

  const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.is_read).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Benachrichtigungen</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} neu</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm">
              Alle als gelesen markieren
            </Button>
          )}
        </div>

        {DEMO_NOTIFICATIONS.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Keine Benachrichtigungen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {DEMO_NOTIFICATIONS.map((notif, i) => {
              const config = notifConfig[notif.type]
              const Icon = config.icon
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    'border transition-colors cursor-pointer hover:border-border',
                    !notif.is_read ? 'border-border/80 bg-card' : 'border-border/30 bg-muted/10'
                  )}>
                    <CardContent className="p-4 flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        `bg-current/10 ${config.color}`
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('font-semibold text-sm', notif.is_read ? 'text-muted-foreground' : 'text-white')}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
