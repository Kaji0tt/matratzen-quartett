import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Search, SlidersHorizontal, Layers, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StreetCard } from '@/components/cards/StreetCard'
import { StreetPageHeader } from '@/components/layout/StreetPageHeader'
import { useDemoGameStore } from '@/store/demo-game-store'

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
  const localCards = useDemoGameStore((state) => state.cards)
  const track = useDemoGameStore((state) => state.track)
  const hasTrackedOpen = useRef(false)
  const ownedIds = new Set([...OWNED_IDS, ...localCards.map((card) => card.id)])
  const cards = [...localCards, ...DEMO_CARDS]

  useEffect(() => {
    if (hasTrackedOpen.current) return
    hasTrackedOpen.current = true
    track('collection_opened', { source: 'local-demo' })
  }, [track])

  const isFiltered = filterRarity !== 'all' || filterOwned !== 'all'

  const filtered = cards
    .filter((c) => filterRarity === 'all' || c.rarity === filterRarity)
    .filter((c) => {
      if (filterOwned === 'owned') return ownedIds.has(c.id)
      if (filterOwned === 'missing') return !ownedIds.has(c.id)
      return true
    })
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])

  return (
    <div className="street-screen collection-screen">
      <StreetPageHeader first="Lost &" accent="Laid" subtitle="Deine Bordsteinjuwelen" />
      <section className="home-panel collection-overview" aria-label="Sammlungsfortschritt">
        <div>
          <span className="home-brush-label home-brush-label--small">STREET ARCHIVE</span>
          <h2>{ownedIds.size} <span>/ {cards.length} Karten</span></h2>
          <p>Schon gesichert. Der nächste Fund wartet.</p>
          <div className="collection-progress" role="progressbar" aria-label="Karten im Besitz" aria-valuenow={ownedIds.size} aria-valuemin={0} aria-valuemax={cards.length}>
            <span style={{ width: `${ownedIds.size / cards.length * 100}%` }} />
          </div>
        </div>
        <Link to="/boosters" className="home-cta">Booster entdecken<ArrowRight aria-hidden="true" /></Link>
        <Layers className="collection-overview__icon" aria-hidden="true" />
      </section>
      <p className="street-demo-note">Demo-Sammlung · Booster-Karten und eigene Demo-Funde bleiben in diesem Browser.</p>
      <section className="collection-toolbar" aria-label="Sammlung durchsuchen">
        <div className="collection-search-row">
          <Link to="/" className="page-back collection-toolbar__back" aria-label="Zurück zu Home" title="Zurück zu Home">
            <ArrowLeft aria-hidden="true" />
          </Link>
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              aria-label="Karte oder Stadt suchen"
              placeholder="Karte oder Stadt suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="collection-search h-[52px] pl-12 text-base text-white placeholder:text-white/40 focus-visible:ring-purple-400"
            />
          </div>

          <button
            onClick={() => setFilterOpen(o => !o)}
            aria-label={`Kartenfilter${isFiltered ? ' (aktiv)' : ''}`}
            aria-expanded={filterOpen}
            aria-controls="collection-filters"
            className={`street-filter-toggle${filterOpen || isFiltered ? ' is-active' : ''}`}
          >
            <SlidersHorizontal aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {filterOpen && (
          <div
            id="collection-filters"
            className="collection-filters space-y-4"
          >
              {/* Rarität */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Rarität</p>
                <div className="flex flex-wrap gap-1.5">
                  {RARITY_CONFIG.map(({ value, label, color }) => {
                    const count = value === 'all' ? cards.length : cards.filter(c => c.rarity === value).length
                    const active = filterRarity === value
                    return (
                      <button
                        key={value}
                        aria-pressed={active}
                        onClick={() => setFilterRarity(value)}
                        className={`min-h-11 px-3 py-1 rounded-full text-xs font-medium transition-all ${
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
                        aria-pressed={active}
                        onClick={() => setFilterOwned(value)}
                        className={`flex-1 min-h-11 py-1.5 rounded-full text-xs font-medium transition-all ${
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
          </div>
        )}
      </section>

      <div className="collection-results">
        <div className="street-section-heading">
          <h2>Deine Fundstücke</h2>
          <span role="status">{filtered.length} Karten{search || isFiltered ? ' gefunden' : ' im Archiv'}</span>
        </div>
        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="home-panel collection-empty">
            <Search aria-hidden="true" />
            <h3>Hier liegt noch nichts.</h3>
            <p>Keine Karten für diese Suche gefunden.</p>
            <button className="street-secondary" onClick={() => { setSearch(''); setFilterRarity('all'); setFilterOwned('all') }}>Suche zurücksetzen<X aria-hidden="true" /></button>
          </div>
        ) : (
          <div className="collection-grid">
            {filtered.map((card) => (
              <div key={card.id} className="collection-item">
                <button className="collection-card" aria-label={`${card.name}, ${ownedIds.has(card.id) ? 'im Besitz' : 'fehlt noch'} – Details ansehen`}
                  onClick={() => {
                    track('card_viewed', { card_id: card.id, rarity: card.rarity })
                    setSelectedCard(card)
                  }}
                ><StreetCard card={card} /></button>
                <span className={`collection-ownership${ownedIds.has(card.id) ? ' is-owned' : ''}`}>
                  {ownedIds.has(card.id) ? <Check aria-hidden="true" /> : <span aria-hidden="true">+</span>}
                  {ownedIds.has(card.id) ? 'Im Besitz' : 'Fehlt noch'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="street-card-dialog">
        <div className="collection-detail-card"><StreetCard card={card} /></div>
        <div className="flex flex-col justify-between flex-1">
          <div>
            <DialogTitle className="text-xl font-bold text-white mb-1">{card.name}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-4">{card.description}</DialogDescription>
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
            <Button variant="ghost" size="sm" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
