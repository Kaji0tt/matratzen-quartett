import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BoosterOpening } from '@/components/booster/BoosterOpening'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import type { BoosterPack, Card as CardType } from '@/types'

// Demo booster data (would come from Supabase in production)
const DEMO_BOOSTERS: BoosterPack[] = [
  {
    id: '1',
    name: 'Standard Pack',
    description: 'Das klassische Booster-Pack mit 5 Karten.',
    image_url: '',
    price_coins: 100,
    card_count: 5,
    rarity_weights: { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 },
    is_available: true,
    limited_edition: false,
  },
  {
    id: '2',
    name: 'Premium Pack',
    description: 'Erhöhte Chancen auf seltene Karten!',
    image_url: '',
    price_coins: 250,
    card_count: 5,
    rarity_weights: { common: 40, uncommon: 30, rare: 20, epic: 8, legendary: 2 },
    is_available: true,
    limited_edition: false,
  },
  {
    id: '3',
    name: 'Mega Pack',
    description: '10 Karten mit garantierter seltener Karte.',
    image_url: '',
    price_coins: 400,
    card_count: 10,
    rarity_weights: { common: 35, uncommon: 30, rare: 25, epic: 8, legendary: 2 },
    is_available: true,
    limited_edition: false,
  },
  {
    id: '4',
    name: '🌟 Legendary Pack',
    description: 'Garantierte epische oder legendäre Karte!',
    image_url: '',
    price_coins: 1000,
    card_count: 5,
    rarity_weights: { common: 0, uncommon: 20, rare: 40, epic: 30, legendary: 10 },
    is_available: true,
    limited_edition: true,
  },
]

function generateDemoCards(pack: BoosterPack): CardType[] {
  const rarities: CardType['rarity'][] = []
  for (let i = 0; i < pack.card_count; i++) {
    const rand = Math.random() * 100
    let cumulative = 0
    let chosen: CardType['rarity'] = 'common'
    for (const [rarity, weight] of Object.entries(pack.rarity_weights)) {
      cumulative += weight
      if (rand <= cumulative) {
        chosen = rarity as CardType['rarity']
        break
      }
    }
    rarities.push(chosen)
  }

  const names = ['Wohnungsauflösung', 'Bürgersteig-Bett', 'Parkbank-Begleiter', 'Hinterhof-Hüter', 'Straßenlager', 'Kellerfund', 'Dachboden-Schatz']
  const cities = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf']

  return rarities.map((rarity, i) => ({
    id: `demo-${Date.now()}-${i}`,
    name: names[Math.floor(Math.random() * names.length)],
    description: 'Eine gefundene Straßenmatratze mit Geschichte.',
    rarity,
    image_url: '',
    location: 'Hauptstraße',
    city: cities[Math.floor(Math.random() * cities.length)],
    country: 'DE',
    condition: 'good' as const,
    stats: {
      fluffiness: Math.floor(Math.random() * 100),
      patina: Math.floor(Math.random() * 100),
      size: Math.floor(Math.random() * 100),
      findability: Math.floor(Math.random() * 100),
      prestige: Math.floor(Math.random() * 100),
    },
    photographer_id: 'demo',
    photographer_username: 'demo',
    created_at: new Date().toISOString(),
    is_approved: true,
    report_count: 0,
    attributes: [],
  }))
}

export function BoosterPage() {
  const [selectedBooster, setSelectedBooster] = useState<BoosterPack | null>(null)
  const { profile } = useAuthStore()

  const handleOpenBooster = async (): Promise<CardType[]> => {
    if (!selectedBooster) return []
    // In production: call Supabase RPC/Edge Function
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateDemoCards(selectedBooster)
  }

  const handleComplete = () => {
    setSelectedBooster(null)
    toast({ title: 'Karten zur Sammlung hinzugefügt!', variant: 'default' })
  }

  if (selectedBooster) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BoosterOpening
          booster={selectedBooster}
          onOpen={handleOpenBooster}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Booster-Packs</h1>
        <p className="text-muted-foreground mb-8">
          Öffne Packs und entdecke neue Matratzen-Karten!
        </p>

        {profile && (
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">{profile.coins.toLocaleString()} Münzen</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_BOOSTERS.map((booster, i) => (
            <motion.div
              key={booster.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`border-border/50 h-full flex flex-col ${
                  booster.limited_edition ? 'border-amber-500/40 bg-amber-500/5' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{booster.name}</CardTitle>
                    {booster.limited_edition && (
                      <Badge variant="legendary">Limited</Badge>
                    )}
                  </div>
                  <CardDescription>{booster.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="text-5xl text-center py-4">
                    {booster.limited_edition ? '🌟' : '📦'}
                  </div>

                  {/* Rarity chances */}
                  <div className="space-y-1.5 mt-2">
                    {Object.entries(booster.rarity_weights)
                      .filter(([, w]) => w > 0)
                      .map(([rarity, weight]) => (
                        <div key={rarity} className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${
                            rarity === 'legendary' ? 'text-amber-400' :
                            rarity === 'epic' ? 'text-purple-400' :
                            rarity === 'rare' ? 'text-blue-400' :
                            rarity === 'uncommon' ? 'text-green-400' :
                            'text-slate-400'
                          }`}>
                            {rarity === 'legendary' ? 'Legendär' :
                             rarity === 'epic' ? 'Episch' :
                             rarity === 'rare' ? 'Selten' :
                             rarity === 'uncommon' ? 'Ungewöhnlich' : 'Gewöhnlich'}
                          </span>
                          <span className="text-muted-foreground">{weight}%</span>
                        </div>
                      ))}
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    {booster.card_count} Karten pro Pack
                  </p>
                </CardContent>

                <CardFooter>
                  <Button
                    variant={booster.limited_edition ? 'legendary' : 'gaming'}
                    className="w-full gap-2"
                    onClick={() => setSelectedBooster(booster)}
                    disabled={!profile || (profile.coins < booster.price_coins)}
                  >
                    {!profile ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Anmelden
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        {booster.price_coins} Münzen
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
