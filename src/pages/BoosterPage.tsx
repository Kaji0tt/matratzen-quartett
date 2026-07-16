import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Coins, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      alter: Math.floor(Math.random() * 100),
      flecken: Math.floor(Math.random() * 100),
      witterung: Math.floor(Math.random() * 100),
      geruch: Math.floor(Math.random() * 100),
      kontaminierung: Math.floor(Math.random() * 100),
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
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuthStore()

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    // card width is 78vw + gap 16px
    const itemWidth = el.clientWidth * 0.78 + 16
    const index = Math.round(el.scrollLeft / itemWidth)
    setActiveIndex(Math.max(0, Math.min(index, DEMO_BOOSTERS.length - 1)))
  }

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
    <div className="py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {profile && (
          <div className="flex items-center gap-2 mb-6 mx-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">{profile.coins.toLocaleString()} Münzen</span>
          </div>
        )}

        {/* Horizontal Snap Carousel */}
        <div className="overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingLeft: 'calc(11vw)',
              paddingRight: 'calc(11vw)',
            }}
          >
            {DEMO_BOOSTERS.map((booster, i) => {
              const isActive = i === activeIndex
              return (
                <motion.div
                  key={booster.id}
                  className="snap-center shrink-0 rounded-2xl border flex flex-col overflow-hidden cursor-pointer"
                  animate={{
                    scale: isActive ? 1 : 0.88,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  style={{
                    width: '78vw',
                    maxWidth: '320px',
                    background: booster.limited_edition
                      ? 'linear-gradient(145deg, rgba(251,191,36,0.12), rgba(168,85,247,0.1))'
                      : 'rgba(255,255,255,0.04)',
                    borderColor: booster.limited_edition
                      ? 'rgba(251,191,36,0.4)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: isActive
                      ? booster.limited_edition
                        ? '0 8px 40px rgba(251,191,36,0.2)'
                        : '0 8px 40px rgba(0,0,0,0.4)'
                      : 'none',
                  }}
                  onClick={() => isActive && setSelectedBooster(booster)}
                >
                  {/* Visual */}
                  <div className="flex items-center justify-center py-12 text-8xl select-none">
                    {booster.limited_edition ? '🌟' : '📦'}
                  </div>

                  {/* Info */}
                  <div className="px-5 pb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">{booster.name}</h3>
                      {booster.limited_edition && (
                        <Badge variant="legendary">Limited</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{booster.description}</p>

                    {/* Rarity chances */}
                    <div className="space-y-1.5">
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

                    <p className="text-xs text-muted-foreground">{booster.card_count} Karten pro Pack</p>

                    <Button
                      variant={booster.limited_edition ? 'legendary' : 'gaming'}
                      className="w-full gap-2"
                      onClick={(e) => { e.stopPropagation(); setSelectedBooster(booster) }}
                      disabled={!profile || (profile.coins < booster.price_coins)}
                    >
                      {!profile ? (
                        <><Lock className="w-4 h-4" />Anmelden</>
                      ) : (
                        <><Coins className="w-4 h-4" />{booster.price_coins} Münzen</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {DEMO_BOOSTERS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
