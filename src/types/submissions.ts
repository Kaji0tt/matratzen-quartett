import type { Database } from './database-gen.ts'
export { STAT_FIELDS, DEFAULT_STATS, readStats } from './card-stats.ts'

export type SubmissionStatus = 'pending_ai' | 'ai_reviewing' | 'ai_failed' | 'pending_review' | 'publishing' | 'approved' | 'rejected'

export type Submission = Database['public']['Tables']['card_submissions']['Row']

export const STATUS_LABELS: Record<string, string> = {
  pending_ai: 'KI-Prüfung ausstehend',
  ai_reviewing: 'KI prüft',
  ai_failed: 'KI-Prüfung fehlgeschlagen',
  pending_review: 'Wartet auf Freigabe',
  publishing: 'Freigabe erteilt · Veröffentlichung läuft',
  approved: 'Freigegeben · Kopie erhalten',
  rejected: 'Nicht freigegeben',
} satisfies Record<SubmissionStatus, string>
