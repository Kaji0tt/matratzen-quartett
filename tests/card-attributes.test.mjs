import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_STATS, STAT_FIELDS, STAT_LABELS, readStats } from '../src/types/card-stats.ts'
import { migrateDemoCards } from '../src/lib/demo-card-migration.ts'
import { AI_SCHEMA, STAT_KEYS, parseAIResult, reviewUpdate, validStats } from '../supabase/functions/review-submission/validation.ts'
import { reviewPrompt } from '../supabase/functions/review-submission/prompt.ts'

const result = () => ({
  name: 'Die Bordsteinliege',
  description: 'Sie wartet geduldig auf den nächsten Umzug.',
  stats: { witterung: 15, ambiente: 65, komfort: 90, format: 75, charakter: 45 },
  reasoning: 'Komfortabel, aber kaum verwittert. Größe und Szene unabhängig bewertet.',
  text_review: { needs_review: false, reasoning: 'Der trockene Humor passt zum Quartett.' },
})

test('all five attributes share their keys, order and labels across UI and AI', () => {
  assert.deepEqual(STAT_KEYS, ['witterung', 'ambiente', 'komfort', 'format', 'charakter'])
  assert.deepEqual(STAT_FIELDS.map(({ key }) => key), STAT_KEYS)
  assert.deepEqual(Object.keys(DEFAULT_STATS), STAT_KEYS)
  assert.deepEqual(Object.keys(STAT_LABELS), STAT_KEYS)
  assert.deepEqual(AI_SCHEMA.properties.stats.required, STAT_KEYS)
  assert.deepEqual(readStats(DEFAULT_STATS), DEFAULT_STATS)
})

test('only exact, integer, finite, in-range stat objects are accepted', () => {
  for (const stats of [
    null, [], {},
    { ...DEFAULT_STATS, alter: 10 },
    { alter: 10, flecken: 20, witterung: 30, geruch: 40, kontaminierung: 50 },
    ...[-1, 101, 1.5, NaN, Infinity, '50', null].map((komfort) => ({ ...DEFAULT_STATS, komfort })),
  ]) {
    assert.equal(validStats(stats), false)
    assert.equal(readStats(stats), null)
  }
  assert.ok(validStats({ witterung: 0, ambiente: 100, komfort: 0, format: 100, charakter: 0 }))
})

test('AI balancing enforces exact sum and peak boundaries', () => {
  const input = result()
  assert.equal(Object.values(input.stats).reduce((sum, v) => sum + v, 0), 290)
  assert.deepEqual(parseAIResult(input), input)
  assert.doesNotThrow(() => parseAIResult({ ...input, stats: { witterung: 100, ambiente: 85, komfort: 85, format: 30, charakter: 0 } }))
  assert.throws(() => parseAIResult({ ...input, stats: { witterung: 100, ambiente: 85, komfort: 85, format: 31, charakter: 0 } }), /Balancing/)
  assert.throws(() => parseAIResult({ ...input, stats: { witterung: 86, ambiente: 86, komfort: 0, format: 0, charakter: 0 } }), /Balancing/)
})

test('text assessment is required, separately validated and retained for moderation', () => {
  for (const text_review of [undefined, null, [], { needs_review: 'yes', reasoning: 'Ausführlicher Hinweis' },
    { needs_review: true, reasoning: '' }, { needs_review: false, reasoning: 'x'.repeat(1501) }]) {
    assert.throws(() => parseAIResult({ ...result(), text_review }), /gültiges Kartenergebnis/)
  }
  const flagged = { ...result(), text_review: { needs_review: true, reasoning: 'Der Text enthält einen deutlichen Widerspruch zu den Fundangaben.' } }
  assert.deepEqual(parseAIResult(flagged).text_review, flagged.text_review)
  assert.ok(AI_SCHEMA.required.includes('text_review'))
})

test('AI correction suggestions never overwrite player originals or the moderation draft', () => {
  const draft = {
    name: 'Meine absichtliche Wortschöpfung',
    description: 'Dit is meine Matratze, wa.',
    submitted_name: 'Meine absichtliche Wortschöpfung',
    submitted_description: 'Dit is meine Matratze, wa.',
  }
  const corrected = parseAIResult(result())
  const update = reviewUpdate(corrected, 'Stilmaßstab zur Prüfung', 'test-model')
  const saved = { ...draft, ...update }
  for (const key of Object.keys(draft)) assert.equal(saved[key], draft[key])
  assert.equal(saved.ai_result.description, corrected.description)
  assert.equal(saved.ai_result.text_review.needs_review, false)
  assert.deepEqual(saved.final_stats, corrected.stats)
  assert.equal(saved.status, 'pending_review')
})

test('name, description and review text length limits are enforced', () => {
  for (const patch of [{ name: 'x' }, { name: 'x'.repeat(81) }, { description: 'zu kurz' },
    { description: 'x'.repeat(1001) }, { reasoning: 'kurz' }]) {
    assert.throws(() => parseAIResult({ ...result(), ...patch }), /gültiges Kartenergebnis/)
  }
})

test('prompt distinguishes object and setting and only requests language corrections', () => {
  const prompt = reviewPrompt('Ein eigener Stilmaßstab')
  for (const { label, hint } of STAT_FIELDS) {
    assert.ok(prompt.includes(`${label}: ${hint}`))
  }
  assert.ok(prompt.includes('Ein eigener Stilmaßstab'))
  assert.ok(prompt.includes('Nicht kürzen, ausschmücken, neu formulieren'))
  assert.ok(prompt.includes('Dialekt'))
  assert.ok(prompt.includes('ausschließlich die Moderation'))
  assert.ok(prompt.includes('Das Foto wird NICHT an dich gesendet'))
  assert.ok(prompt.includes('vorläufig 50'))
})

test('legacy demo migration preserves ownership, progress, weather and existing attributes', () => {
  const old = {
    coins: 777, wins: 4, boosterRequests: { purchase: ['card-id'] },
    cards: [{ id: 'card-id', stats: { alter: 90, flecken: 75, witterung: 80, geruch: 95, kontaminierung: 90 },
      attributes: [{ key: 'Original', value: 'Bleibt bestehen' }], description: 'Mein Text' }],
  }
  const migrated = migrateDemoCards(old)
  assert.equal(migrated.coins, old.coins)
  assert.equal(migrated.wins, old.wins)
  assert.deepEqual(migrated.boosterRequests, old.boosterRequests)
  assert.deepEqual(migrated.cards[0].stats, { witterung: 80, ambiente: 50, komfort: 50, format: 50, charakter: 50 })
  assert.equal(migrated.cards[0].description, 'Mein Text')
  assert.deepEqual(migrated.cards[0].attributes[0], old.cards[0].attributes[0])
  assert.equal(migrated.cards[0].attributes[1].key, 'Werteprüfung')
  assert.equal(old.cards[0].stats.geruch, 95)
})

test('demo migration keeps new stats and rejects invalid persisted data explicitly', () => {
  const card = { id: 'new', stats: DEFAULT_STATS }
  assert.deepEqual(migrateDemoCards({ cards: [card] }).cards, [card])
  for (const value of [null, {}, { cards: [null] }, { cards: [{ stats: { witterung: -1 } }] }]) {
    assert.throws(() => migrateDemoCards(value), /ungültig/)
  }
})
