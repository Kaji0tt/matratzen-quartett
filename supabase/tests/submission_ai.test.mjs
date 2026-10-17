import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAIResult, validStats } from '../functions/review-submission/validation.ts'

const stats = { alter: 85, flecken: 75, witterung: 60, geruch: 50, kontaminierung: 30 }
const result = { name: 'Laternen-Luxus', description: 'Ein Bordsteinjuwel mit Straßenpatina.', stats, reasoning: 'Stärken werden durch niedrige Geruchswerte ausgeglichen.' }

test('accepts an actual AI-shaped result at the 300 point budget', () => {
  assert.equal(Object.values(parseAIResult(result).stats).reduce((a, b) => a + b), 300)
})
test('rejects over-budget and multiple peak stats without silently normalizing', () => {
  assert.throws(() => parseAIResult({ ...result, stats: { ...stats, alter: 86 } }), /Balancing/)
  assert.throws(() => parseAIResult({ ...result, stats: { alter: 86, flecken: 86, witterung: 0, geruch: 0, kontaminierung: 0 } }), /Balancing/)
})
test('accepts one peak balanced with weaknesses', () => {
  assert.equal(parseAIResult({ ...result, stats: { ...stats, alter: 100, flecken: 0 } }).stats.alter, 100)
})
test('rejects malformed stats, strings, fractions, extras and missing keys', () => {
  for (const invalid of [null, [], {}, { ...stats, alter: '50' }, { ...stats, alter: -1 },
    { ...stats, alter: 101 }, { ...stats, alter: 50.5 }, { ...stats, bonus: 1 }]) {
    assert.equal(validStats(invalid), false)
  }
})
test('rejects incomplete, refused or oversized AI output', () => {
  for (const invalid of [null, {}, { ...result, name: '' }, { ...result, description: 'short' },
    { ...result, reasoning: '' }, { ...result, name: 'x'.repeat(81) }, { ...result, description: 'x'.repeat(1001) }]) {
    assert.throws(() => parseAIResult(invalid), /gültiges/)
  }
})
