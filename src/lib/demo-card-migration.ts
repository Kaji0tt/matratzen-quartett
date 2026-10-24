import { readStats } from '../types/card-stats.ts'
import {
  conditionForModifierTotal,
  getModifierTotal,
  readCardStatModifiers,
  rollCardStatModifiers,
  type CardStatModifiers,
} from './card-condition.ts'

const zeroModifiers: CardStatModifiers = {
  witterung: 0, flecken: 0, ambiente: 0, komfort: 0, charakter: 0,
}

export function migrateDemoCards(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || !('cards' in value) || !Array.isArray(value.cards)) {
    throw new Error('Der gespeicherte Demo-Spielstand ist ungültig.')
  }
  return {
    ...value,
    cards: value.cards.map((card: unknown) => {
      if (!card || typeof card !== 'object' || !('stats' in card)) throw new Error('Eine gespeicherte Demo-Karte ist ungültig.')
      const migrated = 'rarity' in card && card.rarity === 'uncommon' ? { ...card, rarity: 'common' } : card
      let stats = readStats(card.stats)
      if (!stats) {
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
        stats = {
          witterung: old.witterung, flecken: restoreValue('flecken'), ambiente: restoreValue('ambiente'),
          komfort: restoreValue('komfort'), charakter: restoreValue('charakter'),
        }
      }
      const editorCopy = 'copy_kind' in card && card.copy_kind === 'editor'
      const stat_modifiers = editorCopy
        ? zeroModifiers
        : readCardStatModifiers('stat_modifiers' in card ? card.stat_modifiers : null) ?? rollCardStatModifiers()
      return {
        ...migrated,
        stats,
        stat_modifiers,
        collectible_condition: editorCopy ? 'editor' : conditionForModifierTotal(getModifierTotal(stat_modifiers)),
        ...(!readStats(card.stats) ? {
          attributes: [
            ...('attributes' in card && Array.isArray(card.attributes) ? card.attributes.filter((attribute: unknown) =>
              !attribute || typeof attribute !== 'object' || !('key' in attribute) || attribute.key !== 'Werteprüfung') : []),
            { key: 'Werteprüfung', value: 'Migrierte Werte bitte prüfen. Frühere Fleckenwerte wurden wiederhergestellt; fehlende Bewertungen sind vorläufig 50.' },
          ],
        } : {}),
      }
    }),
  }
}
