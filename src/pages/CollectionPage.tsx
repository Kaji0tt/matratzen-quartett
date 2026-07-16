import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardDisplay } from '@/components/cards/CardDisplay'

import type { Card, Rarity } from '@/types'

type FilterRarity = Rarity | 'all'
type FilterOwned = 'all' | 'owned' | 'missing'

// Demo: which card IDs the user owns
const OWNED_IDS = new Set(['1', '3', '4'])

// Demo cards for display
const DEMO_CARDS: Card[] = [
  {
    id: '1', name: 'Berliner Bürgersteig-Bett', description: 'Ein klassischer Fund aus Prenzlauer Berg.',
    rarity: 'common', image_url: '', location: 'Schönhauser Allee', city: 'Berlin', country: 'DE',
    condition: 'good', stats: { alter: 65, flecken: 70, witterung: 60, geruch: 50, kontaminierung: 40 },
    photographer_id: '1', photographer_username: 'berlinlens', created_at: '2024-01-15T10:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '2', name: 'Hamburger Hafenmatratze', description: 'Direkt am Hafen mit Seeluft imprägniert.',
    rarity: 'uncommon', image_url: '', location: 'Hafenstraße', city: 'Hamburg', country: 'DE',
    condition: 'fair', stats: { alter: 80, flecken: 75, witterung: 90, geruch: 70, kontaminierung: 65 },
    photographer_id: '2', photographer_username: 'hamburgfoto', created_at: '2024-02-01T14:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '3', name: 'Münchner Oktoberfest-Rest', description: 'Nach dem Fest übrig geblieben. Legendary.',
    rarity: 'legendary', image_url: '', location: 'Theresienwiese', city: 'München', country: 'DE',
    condition: 'poor', stats: { alter: 95, flecken: 85, witterung: 80, geruch: 85, kontaminierung: 95 },
    photographer_id: '3', photographer_username: 'muenchenclick', created_at: '2024-03-10T08:00:00Z',
    is_approved: true, report_count: 0, edition_number: 1, total_editions: 10, attributes: [],
  },
  {
    id: '4', name: 'Kölner Dom-Nähe-Matratze', description: 'Mit Aussicht auf den Dom.',
    rarity: 'rare', image_url: '', location: 'Domstraße', city: 'Köln', country: 'DE',
    condition: 'excellent', stats: { alter: 50, flecken: 55, witterung: 75, geruch: 45, kontaminierung: 35 },
    photographer_id: '4', photographer_username: 'koelnfotograf', created_at: '2024-04-05T12:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '5', name: 'Frankfurter Banken-Viertel-Fund', description: 'High-Society-Matratze.',
    rarity: 'epic', image_url: '', location: 'Bankenviertel', city: 'Frankfurt', country: 'DE',
    condition: 'mint', stats: { alter: 30, flecken: 10, witterung: 20, geruch: 15, kontaminierung: 5 },
    photographer_id: '5', photographer_username: 'frankfurtsnap', created_at: '2024-05-20T16:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '6', name: 'Stuttgarter Weinberg-Lager', description: 'Zwischen Reben gefunden.',
    rarity: 'uncommon', image_url: '', location: 'Rotenberg', city: 'Stuttgart', country: 'DE',
    condition: 'good', stats: { alter: 55, flecken: 45, witterung: 50, geruch: 40, kontaminierung: 35 },
    photographer_id: '6', photographer_username: 'stuttgartpix', created_at: '2024-06-12T09:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
]

const rarityOrder: Record<Rarity, number> = {
  legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
}

const RARITY_CONFIG: { value: FilterRarity; label: string; color: string }[] = [
  { value: 'all',       label: 'Alle',      color: 'text-white' },
  { value: 'legendary', label: 'Legendär',  color: 'text-amber-400' },
  { value: 'epic',      label: 'Episch',    color: 'text-purple-400' },
  { value: 'rare',      label: 'Selten',    color: 'text-blue-400' },
  { value: 'uncommon',  label: 'Ungewöhnl.', color: 'text-green-400' },
  { value: 'common',    label: 'Gewöhnl.',  color: 'text-slate-400' },
]

export function CollectionPage() {
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all')
  const [filterOwned, setFilterOwned] = useState<FilterOwned>('all')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const isFiltered = filterRarity !== 'all' || filterOwned !== 'all'

  const filtered = DEMO_CARDS
    .filter((c) => filterRarity === 'all' || c.rarity === filterRarity)
    .filter((c) => {
      if (filterOwned === 'owned') return OWNED_IDS.has(c.id)
      if (filterOwned === 'missing') return !OWNED_IDS.has(c.id)
      return true
    })
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar + Filter – fixed, liquid glass */}
      <div className="fixed top-[4.5rem] left-0 right-0 z-40 px-4">
        <div className="flex gap-2 max-w-lg mx-auto">
          {/* Search pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex-1"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Karte oder Stadt suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-transparent border-none rounded-full text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </motion.div>

          {/* Filter button */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setFilterOpen(o => !o)}
            className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center"
            style={{
              background: isFiltered ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderRadius: '9999px',
              border: isFiltered ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <SlidersHorizontal className="w-4 h-4 text-white/70" />
            {isFiltered && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-purple-400 rounded-full" />
            )}
          </motion.button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="mt-2 max-w-lg mx-auto p-4 space-y-4"
              style={{
                background: 'rgba(15,15,25,0.75)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                borderRadius: '1.25rem',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Rarität */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Rarität</p>
                <div className="flex flex-wrap gap-1.5">
                  {RARITY_CONFIG.map(({ value, label, color }) => {
                    const count = value === 'all' ? DEMO_CARDS.length : DEMO_CARDS.filter(c => c.rarity === value).length
                    const active = filterRarity === value
                    return (
                      <button
                        key={value}
                        onClick={() => setFilterRarity(value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          active
                            ? 'bg-white/20 ring-1 ring-white/40'
                            : 'bg-white/5 hover:bg-white/10'
                        } ${color}`}
                      >
                        {label} <span className="opacity-60">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Besitz */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Besitz</p>
                <div className="flex gap-1.5">
                  {(['all', 'owned', 'missing'] as FilterOwned[]).map((value) => {
                    const labels = { all: 'Alle', owned: 'Besitze ich', missing: 'Fehlt mir' }
                    const active = filterOwned === value
                    return (
                      <button
                        key={value}
                        onClick={() => setFilterOwned(value)}
                        className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                          active
                            ? 'bg-white/20 text-white ring-1 ring-white/40'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {labels[value]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-14">
        {/* Cards Grid */}
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
