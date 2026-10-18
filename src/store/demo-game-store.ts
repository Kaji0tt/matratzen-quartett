import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoosterPack, Card, Rarity } from '@/types'
import { migrateDemoCards } from '@/lib/demo-card-migration'
import { toast } from '@/hooks/use-toast'

export type DemoEventName =
  | 'upload_started'
  | 'upload_completed'
  | 'upload_failed'
  | 'card_generated'
  | 'card_viewed'
  | 'collection_opened'
  | 'booster_opened'
  | 'game_started'
  | 'game_finished'
  | 'game_abandoned'
  | 'shop_opened'
  | 'checkout_started'
  | 'checkout_resolved'
  | 'daily_challenge_completed'

export interface DemoEvent {
  name: DemoEventName
  at: string
  properties?: Record<string, string | number | boolean>
}

export interface DemoCheckout {
  id: string
  offer: string
  status: 'pending' | 'sandbox-approved' | 'sandbox-declined'
  createdAt: string
}

export type DemoMatchMode = 'quick' | 'stake'
export type DemoMatchResult = 'win' | 'loss' | 'draw'

interface ActiveDemoMatch {
  id: string
  mode: DemoMatchMode
  stake: number
}

interface DemoGameState {
  coins: number
  cards: Card[]
  events: DemoEvent[]
  roundsPlayed: number
  wins: number
  losses: number
  draws: number
  boostersOpened: number
  cardsContributed: number
  lastDailyReward: string | null
  completedMatchIds: string[]
  activeMatches: ActiveDemoMatch[]
  boosterRequests: Record<string, string[]>
  checkout: DemoCheckout | null
  track: (name: DemoEventName, properties?: DemoEvent['properties']) => void
  addCard: (card: Card) => boolean
  openBooster: (pack: BoosterPack, requestId: string) => Card[]
  claimDailyReward: () => boolean
  startMatch: (matchId: string, mode: DemoMatchMode) => boolean
  finishMatch: (matchId: string, result: DemoMatchResult) => boolean
  cancelMatch: (matchId: string) => void
  recoverAbandonedMatches: () => void
  startCheckout: (offer: string) => DemoCheckout
  resolveCheckout: (approved: boolean) => void
}

const rarityRank: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
}

const rarityNames: Record<Rarity, string[]> = {
  common: ['Bürgersteig-Bonanza', 'Die letzte Ölung', 'Bettina vom Bau', 'Mief im Morgenrot', 'Der Hinterhof-Held', 'Federkern-Fossil', 'Schaumstoff-Sensation'],
  rare: ['Königin der Kante', 'Der Bordstein-Baron', 'Matratze mit Migrationshintergrund'],
  epic: ['Graf von Gammel', 'Die Samtige Seuche', 'Schlafstätte des Schicksals'],
  legendary: ['Der Heilige Lattenrost', 'Uralte Ur-Matratze', 'Miefkönig der Nacht'],
}

const cities = ['Berlin', 'Hamburg', 'Köln', 'Leipzig', 'Dortmund', 'München']
const locations = ['am Späti', 'neben dem Altglas', 'hinterm Kiosk', 'auf dem Gehweg']
const abilities = [
  'Muffwolke: Gegnerische Werte -5 in der ersten Runde',
  'Federkern: Komfort +8',
  'Bürgersteig-Tarnung: Bei Gleichstand gewinnt diese Karte',
  'Fundstück des Tages: +5 Prestige',
]
const maxStoredDemoImageCharacters = 1_200_000

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeCard(rarity: Rarity, imageUrl = ''): Card {
  const values = Array.from({ length: 5 }, () => Math.floor(10 + Math.random() * 76))
  values[Math.floor(Math.random() * values.length)] = Math.floor(86 + Math.random() * 15)
  while (values.reduce((sum, value) => sum + value, 0) > 300) {
    const index = values.findIndex((value) => value > 10 && value <= 85)
    values[index] -= 1
  }

  return {
    id: makeId(),
    name: rarityNames[rarity][Math.floor(Math.random() * rarityNames[rarity].length)],
    description: [
      'Vom Regen gezeichnet, vom Spieltrieb geadelt.',
      'Niemand weiß, wie lange sie dort lag. Die Stadt schweigt.',
      'Ein Fund mit Geschichte. Und vermutlich mehreren Schichten.',
      'Sie hat mehr erlebt als dein letzter WG-Mitbewohner.',
    ][Math.floor(Math.random() * 4)],
    rarity,
    image_url: imageUrl,
    location: locations[Math.floor(Math.random() * locations.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    country: 'DE',
    condition: rarity === 'legendary' ? 'poor' : rarity === 'epic' ? 'fair' : 'good',
    stats: {
      witterung: values[0],
      ambiente: values[1],
      komfort: values[2],
      format: values[3],
      charakter: values[4],
    },
    photographer_id: 'demo-local',
    photographer_username: 'Demo-Spiel',
    created_at: new Date().toISOString(),
    is_approved: true,
    report_count: 0,
    attributes: [{ key: 'Sonderfähigkeit', value: abilities[Math.floor(Math.random() * abilities.length)] }],
  }
}

function starterCards(): Card[] {
  const names = [
    'Die solide Bordsteinliege',
    'Altbau-Auslegeware',
    'Der Kiez-Kokon',
    'Parkbank-Palast',
    'Federkern auf Abwegen',
  ]
  const stats = [
    { witterung: 25, ambiente: 45, komfort: 90, format: 75, charakter: 30 },
    { witterung: 50, ambiente: 30, komfort: 55, format: 65, charakter: 95 },
    { witterung: 95, ambiente: 45, komfort: 20, format: 55, charakter: 65 },
    { witterung: 35, ambiente: 95, komfort: 40, format: 50, charakter: 65 },
    { witterung: 45, ambiente: 35, komfort: 65, format: 95, charakter: 40 },
  ]
  const rarities: Rarity[] = ['common', 'common', 'common', 'common', 'common']

  return names.map((name, index) => ({
    ...makeCard(rarities[index]),
    id: `starter-${index + 1}`,
    name,
    city: cities[index],
    stats: stats[index],
  }))
}

export function getDemoDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function drawRarity(weights: BoosterPack['rarity_weights'], minRank = 0): Rarity {
  const eligible = (Object.entries(weights) as [Rarity, number][])
    .filter(([rarity, weight]) => weight > 0 && rarityRank[rarity] >= minRank)
  const totalWeight = eligible.reduce((sum, [, weight]) => sum + weight, 0)
  if (totalWeight <= 0) throw new Error('Für dieses Booster-Pack sind keine gültigen Seltenheiten konfiguriert.')

  let roll = Math.random() * totalWeight
  for (const [rarity, weight] of eligible) {
    roll -= weight
    if (roll < 0) return rarity
  }
  return eligible[eligible.length - 1][0]
}

function addEvent(events: DemoEvent[], event: DemoEvent): DemoEvent[] {
  return [...events, event].slice(-500)
}

function makeEvent(name: DemoEventName, properties?: DemoEvent['properties']): DemoEvent {
  return { name, at: new Date().toISOString(), properties }
}

export const useDemoGameStore = create<DemoGameState>()(
  persist(
    (set, get) => ({
      coins: 500,
      cards: starterCards(),
      events: [],
      roundsPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      boostersOpened: 0,
      cardsContributed: 0,
      lastDailyReward: null,
      completedMatchIds: [],
      activeMatches: [],
      boosterRequests: {},
      checkout: null,
      track: (name, properties) => set((state) => ({
        events: addEvent(state.events, makeEvent(name, properties)),
      })),
      addCard: (card) => {
        const current = get()
        if (current.cards.some((owned) => owned.id === card.id)) return false
        if (current.cards.length >= 500) {
          throw new Error('Die lokale Demo-Sammlung hat ihr Limit von 500 Karten erreicht.')
        }
        const imageCharacters = current.cards.reduce(
          (total, owned) => total + (owned.image_url.startsWith('data:image/') ? owned.image_url.length : 0),
          card.image_url.startsWith('data:image/') ? card.image_url.length : 0,
        )
        if (imageCharacters > maxStoredDemoImageCharacters) {
          throw new Error('Der lokale Demo-Bildspeicher ist voll. Entferne gespeicherte Demo-Karten oder nutze einen anderen Browser.')
        }
        set((state) => ({
          cards: [card, ...state.cards],
          cardsContributed: state.cardsContributed + 1,
          events: addEvent(
            addEvent(state.events, makeEvent('upload_completed')),
            makeEvent('card_generated', { rarity: card.rarity }),
          ),
        }))
        return true
      },
      openBooster: (pack, requestId) => {
        if (!requestId.trim()) throw new Error('Für das Öffnen wird eine eindeutige Anfrage-ID benötigt.')
        const state = get()
        const previousIds = state.boosterRequests[requestId]
        if (previousIds) {
          const cardsById = new Map(state.cards.map((card) => [card.id, card]))
          return previousIds.flatMap((id) => {
            const card = cardsById.get(id)
            return card ? [card] : []
          })
        }

        const weights = Object.values(pack.rarity_weights)
        if (
          !Number.isInteger(pack.price_coins)
          || pack.price_coins < 0
          || !Number.isInteger(pack.card_count)
          || pack.card_count < 1
          || pack.card_count > 20
          || weights.some((weight) => !Number.isFinite(weight) || weight < 0)
        ) throw new Error('Die Booster-Konfiguration ist ungültig.')
        if (state.cards.length + pack.card_count > 500) {
          throw new Error('Für dieses Booster-Pack ist in der lokalen Demo-Sammlung nicht genug Platz.')
        }
        if (state.coins < pack.price_coins) throw new Error('Dafür hast du nicht genug Demo-Münzen.')

        const cards = Array.from({ length: pack.card_count }, (_, index) => {
          const guaranteedRank = pack.name.toLowerCase().includes('mega') && index === 0
            ? rarityRank.rare
            : pack.name.toLowerCase().includes('legendary') && index === 0
              ? rarityRank.epic
              : 0
          return makeCard(drawRarity(pack.rarity_weights, guaranteedRank))
        })
        const event = makeEvent('booster_opened', { pack: pack.name, cards: cards.length })
        set((current) => ({
          coins: current.coins - pack.price_coins,
          cards: [...cards, ...current.cards],
          boostersOpened: current.boostersOpened + 1,
          boosterRequests: Object.fromEntries(
            Object.entries({
              ...current.boosterRequests,
              [requestId]: cards.map((card) => card.id),
            }).slice(-500),
          ),
          events: addEvent(current.events, event),
        }))
        return cards
      },
      claimDailyReward: () => {
        if (get().lastDailyReward === getDemoDayKey()) return false
        set((state) => ({
          coins: state.coins + 50,
          lastDailyReward: getDemoDayKey(),
          events: addEvent(state.events, makeEvent('daily_challenge_completed')),
        }))
        return true
      },
      startMatch: (matchId, mode) => {
        const state = get()
        if (
          !matchId
          || state.completedMatchIds.includes(matchId)
          || state.activeMatches.some((match) => match.id === matchId)
        ) return false
        const stake = mode === 'stake' ? 50 : 0
        if (state.coins < stake) return false
        set((current) => ({
          coins: current.coins - stake,
          activeMatches: [...current.activeMatches, { id: matchId, mode, stake }],
          events: addEvent(current.events, makeEvent('game_started', { mode, opponent: 'simulated' })),
        }))
        return true
      },
      finishMatch: (matchId, result) => {
        const activeMatch = get().activeMatches.find((match) => match.id === matchId)
        if (!activeMatch || get().completedMatchIds.includes(matchId)) return false
        const reward = activeMatch.mode === 'stake'
          ? result === 'win' ? 100 : result === 'draw' ? 50 : 0
          : result === 'win' ? 40 : result === 'draw' ? 20 : 10
        set((state) => ({
          coins: state.coins + reward,
          roundsPlayed: state.roundsPlayed + 1,
          wins: state.wins + Number(result === 'win'),
          losses: state.losses + Number(result === 'loss'),
          draws: state.draws + Number(result === 'draw'),
          completedMatchIds: [...state.completedMatchIds, matchId].slice(-500),
          activeMatches: state.activeMatches.filter((match) => match.id !== matchId),
          events: addEvent(state.events, makeEvent('game_finished', {
            mode: activeMatch.mode,
            result,
            reward,
          })),
        }))
        return true
      },
      cancelMatch: (matchId) => set((state) => {
        const match = state.activeMatches.find((active) => active.id === matchId)
        if (!match) return state
        return {
          coins: state.coins + match.stake,
          activeMatches: state.activeMatches.filter((active) => active.id !== matchId),
          events: addEvent(state.events, makeEvent('game_abandoned', { mode: match.mode })),
        }
      }),
      recoverAbandonedMatches: () => set((state) => {
        if (state.activeMatches.length === 0) return state
        const refundedStake = state.activeMatches.reduce((sum, match) => sum + match.stake, 0)
        const events = state.activeMatches.reduce(
          (all, match) => addEvent(all, makeEvent('game_abandoned', { mode: match.mode, recovered: true })),
          state.events,
        )
        return { coins: state.coins + refundedStake, activeMatches: [], events }
      }),
      startCheckout: (offer) => {
        if (!offer.trim()) throw new Error('Bitte wähle ein Demo-Angebot aus.')
        const checkout = {
          id: makeId(),
          offer,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          checkout,
          events: addEvent(state.events, makeEvent('checkout_started', { offer, sandbox: true })),
        }))
        return checkout
      },
      resolveCheckout: (approved) => set((state) => {
        if (!state.checkout || state.checkout.status !== 'pending') return state
        const checkout = {
          ...state.checkout,
          status: approved ? 'sandbox-approved' as const : 'sandbox-declined' as const,
        }
        return {
          checkout,
          events: addEvent(state.events, makeEvent('checkout_resolved', {
            offer: checkout.offer,
            approved,
            sandbox: true,
          })),
        }
      }),
    }),
    {
      name: 'matratzen-quartett-demo-game-v1',
      version: 2,
      migrate: migrateDemoCards,
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Demo-Spielstand konnte nicht geladen werden', error)
          toast({ title: 'Demo-Spielstand konnte nicht geladen werden', description: 'Die gespeicherten Daten bleiben im Browser erhalten. Bitte den Spielstand prüfen, bevor du weiterspielst.', variant: 'destructive' })
        }
      },
    },
  ),
)