import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Sword, Users, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user_id: '1', username: 'MatresMaster99', elo_rating: 2350, level: 42, cards_collected: 287, wins: 156, losses: 23, win_rate: 87 },
  { rank: 2, user_id: '2', username: 'BürgersteigKing', elo_rating: 2180, level: 38, cards_collected: 241, wins: 134, losses: 31, win_rate: 81 },
  { rank: 3, user_id: '3', username: 'StraßenSammler', elo_rating: 2050, level: 35, cards_collected: 198, wins: 112, losses: 38, win_rate: 75 },
  { rank: 4, user_id: '4', username: 'MünchnerMatt', elo_rating: 1920, level: 31, cards_collected: 176, wins: 98, losses: 42, win_rate: 70 },
  { rank: 5, user_id: '5', username: 'HamburgerFund', elo_rating: 1850, level: 29, cards_collected: 154, wins: 87, losses: 45, win_rate: 66 },
  { rank: 6, user_id: '6', username: 'BerlinerBett', elo_rating: 1790, level: 27, cards_collected: 143, wins: 79, losses: 48, win_rate: 62 },
  { rank: 7, user_id: '7', username: 'KölnerKarton', elo_rating: 1720, level: 25, cards_collected: 132, wins: 71, losses: 52, win_rate: 58 },
  { rank: 8, user_id: '8', username: 'FrankfurterFund', elo_rating: 1680, level: 24, cards_collected: 121, wins: 65, losses: 55, win_rate: 54 },
  { rank: 9, user_id: '9', username: 'DüsseldorferDeck', elo_rating: 1630, level: 22, cards_collected: 115, wins: 60, losses: 58, win_rate: 51 },
  { rank: 10, user_id: '10', username: 'LeipzigerLager', elo_rating: 1580, level: 20, cards_collected: 108, wins: 55, losses: 62, win_rate: 47 },
]

const rankColors = ['text-amber-400', 'text-slate-300', 'text-orange-400']
const rankEmojis = ['🥇', '🥈', '🥉']

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('elo')

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Rangliste</h1>
            <p className="text-muted-foreground">Die besten Matratzen-Sammler Deutschlands</p>
          </div>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {DEMO_LEADERBOARD.slice(0, 3).map((entry, i) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn(
                'text-center border',
                i === 0 ? 'border-amber-500/50 bg-amber-500/5' :
                i === 1 ? 'border-slate-400/50 bg-slate-400/5' :
                'border-orange-400/50 bg-orange-400/5',
                i === 1 ? 'mt-4' : ''
              )}>
                <CardContent className="p-4">
                  <div className="text-3xl mb-1">{rankEmojis[i]}</div>
                  <div className={cn('text-2xl font-bold', rankColors[i])}>
                    #{entry.rank}
                  </div>
                  <div className="font-semibold text-white text-sm truncate mt-1">
                    {entry.username}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-bold text-white">{entry.elo_rating}</span> Elo
                  </div>
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      Lvl {entry.level}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {entry.win_rate}% WR
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Full leaderboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="elo" className="gap-2">
              <Crown className="w-4 h-4" />
              Elo-Rating
            </TabsTrigger>
            <TabsTrigger value="collection" className="gap-2">
              <Trophy className="w-4 h-4" />
              Sammlung
            </TabsTrigger>
            <TabsTrigger value="wins" className="gap-2">
              <Sword className="w-4 h-4" />
              Siege
            </TabsTrigger>
          </TabsList>

          {['elo', 'collection', 'wins'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {tab === 'elo' ? 'Elo-Rangliste' : tab === 'collection' ? 'Sammlungs-Rangliste' : 'Siege-Rangliste'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {DEMO_LEADERBOARD.map((entry, i) => (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-accent/30 transition-colors"
                      >
                        {/* Rank */}
                        <div className={cn(
                          'w-8 text-center font-bold',
                          i < 3 ? rankColors[i] : 'text-muted-foreground'
                        )}>
                          {i < 3 ? rankEmojis[i] : `#${entry.rank}`}
                        </div>

                        {/* Avatar placeholder */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {entry.username[0].toUpperCase()}
                        </div>

                        {/* Username + level */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{entry.username}</p>
                          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-sm">
                          {tab === 'elo' && (
                            <div className="text-right">
                              <div className="font-bold text-white">{entry.elo_rating}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                {entry.win_rate}%
                              </div>
                            </div>
                          )}
                          {tab === 'collection' && (
                            <div className="text-right">
                              <div className="font-bold text-white">{entry.cards_collected}</div>
                              <div className="text-xs text-muted-foreground">Karten</div>
                            </div>
                          )}
                          {tab === 'wins' && (
                            <div className="text-right">
                              <div className="font-bold text-white">{entry.wins}</div>
                              <div className="text-xs text-muted-foreground">{entry.losses} Niederlagen</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  )
}
