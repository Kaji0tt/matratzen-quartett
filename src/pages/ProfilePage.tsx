import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { Trophy, BookOpen, Package, Star, Award, Coins, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { signOut } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const DEMO_ACHIEVEMENTS = [
  { key: 'first_card', name: 'Erste Karte', icon: '🛏️', unlocked: true, rarity: 'common' },
  { key: 'collector_10', name: 'Sammler', icon: '📦', unlocked: true, rarity: 'common' },
  { key: 'first_battle', name: 'Erster Kampf', icon: '⚔️', unlocked: true, rarity: 'common' },
  { key: 'photographer', name: 'Fotograf', icon: '📸', unlocked: true, rarity: 'common' },
  { key: 'first_trade', name: 'Erster Handel', icon: '🤝', unlocked: false, rarity: 'common' },
  { key: 'collector_50', name: 'Großer Sammler', icon: '🗃️', unlocked: false, rarity: 'uncommon' },
  { key: 'legendary_card', name: 'Legendär', icon: '⭐', unlocked: false, rarity: 'rare' },
  { key: 'elo_1500', name: 'Profi', icon: '🔥', unlocked: false, rarity: 'uncommon' },
]

export function ProfilePage() {
  const { profile } = useAuthStore()

  if (!profile) return <Navigate to="/auth" replace />

  const xpProgress = (profile.xp / profile.xp_to_next_level) * 100

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile header */}
        <Card className="border-border/50 mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50" />
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-background flex-shrink-0">
                {profile.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary">Level {profile.level}</Badge>
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                    {profile.elo_rating} Elo
                  </Badge>
                  {profile.is_admin && <Badge variant="destructive">Admin</Badge>}
                  {profile.is_moderator && !profile.is_admin && (
                    <Badge className="bg-purple-600">Mod</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* XP progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP bis Level {profile.level + 1}</span>
                <span className="text-muted-foreground">
                  {profile.xp.toLocaleString()} / {profile.xp_to_next_level.toLocaleString()}
                </span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: BookOpen, label: 'Karten', value: profile.cards_collected, color: 'text-blue-400' },
            { icon: Trophy, label: 'Elo-Rating', value: profile.elo_rating, color: 'text-amber-400' },
            { icon: Package, label: 'Boosters', value: profile.boosters_opened, color: 'text-purple-400' },
            { icon: Coins, label: 'Münzen', value: profile.coins, color: 'text-green-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
                <div>
                  <p className="text-lg font-bold text-white">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Achievements, Stats, Settings */}
        <Tabs defaultValue="achievements">
          <TabsList className="mb-4">
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="w-4 h-4" />
              Erfolge
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistiken
            </TabsTrigger>
            <TabsTrigger value="settings">
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEMO_ACHIEVEMENTS.map((ach) => (
                <motion.div
                  key={ach.key}
                  whileHover={ach.unlocked ? { scale: 1.03 } : undefined}
                >
                  <Card className={cn(
                    'border text-center p-4',
                    ach.unlocked
                      ? 'border-border/50 bg-card/80'
                      : 'border-border/30 bg-muted/20 opacity-50'
                  )}>
                    <div className={cn('text-3xl mb-2', !ach.unlocked && 'grayscale filter')}>
                      {ach.unlocked ? ach.icon : '🔒'}
                    </div>
                    <p className="text-xs font-semibold text-white">{ach.name}</p>
                    {ach.unlocked && (
                      <div className="flex justify-center mt-1">
                        <Star className="w-3 h-3 text-amber-400" />
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Kampf-Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Beigetragene Karten', value: profile.cards_contributed },
                    { label: 'Geöffnete Boosters', value: profile.boosters_opened },
                    { label: 'Freigeschaltete Erfolge', value: profile.achievements_unlocked },
                    { label: 'Mitglied seit', value: new Date(profile.created_at).toLocaleDateString('de-DE') },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p className="font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Account</h3>
                  <Button
                    variant="destructive"
                    onClick={signOut}
                    size="sm"
                  >
                    Abmelden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
