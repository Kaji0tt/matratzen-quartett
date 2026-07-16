import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Star, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CardDisplay } from '@/components/cards/CardDisplay'

import type { Card, Rarity } from '@/types'

type SortOption = 'name' | 'rarity' | 'acquired' | 'stats'
type FilterRarity = Rarity | 'all'

// Demo cards for display
const DEMO_CARDS: Card[] = [
  {
    id: '1', name: 'Berliner Bürgersteig-Bett', description: 'Ein klassischer Fund aus Prenzlauer Berg.',
    rarity: 'common', image_url: '', location: 'Schönhauser Allee', city: 'Berlin', country: 'DE',
    condition: 'good', stats: { fluffiness: 45, patina: 70, size: 60, findability: 80, prestige: 40 },
    photographer_id: '1', photographer_username: 'berlinlens', created_at: '2024-01-15T10:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '2', name: 'Hamburger Hafenmatratze', description: 'Direkt am Hafen mit Seeluft imprägniert.',
    rarity: 'uncommon', image_url: '', location: 'Hafenstraße', city: 'Hamburg', country: 'DE',
    condition: 'fair', stats: { fluffiness: 30, patina: 90, size: 70, findability: 50, prestige: 65 },
    photographer_id: '2', photographer_username: 'hamburgfoto', created_at: '2024-02-01T14:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '3', name: 'Münchner Oktoberfest-Rest', description: 'Nach dem Fest übrig geblieben. Legendary.',
    rarity: 'legendary', image_url: '', location: 'Theresienwiese', city: 'München', country: 'DE',
    condition: 'poor', stats: { fluffiness: 95, patina: 85, size: 80, findability: 20, prestige: 95 },
    photographer_id: '3', photographer_username: 'muenchenclick', created_at: '2024-03-10T08:00:00Z',
    is_approved: true, report_count: 0, edition_number: 1, total_editions: 10, attributes: [],
  },
  {
    id: '4', name: 'Kölner Dom-Nähe-Matratze', description: 'Mit Aussicht auf den Dom.',
    rarity: 'rare', image_url: '', location: 'Domstraße', city: 'Köln', country: 'DE',
    condition: 'excellent', stats: { fluffiness: 60, patina: 55, size: 75, findability: 65, prestige: 85 },
    photographer_id: '4', photographer_username: 'koelnfotograf', created_at: '2024-04-05T12:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '5', name: 'Frankfurter Banken-Viertel-Fund', description: 'High-Society-Matratze.',
    rarity: 'epic', image_url: '', location: 'Bankenviertel', city: 'Frankfurt', country: 'DE',
    condition: 'mint', stats: { fluffiness: 75, patina: 40, size: 85, findability: 30, prestige: 100 },
    photographer_id: '5', photographer_username: 'frankfurtsnap', created_at: '2024-05-20T16:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '6', name: 'Stuttgarter Weinberg-Lager', description: 'Zwischen Reben gefunden.',
    rarity: 'uncommon', image_url: '', location: 'Rotenberg', city: 'Stuttgart', country: 'DE',
    condition: 'good', stats: { fluffiness: 55, patina: 65, size: 50, findability: 70, prestige: 55 },
    photographer_id: '6', photographer_username: 'stuttgartpix', created_at: '2024-06-12T09:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
]

const rarityOrder: Record<Rarity, number> = {
  legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
}

export function CollectionPage() {
  const [search, setSearch] = useState('')
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all')
  const [sortBy, setSortBy] = useState<SortOption>('rarity')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const filtered = DEMO_CARDS
    .filter((c) => filterRarity === 'all' || c.rarity === filterRarity)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'rarity': return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        case 'name': return a.name.localeCompare(b.name)
        case 'acquired': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: return 0
      }
    })

  const stats = {
    total: DEMO_CARDS.length,
    legendary: DEMO_CARDS.filter(c => c.rarity === 'legendary').length,
    epic: DEMO_CARDS.filter(c => c.rarity === 'epic').length,
    rare: DEMO_CARDS.filter(c => c.rarity === 'rare').length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Meine Sammlung</h1>
            <p className="text-muted-foreground">{stats.total} Karten gesammelt</p>
          </div>
          <div className="flex gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              {stats.legendary > 0 && <Badge variant="legendary">⭐ {stats.legendary}</Badge>}
              {stats.epic > 0 && <Badge variant="epic">💜 {stats.epic}</Badge>}
              {stats.rare > 0 && <Badge variant="rare">💎 {stats.rare}</Badge>}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Karte oder Stadt suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortBy(s => s === 'rarity' ? 'name' : 'rarity')}
            title="Sortieren"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" title="Filter">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Rarity filter tabs */}
        <Tabs value={filterRarity} onValueChange={(v) => setFilterRarity(v as FilterRarity)}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">Alle ({DEMO_CARDS.length})</TabsTrigger>
            <TabsTrigger value="legendary" className="text-amber-400">Legendär</TabsTrigger>
            <TabsTrigger value="epic" className="text-purple-400">Episch</TabsTrigger>
            <TabsTrigger value="rare" className="text-blue-400">Selten</TabsTrigger>
            <TabsTrigger value="uncommon" className="text-green-400">Ungewöhnl.</TabsTrigger>
            <TabsTrigger value="common" className="text-slate-400">Gewöhnl.</TabsTrigger>
          </TabsList>

          <TabsContent value={filterRarity}>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-5xl mb-4">🔍</div>
                <p>Keine Karten gefunden.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filtered.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <CardDisplay
                      card={card}
                      size="md"
                      onClick={() => setSelectedCard(card)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}

function CardDetailModal({ card, onClose }: { card: Card; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col sm:flex-row gap-6 bg-card border border-border rounded-2xl p-6 max-w-lg w-full"
      >
        <CardDisplay card={card} size="lg" showStats={true} />
        <div className="flex flex-col justify-between flex-1">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{card.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stadt</span>
                <span className="text-white">{card.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standort</span>
                <span className="text-white">{card.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zustand</span>
                <span className="text-white capitalize">{card.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fotograf</span>
                <span className="text-white">@{card.photographer_username}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="gap-1">
              <Star className="w-3.5 h-3.5" />
              Favorit
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
