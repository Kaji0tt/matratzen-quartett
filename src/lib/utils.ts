import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('de-DE').format(n)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'text-slate-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-amber-400',
  }
  return colors[rarity] ?? 'text-slate-400'
}

export function getRarityBgGradient(rarity: string): string {
  const gradients: Record<string, string> = {
    common: 'from-slate-800 to-slate-900',
    uncommon: 'from-green-900/40 to-slate-900',
    rare: 'from-blue-900/40 to-slate-900',
    epic: 'from-purple-900/40 to-slate-900',
    legendary: 'from-amber-900/40 via-red-900/20 to-slate-900',
  }
  return gradients[rarity] ?? 'from-slate-800 to-slate-900'
}

export function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: 'Gewöhnlich',
    uncommon: 'Ungewöhnlich',
    rare: 'Selten',
    epic: 'Episch',
    legendary: 'Legendär',
  }
  return labels[rarity] ?? rarity
}

export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  kFactor = 32
): { newRatingA: number; newRatingB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  const expectedB = 1 - expectedA
  const newRatingA = Math.round(ratingA + kFactor * (scoreA - expectedA))
  const newRatingB = Math.round(ratingB + kFactor * (1 - scoreA - expectedB))
  return { newRatingA, newRatingB }
}
