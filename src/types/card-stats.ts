import type { CardStats } from './index.ts'

export const STAT_FIELDS: { key: keyof CardStats; label: string; hint: string }[] = [
  { key: 'witterung', label: 'Witterung', hint: 'Sichtbare Spuren von Regen, Sonne und Straßenleben. Hoch = stark verwittert; Flecken allein sind kein Wetterbeweis.' },
  { key: 'flecken', label: 'Flecken', hint: 'Wie viel der Oberfläche ist sichtbar befleckt und wie deutlich sind die Flecken? Hoch = viele, große oder intensive Flecken. Muster zählen nicht; keine Ursachen oder Gesundheitsrisiken erfinden.' },
  { key: 'ambiente', label: 'Ambiente', hint: 'Wie besonders ist die Fundszene? Platzierung, Umgebung und absurde Kombinationen zählen, nicht Fotoqualität oder riskante Fundorte.' },
  { key: 'komfort', label: 'Komfort', hint: 'Wie intakt, eben und gut gepolstert wirkt sie? Hoch = bequem wirkend. Sauberkeit ist kein Komfortbeweis; nicht probesitzen oder anfassen.' },
  { key: 'charakter', label: 'Charakter', hint: 'Besonderheiten der Matratze selbst: Muster, Form, Konstruktion oder ungewöhnliche Reparaturen. Nicht Ekel, Fundort oder Seltenheit.' },
]

export const STAT_LABELS: Record<keyof CardStats, string> = {
  witterung: 'Witterung', flecken: 'Flecken', ambiente: 'Ambiente', komfort: 'Komfort', charakter: 'Charakter',
}

export const DEFAULT_STATS: CardStats = { witterung: 50, flecken: 50, ambiente: 50, komfort: 50, charakter: 50 }

export function readStats(value: unknown): CardStats | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 5) return null
  const { witterung, flecken, ambiente, komfort, charakter } = value as Record<string, unknown>
  if (typeof witterung !== 'number' || typeof flecken !== 'number' || typeof ambiente !== 'number'
    || typeof komfort !== 'number' || typeof charakter !== 'number') return null
  const stats = { witterung, flecken, ambiente, komfort, charakter }
  return Object.values(stats).every((v) => Number.isInteger(v) && v >= 0 && v <= 100) ? stats : null
}
