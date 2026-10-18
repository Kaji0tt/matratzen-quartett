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
      const restoreValue = (key: string): number => {
        const value: unknown = Reflect.get(old, key)
        if (value === undefined) return 50
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) {
          throw new Error(`Der gespeicherte Wert ${key} ist ungültig.`)
        }
        return value
      }
      return {
        ...migrated,
        stats: {
          witterung: old.witterung, flecken: restoreValue('flecken'), ambiente: restoreValue('ambiente'),
          komfort: restoreValue('komfort'), charakter: restoreValue('charakter'),
        },
        attributes: [
          ...('attributes' in card && Array.isArray(card.attributes) ? card.attributes.filter((attribute: unknown) =>
            !attribute || typeof attribute !== 'object' || !('key' in attribute) || attribute.key !== 'Werteprüfung') : []),
          { key: 'Werteprüfung', value: 'Migrierte Werte bitte prüfen. Frühere Fleckenwerte wurden wiederhergestellt; fehlende Bewertungen sind vorläufig 50.' },
        ],
      }
    }),
  }
}
