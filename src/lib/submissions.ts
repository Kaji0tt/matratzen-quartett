import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database-gen'

export async function submissionAction(body: Record<string, Json | undefined>) {
  const { data, error } = await supabase.functions.invoke('review-submission', { body })
  if (error instanceof FunctionsHttpError) {
    const details: unknown = await error.context.json()
    if (details && typeof details === 'object' && 'error' in details && typeof details.error === 'string') {
      throw new Error(details.error)
    }
  }
  if (error) throw error
  if (!data || typeof data !== 'object' || !('ok' in data) || data.ok !== true) {
    throw new Error('Der Server hat die Aktion nicht bestätigt.')
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Unbekannter Fehler. Bitte erneut versuchen.'
}
