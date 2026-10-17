import type { Database, Json } from './database-gen.ts'
import type { CardStats } from './index.ts'

export type SubmissionStatus = 'pending_ai' | 'ai_reviewing' | 'ai_failed' | 'pending_review' | 'publishing' | 'approved' | 'rejected'

export type Submission = Database['public']['Tables']['card_submissions']['Row']

export const STAT_FIELDS: { key: keyof CardStats; label: string; hint: string }[] = [
  { key: 'alter', label: 'Alter', hint: 'Wie alt und durchgelegen wirkt sie?' },
  { key: 'flecken', label: 'Flecken', hint: 'Wie ausgeprägt sind die sichtbaren Flecken?' },
  { key: 'witterung', label: 'Witterung', hint: 'Regen, Sonne und Straßenleben?' },
  { key: 'geruch', label: 'Geruch', hint: 'Nur schätzen, nicht extra daran riechen.' },
  { key: 'kontaminierung', label: 'Kontaminierung', hint: 'Spielerische Einschätzung, keine Diagnose. Nicht anfassen.' },
]

export const DEFAULT_STATS: CardStats = { alter: 50, flecken: 50, witterung: 50, geruch: 50, kontaminierung: 50 }
export const STATUS_LABELS: Record<string, string> = {
  pending_ai: 'KI-Prüfung ausstehend',
  ai_reviewing: 'KI prüft',
  ai_failed: 'KI-Prüfung fehlgeschlagen',
  pending_review: 'Wartet auf Freigabe',
  publishing: 'Freigabe erteilt · Veröffentlichung läuft',
  approved: 'Freigegeben · Kopie erhalten',
  rejected: 'Nicht freigegeben',
} satisfies Record<SubmissionStatus, string>

export function readStats(value: Json | null): CardStats | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { alter, flecken, witterung, geruch, kontaminierung } = value
  if (typeof alter !== 'number' || typeof flecken !== 'number' || typeof witterung !== 'number'
    || typeof geruch !== 'number' || typeof kontaminierung !== 'number') return null
  const stats = { alter, flecken, witterung, geruch, kontaminierung }
  return Object.values(stats).every((v) => Number.isInteger(v) && v >= 0 && v <= 100) ? stats : null
}
