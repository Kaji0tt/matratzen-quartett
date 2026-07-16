import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Plus, Search, Clock, CheckCircle, XCircle, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CardDisplay } from '@/components/cards/CardDisplay'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import type { Card as CardType } from '@/types'

const DEMO_TRADE_CARDS: CardType[] = [
  {
    id: '1', name: 'Berliner Bürgersteig-Bett', description: '', rarity: 'common',
    image_url: '', location: '', city: 'Berlin', country: 'DE', condition: 'good',
    stats: { alter: 65, flecken: 70, witterung: 60, geruch: 50, kontaminierung: 40 },
    photographer_id: '1', photographer_username: 'berliner', created_at: '',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '2', name: 'Hamburger Hafenmatratze', description: '', rarity: 'rare',
    image_url: '', location: '', city: 'Hamburg', country: 'DE', condition: 'fair',
    stats: { alter: 80, flecken: 75, witterung: 90, geruch: 70, kontaminierung: 65 },
    photographer_id: '2', photographer_username: 'hamburger', created_at: '',
    is_approved: true, report_count: 0, attributes: [],
  },
]

interface TradeOffer {
  id: string
  partner: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  offeredCards: string[]
  requestedCards: string[]
  offeredCoins: number
  requestedCoins: number
  createdAt: string
  expiresAt: string
  direction: 'incoming' | 'outgoing'
}

const DEMO_TRADES: TradeOffer[] = [
  {
    id: '1', partner: 'MatresMaster99', status: 'pending', offeredCards: ['1'],
    requestedCards: ['2'], offeredCoins: 50, requestedCoins: 0,
    createdAt: '2024-07-10T10:00:00Z', expiresAt: '2024-07-17T10:00:00Z',
    direction: 'incoming',
  },
  {
    id: '2', partner: 'BürgersteigKing', status: 'accepted', offeredCards: ['2'],
    requestedCards: [], offeredCoins: 0, requestedCoins: 200,
    createdAt: '2024-07-08T14:00:00Z', expiresAt: '2024-07-15T14:00:00Z',
    direction: 'outgoing',
  },
]

const statusConfig = {
  pending: { color: 'text-amber-400', icon: Clock, label: 'Ausstehend', badge: 'secondary' as const },
  accepted: { color: 'text-green-400', icon: CheckCircle, label: 'Angenommen', badge: 'secondary' as const },
  declined: { color: 'text-red-400', icon: XCircle, label: 'Abgelehnt', badge: 'destructive' as const },
  cancelled: { color: 'text-slate-400', icon: XCircle, label: 'Storniert', badge: 'secondary' as const },
}

export function TradingPage() {
  const [search, setSearch] = useState('')
  const { profile } = useAuthStore()

  const marketCards = DEMO_TRADE_CARDS.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🤝</div>
        <h2 className="text-xl font-bold text-white mb-2">Anmeldung erforderlich</h2>
        <p className="text-muted-foreground">Bitte melde dich an, um Karten zu handeln.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Kartenhandel</h1>
            <p className="text-muted-foreground">Handle Karten mit anderen Spielern</p>
          </div>
          <Button variant="gaming" className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Angebot
          </Button>
        </div>

        <Tabs defaultValue="market">
          <TabsList className="mb-6">
            <TabsTrigger value="market">Marktplatz</TabsTrigger>
            <TabsTrigger value="offers">
              Meine Angebote
              {DEMO_TRADES.filter(t => t.status === 'pending' && t.direction === 'incoming').length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {DEMO_TRADES.filter(t => t.status === 'pending' && t.direction === 'incoming').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Karten auf dem Marktplatz suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {marketCards.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-5xl mb-4">🔍</div>
                <p>Keine Karten gefunden.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketCards.map((card) => (
                  <MarketCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers">
            <div className="space-y-4">
              {DEMO_TRADES.map((trade) => (
                <TradeOfferCard key={trade.id} trade={trade} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function MarketCard({ card }: { card: CardType }) {
  const price = Math.floor(Math.random() * 400) + 50
  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4 flex gap-4">
        <CardDisplay card={card} size="sm" />
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="font-semibold text-white text-sm truncate">{card.name}</h3>
            <p className="text-xs text-muted-foreground">{card.city}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-400 text-sm">{price}</span>
              <span className="text-xs text-muted-foreground">Münzen</span>
            </div>
            <Button variant="gaming" size="sm" className="w-full text-xs h-7">
              Kaufen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TradeOfferCard({ trade }: { trade: TradeOffer }) {
  const config = statusConfig[trade.status]
  const Icon = config.icon
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            {trade.direction === 'incoming' ? `Von ${trade.partner}` : `An ${trade.partner}`}
          </CardTitle>
          <div className={cn('flex items-center gap-1.5 text-sm', config.color)}>
            <Icon className="w-4 h-4" />
            {config.label}
          </div>
        </div>
        <CardDescription>
          {trade.direction === 'incoming' ? '📥 Eingehendes Angebot' : '📤 Ausgehendes Angebot'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trade.offeredCoins > 0 && (
            <span className="text-amber-400">+{trade.offeredCoins} 🪙</span>
          )}
          {trade.requestedCoins > 0 && (
            <span className="text-red-400">-{trade.requestedCoins} 🪙</span>
          )}
        </div>
        {trade.status === 'pending' && trade.direction === 'incoming' && (
          <div className="flex gap-2 mt-3">
            <Button variant="gaming" size="sm" className="flex-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Annehmen
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Ablehnen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
