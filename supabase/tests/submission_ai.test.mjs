import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAIResult, validStats } from '../functions/review-submission/validation.ts'

const stats = { witterung: 85, flecken: 50, ambiente: 75, komfort: 60, charakter: 30 }
const result = {
  name: 'Laternen-Luxus', description: 'Ein Bordsteinjuwel mit Straßenpatina.', stats,
  reasoning: 'Stärken werden durch niedrigeren Komfort und Charakter ausgeglichen.',
  text_review: { needs_review: false, reasoning: 'Die Fundbeschreibung passt zum Quartettstil.' },
}

test('accepts an actual AI-shaped result at the 300 point budget', () => {
  assert.equal(Object.values(parseAIResult(result).stats).reduce((a, b) => a + b), 300)
})
test('rejects over-budget and multiple peak stats without silently normalizing', () => {
  assert.throws(() => parseAIResult({ ...result, stats: { ...stats, witterung: 86 } }), /Balancing/)
  assert.throws(() => parseAIResult({ ...result, stats: { witterung: 86, flecken: 86, ambiente: 0, komfort: 0, charakter: 0 } }), /Balancing/)
})
test('accepts one peak balanced with weaknesses', () => {
  assert.equal(parseAIResult({ ...result, stats: { ...stats, witterung: 100, ambiente: 0 } }).stats.witterung, 100)
})
test('rejects malformed stats, strings, fractions, extras and missing keys', () => {
  for (const invalid of [null, [], {}, { ...stats, witterung: '50' }, { ...stats, witterung: -1 },
    { ...stats, witterung: 101 }, { ...stats, witterung: 50.5 }, { ...stats, bonus: 1 }]) {
    assert.equal(validStats(invalid), false)
  }
})
test('rejects incomplete, refused or oversized AI output', () => {
  for (const invalid of [null, {}, { ...result, name: '' }, { ...result, description: 'short' },
    { ...result, reasoning: '' }, { ...result, name: 'x'.repeat(81) }, { ...result, description: 'x'.repeat(1001) }]) {
    assert.throws(() => parseAIResult(invalid), /gültiges/)
  }
})
