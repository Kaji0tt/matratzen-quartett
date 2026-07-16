import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import {
  Shield, Users, BookOpen, Flag, CheckCircle, XCircle,
  BarChart3, Settings, AlertTriangle, UserX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

const DEMO_PENDING_CARDS = [
  { id: '1', name: 'Neuköllner Bettfund', city: 'Berlin', photographer: 'berliner99', submitted: '2024-07-14' },
  { id: '2', name: 'Altonaer Außenmatratze', city: 'Hamburg', photographer: 'hamburgfoto', submitted: '2024-07-13' },
  { id: '3', name: 'Schwabinger Schlummer', city: 'München', photographer: 'muenchenkind', submitted: '2024-07-12' },
]

const DEMO_REPORTS = [
  { id: '1', type: 'card', target: 'Oktoberfest-Rest', reporter: 'user1', reason: 'fake_card', status: 'pending' },
  { id: '2', type: 'user', target: 'SpamUser123', reporter: 'user2', reason: 'spam', status: 'pending' },
  { id: '3', type: 'card', target: 'Alte Matratze', reporter: 'user3', reason: 'inappropriate_content', status: 'resolved' },
]

const DEMO_STATS = {
  totalUsers: 1247,
  activeToday: 89,
  totalCards: 3521,
  pendingCards: 23,
  openReports: 12,
  tradesLastWeek: 156,
}

export function AdminPage() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  if (!profile || (!profile.is_admin && !profile.is_moderator)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin-Panel</h1>
            <p className="text-muted-foreground">
              {profile.is_admin ? 'Administrator' : 'Moderator'} · {profile.username}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Karten
              {DEMO_STATS.pendingCards > 0 && (
                <Badge variant="destructive" className="text-xs ml-1 h-4 px-1">
                  {DEMO_STATS.pendingCards}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="w-4 h-4" />
              Meldungen
              {DEMO_STATS.openReports > 0 && (
                <Badge variant="destructive" className="text-xs ml-1 h-4 px-1">
                  {DEMO_STATS.openReports}
                </Badge>
              )}
            </TabsTrigger>
            {profile.is_admin && (
              <>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="w-4 h-4" />
                  Nutzer
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Einstellungen
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: Users, label: 'Gesamt-Nutzer', value: DEMO_STATS.totalUsers, color: 'text-blue-400' },
                { icon: Users, label: 'Heute aktiv', value: DEMO_STATS.activeToday, color: 'text-green-400' },
                { icon: BookOpen, label: 'Karten gesamt', value: DEMO_STATS.totalCards, color: 'text-purple-400' },
                { icon: AlertTriangle, label: 'Ausstehende Karten', value: DEMO_STATS.pendingCards, color: 'text-amber-400' },
                { icon: Flag, label: 'Offene Meldungen', value: DEMO_STATS.openReports, color: 'text-red-400' },
                { icon: BarChart3, label: 'Trades diese Woche', value: DEMO_STATS.tradesLastWeek, color: 'text-cyan-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
                    <div>
                      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Card moderation */}
          <TabsContent value="cards">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Ausstehende Karten ({DEMO_PENDING_CARDS.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {DEMO_PENDING_CARDS.map((card) => (
                    <div key={card.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                        🛏️
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{card.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {card.city} · @{card.photographer} · {card.submitted}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="gaming" size="sm" className="h-8 px-3 gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Genehmigen
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10">
                          <XCircle className="w-3.5 h-3.5" />
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Community-Meldungen</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {DEMO_REPORTS.map((report) => (
                    <div key={report.id} className="flex items-start gap-4 px-6 py-4">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        report.type === 'user' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      )}>
                        {report.type === 'user' ? <UserX className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">
                          {report.type === 'user' ? '👤' : '🃏'} {report.target}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Gemeldet von @{report.reporter} · Grund: {report.reason.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={report.status === 'pending' ? 'secondary' : 'outline'}>
                          {report.status === 'pending' ? 'Offen' : 'Erledigt'}
                        </Badge>
                        {report.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button variant="gaming" size="sm" className="h-7 px-2">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users (admin only) */}
          {profile.is_admin && (
            <TabsContent value="users">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Nutzerverwaltung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Suche nach Nutzern, vergib Moderator-Rechte, sperr Accounts.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings (admin only) */}
          {profile.is_admin && (
            <TabsContent value="settings">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">System-Einstellungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Booster-Konfiguration, Münz-Belohnungen, Wartungsmodus.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  )
}
