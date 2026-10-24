export const COLLECTIBLE_CONDITIONS = [
  { value: 'mint', label: 'Mint', code: 'MT', description: 'Makellos' },
  { value: 'near_mint', label: 'Near Mint', code: 'NM', description: 'Nahezu makellos' },
  { value: 'excellent', label: 'Excellent', code: 'EX', description: 'Minimale Gebrauchsspuren' },
  { value: 'good', label: 'Good', code: 'GD', description: 'Leichte Gebrauchsspuren' },
  { value: 'light_played', label: 'Light Played', code: 'LP', description: 'Sichtbar gespielt' },
  { value: 'played', label: 'Played', code: 'PL', description: 'Stark bespielt' },
  { value: 'poor', label: 'Poor', code: 'PO', description: 'Stark beschädigt' },
] as const

export const EDITOR_CONDITION = {
  value: 'editor',
  label: 'Editor',
  code: 'ED',
  description: 'Fest zugewiesenes Original des Spielers',
} as const

export type CollectibleCondition = typeof COLLECTIBLE_CONDITIONS[number]['value'] | typeof EDITOR_CONDITION.value
export const CARD_STAT_KEYS = ['witterung', 'flecken', 'ambiente', 'komfort', 'charakter'] as const
export type CardStatKey = typeof CARD_STAT_KEYS[number]
export type CardStatModifiers = Record<CardStatKey, number>
export type CardStatValues = Record<CardStatKey, number>

export interface CollectionCopy {
  id?: string
  card_id: string
  user_id: string
  acquisition_type: string
  manual_entry_id: string | null
  collectible_condition: CollectibleCondition | null
  stat_modifiers?: CardStatModifiers
}

export function countCollectionCopies(cardIds: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const cardId of cardIds) {
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1)
  }
  return counts
}

export function getCopyKind(copy: CollectionCopy, photographerId: string): 'editor' | 'creator' | undefined {
  if (copy.manual_entry_id !== null) return 'editor'
  if (copy.acquisition_type === 'gift' && copy.user_id === photographerId) return 'creator'
  return undefined
}

export function selectCollectionCopy(copies: CollectionCopy[], cardId: string, photographerId: string) {
  const matching = copies.filter((copy) => copy.card_id === cardId)
  return matching.find((copy) => getCopyKind(copy, photographerId) === 'editor')
    ?? matching.find((copy) => getCopyKind(copy, photographerId) === 'creator')
    ?? matching[0]
}

export function rollCardStatModifiers(random = Math.random): CardStatModifiers {
  const modifiers = {} as CardStatModifiers
  for (const key of CARD_STAT_KEYS) {
    const roll = random()
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
      throw new Error('Der Zufallswert für einen Kartenwert muss zwischen 0 (inklusive) und 1 (exklusive) liegen.')
    }
    modifiers[key] = Math.floor(roll * 11) - 5
  }
  return modifiers
}

export function readCardStatModifiers(value: unknown): CardStatModifiers | null {
  if (value === null || value === undefined) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Die gespeicherten Kartenwert-Änderungen sind ungültig.')
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== CARD_STAT_KEYS.length
    || !CARD_STAT_KEYS.every((key) => Number.isInteger(record[key]) && (record[key] as number) >= -5 && (record[key] as number) <= 5)) {
    throw new Error('Die gespeicherten Kartenwert-Änderungen müssen fünf ganze Zahlen von −5 bis +5 enthalten.')
  }
  return Object.fromEntries(CARD_STAT_KEYS.map((key) => [key, record[key]])) as CardStatModifiers
}

export function getModifierTotal(modifiers: CardStatModifiers): number {
  return CARD_STAT_KEYS.reduce((total, key) => total + modifiers[key], 0)
}

export function conditionForModifierTotal(total: number): CollectibleCondition {
  if (!Number.isInteger(total) || total < -25 || total > 25) {
    throw new Error('Die Summe der Kartenwert-Änderungen muss zwischen −25 und +25 liegen.')
  }
  if (total >= 20) return 'mint'
  if (total >= 14) return 'near_mint'
  if (total >= 8) return 'excellent'
  if (total >= -7) return 'good'
  if (total >= -13) return 'light_played'
  if (total >= -19) return 'played'
  return 'poor'
}

export function applyCardStatModifiers(stats: CardStatValues, modifiers?: CardStatModifiers | null): CardStatValues {
  return Object.fromEntries(CARD_STAT_KEYS.map((key) => [
    key,
    Math.max(0, stats[key] + (modifiers?.[key] ?? 0)),
  ])) as CardStatValues
}
