import { readStats } from '../types/card-stats.ts'

export function migrateDemoCards(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || !('cards' in value) || !Array.isArray(value.cards)) {
    throw new Error('Der gespeicherte Demo-Spielstand ist ungültig.')
  }
  return {
    ...value,
    cards: value.cards.map((card: unknown) => {
      if (!card || typeof card !== 'object' || !('stats' in card)) throw new Error('Eine gespeicherte Demo-Karte ist ungültig.')
      const migrated = 'rarity' in card && card.rarity === 'uncommon' ? { ...card, rarity: 'common' } : card
      if (readStats(card.stats)) return migrated
      const old = card.stats
      if (!old || typeof old !== 'object' || !('witterung' in old)
        || typeof old.witterung !== 'number' || !Number.isInteger(old.witterung) || old.witterung < 0 || old.witterung > 100) {
        throw new Error('Die Witterung einer gespeicherten Demo-Karte ist ungültig.')
      }
      return {
        ...migrated,
        stats: { witterung: old.witterung, ambiente: 50, komfort: 50, format: 50, charakter: 50 },
        attributes: [
          ...('attributes' in card && Array.isArray(card.attributes) ? card.attributes : []),
          { key: 'Werteprüfung', value: 'Altbestand: Neue Attribute sind vorläufig auf 50 gesetzt und müssen geprüft werden.' },
        ],
      }
    }),
  }
}
