export const STAT_KEYS = ['alter', 'flecken', 'witterung', 'geruch', 'kontaminierung'] as const

export type Stats = Record<typeof STAT_KEYS[number], number>
export interface AIResult {
  name: string
  description: string
  stats: Stats
  reasoning: string
}

export function validStats(value: unknown): value is Stats {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 5 && STAT_KEYS.every((key) => {
      const stat = Reflect.get(value, key)
      return typeof stat === 'number' && Number.isInteger(stat) && stat >= 0 && stat <= 100
    })
}

export function parseAIResult(value: unknown): AIResult {
  if (!value || typeof value !== 'object'
    || !('name' in value) || typeof value.name !== 'string' || value.name.trim().length < 2 || value.name.length > 80
    || !('description' in value) || typeof value.description !== 'string' || value.description.trim().length < 10 || value.description.length > 1000
    || !('reasoning' in value) || typeof value.reasoning !== 'string' || value.reasoning.trim().length < 10 || value.reasoning.length > 1500
    || !('stats' in value) || !validStats(value.stats)) {
    throw new Error('Die KI hat kein gültiges Kartenergebnis geliefert.')
  }
  const stats = value.stats
  if (Object.values(stats).reduce((sum, stat) => sum + stat, 0) > 300
    || Object.values(stats).filter((stat) => stat > 85).length > 1) {
    throw new Error('Die KI-Werte verletzen die Balancing-Regeln. Bitte erneut prüfen lassen.')
  }
  return { name: value.name.trim(), description: value.description.trim(), stats, reasoning: value.reasoning.trim() }
}

export const AI_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description', 'stats', 'reasoning'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    reasoning: { type: 'string' },
    stats: {
      type: 'object',
      additionalProperties: false,
      required: [...STAT_KEYS],
      properties: Object.fromEntries(STAT_KEYS.map((key) => [key, { type: 'integer', minimum: 0, maximum: 100 }])),
    },
  },
}
