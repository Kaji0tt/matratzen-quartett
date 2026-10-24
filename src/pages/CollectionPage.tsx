import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, PackageOpen, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StreetCard } from '@/components/cards/StreetCard'
import { CardDetailModal } from '@/components/cards/CardDetailModal'
import { StreetPageHeader } from '@/components/layout/StreetPageHeader'
import { useDemoGameStore } from '@/store/demo-game-store'
import { useAuthStore } from '@/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/submissions'
import { countCollectionCopies, getCopyKind, readCardStatModifiers, selectCollectionCopy } from '@/lib/card-condition'
import type { CollectionCarouselSlide } from '@/components/cards/CardDetailModal'
import { DEMO_CARDS } from '@/lib/demo-cards'

import type { Card, Rarity } from '@/types'

type FilterRarity = Rarity | 'all'
type FilterOwned = 'all' | 'owned' | 'missing'

// Demo: which card IDs the user owns
const OWNED_IDS = new Set(['1', '3', '4'])

const rarityOrder: Record<Rarity, number> = {
  legendary: 4, epic: 3, rare: 2, common: 1,
}

const RARITY_CONFIG: { value: FilterRarity; label: string; color: string }[] = [
  { value: 'all',       label: 'Alle',      color: 'text-white' },
  { value: 'legendary', label: 'Legendär',  color: 'text-amber-400' },
  { value: 'epic',      label: 'Episch',    color: 'text-purple-400' },
  { value: 'rare',      label: 'Selten',    color: 'text-blue-400' },
  { value: 'common',    label: 'Gewöhnl.',  color: 'text-slate-400' },
]

export function CollectionPage() {
  const user = useAuthStore((state) => state.user)
  const catalogue = useQuery({
    queryKey: ['catalogue', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [cardResult, ownershipResult] = await Promise.all([
        supabase.from('cards').select('*, profiles!cards_photographer_id_fkey(username)').eq('is_approved', true).order('created_at', { ascending: false }),
        supabase.from('user_cards').select('id,card_id,user_id,acquisition_type,manual_entry_id,collectible_condition,stat_modifiers').eq('user_id', user!.id).order('acquired_at', { ascending: false }).order('id'),
      ])
      if (cardResult.error) throw cardResult.error
      if (ownershipResult.error) throw ownershipResult.error
      const copies = ownershipResult.data.map((copy) => {
        const stat_modifiers = readCardStatModifiers(copy.stat_modifiers)
        if (!stat_modifiers) throw new Error('Für ein Sammlungsexemplar fehlen die Kartenwert-Änderungen.')
        return { ...copy, stat_modifiers }
      })
      const liveCards: Card[] = cardResult.data.map((row) => {
        const copy = selectCollectionCopy(copies, row.id, row.photographer_id)
        return {
          id: row.id, name: row.name, description: row.description, rarity: row.rarity,
          image_url: row.image_url, location: row.location, city: row.city, country: row.country,
          stats: {
            witterung: row.stat_witterung, flecken: row.stat_flecken, ambiente: row.stat_ambiente,
            komfort: row.stat_komfort, charakter: row.stat_charakter,
          },
          collectible_condition: copy?.collectible_condition,
          stat_modifiers: copy?.stat_modifiers,
          copy_kind: copy ? getCopyKind(copy, row.photographer_id) : undefined,
          photographer_id: row.photographer_id,
          photographer_username: row.photographer_username ?? row.profiles?.username ?? 'Unbekannt',
          created_at: row.created_at, is_approved: row.is_approved, report_count: row.report_count,
          notes: row.notes ?? undefined,
          attributes: row.stats_need_review ? [{ key: 'Werteprüfung', value: 'Migrierte Werte bitte prüfen. Frühere Fleckenwerte wurden wiederverwendet; ohne frühere Bewertung gilt vorläufig 50.' }] : [],
        }
      })
      return {
        cards: liveCards, ownedIds: copies.map((row) => row.card_id),
        copies,
      }
    },
    staleTime: 0,
  })
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all')
  const [filterOwned, setFilterOwned] = useState<FilterOwned>('all')
  const [selectedSlides, setSelectedSlides] = useState<CollectionCarouselSlide[] | null>(null)
  const localCards = useDemoGameStore((state) => state.cards)
  const track = useDemoGameStore((state) => state.track)
  const hasTrackedOpen = useRef(false)
  const ownedCounts = countCollectionCopies(user ? catalogue.data?.ownedIds ?? [] : [...OWNED_IDS, ...localCards.map((card) => card.id)])
  const ownedIds = new Set(ownedCounts.keys())
  const cards = user
    ? catalogue.data?.cards ?? []
    : [...new Map([...localCards, ...DEMO_CARDS].map((card) => [card.id, card])).values()]
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
  const slidesForCard = (card: Card): CollectionCarouselSlide[] => {
    const copies = user
      ? (catalogue.data?.copies ?? []).filter((copy) => copy.card_id === card.id)
      : localCards.filter((copy) => copy.id === card.id)
    return copies.length
      ? copies.map((copy, index) => {
          const accountCopy = 'card_id' in copy
          return {
            id: accountCopy ? copy.id : `${card.id}-copy-${index + 1}`,
            card: {
              ...card,
              collectible_condition: copy.collectible_condition,
              stat_modifiers: copy.stat_modifiers,
              copy_kind: accountCopy ? getCopyKind(copy, card.photographer_id) : copy.copy_kind,
            },
            owned: true,
            copyNumber: copies.length > 1 ? index + 1 : undefined,
            copyTotal: copies.length > 1 ? copies.length : undefined,
          }
        })
      : [{
        id: card.id,
        card,
        owned: ownedIds.has(card.id),
      }]
  }
  const collectedCount = cards.filter((card) => ownedIds.has(card.id)).length
  const progress = cards.length ? collectedCount / cards.length * 100 : 0
  const catalogueReady = !user || catalogue.isSuccess

  useEffect(() => {
    if (hasTrackedOpen.current) return
    hasTrackedOpen.current = true
    track('collection_opened', { source: 'local-demo' })
  }, [track])

  const isFiltered = filterRarity !== 'all' || filterOwned !== 'all'

  return (
    <div className="street-screen collection-screen">
      <StreetPageHeader first="Lost &" accent="Laid" subtitle="Straßenarchiv" />
      <section className="collection-summary" aria-label="Sammlungsfortschritt und Booster">
        <div className="collection-summary__progress">
          <div className="collection-summary__numbers">
            <span><strong>{catalogueReady ? collectedCount : '–'}</strong><span> / {catalogueReady ? cards.length : '–'}</span></span>
            <span>{catalogueReady ? `${Math.floor(progress)} %` : '–'}</span>
          </div>
          <div className="collection-progress" role="progressbar" aria-label="Karten gesammelt"
            aria-valuenow={catalogueReady ? collectedCount : undefined} aria-valuemin={0}
            aria-valuemax={cards.length || 1}
            aria-valuetext={catalogueReady ? `${collectedCount} von ${cards.length} Karten gesammelt` : 'Sammlung noch nicht verfügbar'}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="collection-summary__label">gesammelt</span>
        </div>
        <Link to="/boosters" className="collection-booster-link" aria-label="Booster entdecken">
          <PackageOpen aria-hidden="true" /><span>Booster</span><ArrowRight aria-hidden="true" />
        </Link>
      </section>
      {user && catalogue.isPending && <p role="status">Deine Sammlung wird geladen …</p>}
      {user && catalogue.isError && <div role="alert"><p>{errorMessage(catalogue.error)}</p><Button variant="outline" onClick={() => catalogue.refetch()}>Erneut laden</Button></div>}
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
        <p className={search || isFiltered ? 'collection-result-count' : 'sr-only'} role="status">
          {filtered.length} Karten{search || isFiltered ? ' gefunden' : ' im Archiv'}
        </p>
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
                <div className="collection-card">
                  <button className="collection-card__open" aria-label={`${card.name}, ${ownedIds.has(card.id) ? `${ownedCounts.get(card.id)} Exemplare im Besitz` : 'fehlt noch'} – Details ansehen`}
                  onClick={() => {
                    track('card_viewed', { card_id: card.id, rarity: card.rarity })
                    setSelectedSlides(slidesForCard(card))
                  }}
                  />
                  {(ownedCounts.get(card.id) ?? 0) > 1 && (
                    <span className="collection-card__quantity" aria-hidden="true">
                      {ownedCounts.get(card.id)}
                    </span>
                  )}
                  <StreetCard card={card} owned={ownedIds.has(card.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card detail modal */}
      {selectedSlides && (
        <CardDetailModal
          slides={selectedSlides}
          onClose={() => setSelectedSlides(null)}
        />
      )}
    </div>
  )
}
