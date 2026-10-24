import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyCardStatModifiers,
  CARD_STAT_KEYS,
  COLLECTIBLE_CONDITIONS,
  conditionForModifierTotal,
  countCollectionCopies,
  getCopyKind,
  getModifierTotal,
  readCardStatModifiers,
  rollCardStatModifiers,
  selectCollectionCopy,
} from '../src/lib/card-condition.ts'
import { migrateDemoCards } from '../src/lib/demo-card-migration.ts'

test('collection copy counts preserve duplicate card IDs', () => {
  assert.deepEqual([...countCollectionCopies(['card-a', 'card-b', 'card-a'])], [
    ['card-a', 2],
    ['card-b', 1],
  ])
})

test('condition is derived from total modifier thresholds, including endpoints', () => {
  assert.deepEqual(COLLECTIBLE_CONDITIONS.map(({ code }) => code), ['MT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'])
  for (const [total, condition] of [
    [-25, 'poor'], [-20, 'poor'], [-19, 'played'], [-14, 'played'], [-13, 'light_played'],
    [-8, 'light_played'], [-7, 'good'], [7, 'good'], [8, 'excellent'], [13, 'excellent'],
    [14, 'near_mint'], [19, 'near_mint'], [20, 'mint'], [25, 'mint'],
  ]) {
    assert.equal(conditionForModifierTotal(total), condition)
  }
})

test('five stat modifiers roll independently from -5 through +5', () => {
  assert.deepEqual(CARD_STAT_KEYS, ['witterung', 'flecken', 'ambiente', 'komfort', 'charakter'])
  assert.deepEqual(rollCardStatModifiers(() => 0), {
    witterung: -5, flecken: -5, ambiente: -5, komfort: -5, charakter: -5,
  })
  assert.deepEqual(rollCardStatModifiers(() => 0.999999), {
    witterung: 5, flecken: 5, ambiente: 5, komfort: 5, charakter: 5,
  })
  const modifiers = rollCardStatModifiers((() => {
    const rolls = [0, 0.1, 0.5, 0.9, 0.999999]
    return () => rolls.shift()
  })())
  assert.deepEqual(Object.values(modifiers), [-5, -4, 0, 4, 5])
})

test('invalid random values and stored modifiers are rejected explicitly', () => {
  for (const value of [-1, 1, NaN, Infinity]) {
    assert.throws(() => rollCardStatModifiers(() => value), /Zufallswert/)
  }
  assert.throws(() => readCardStatModifiers({ witterung: -6, flecken: 0, ambiente: 0, komfort: 0, charakter: 0 }), /−5 bis \+5/)
})

test('effective stats floor at zero without an upper cap, and retain raw modifiers', () => {
  const modifiers = { witterung: -5, flecken: 5, ambiente: 0, komfort: 0, charakter: 0 }
  assert.deepEqual(applyCardStatModifiers({
    witterung: 2, flecken: 100, ambiente: 50, komfort: 0, charakter: 80,
  }, modifiers), {
    witterung: 0, flecken: 105, ambiente: 50, komfort: 0, charakter: 80,
  })
  const playedStats = applyCardStatModifiers({
    witterung: 50, flecken: 50, ambiente: 50, komfort: 50, charakter: 50,
  }, { witterung: -5, flecken: -4, ambiente: -3, komfort: -2, charakter: -1 })
  const excellentStats = applyCardStatModifiers({
    witterung: 50, flecken: 50, ambiente: 50, komfort: 50, charakter: 50,
  }, { witterung: 5, flecken: 4, ambiente: 3, komfort: 2, charakter: 1 })
  assert.notDeepEqual(playedStats, excellentStats)
  assert.equal(Object.values(playedStats).reduce((sum, value) => sum + value, 0), 235)
  assert.equal(Object.values(excellentStats).reduce((sum, value) => sum + value, 0), 265)
  assert.equal(getModifierTotal(modifiers), 0)
  assert.equal(conditionForModifierTotal(getModifierTotal(modifiers)), 'good')
  assert.deepEqual(readCardStatModifiers(modifiers), modifiers)
})

test('existing demo copies are rerolled while editor copies keep fixed values and their own condition', () => {
  const card = {
    stats: { witterung: 40, flecken: 40, ambiente: 40, komfort: 40, charakter: 40 },
    collectible_condition: 'mint',
  }
  const editor = { ...card, copy_kind: 'editor', stats: { ...card.stats, komfort: 95 } }
  const migrated = migrateDemoCards({ cards: [card, editor] }).cards
  assert.equal(migrated[0].collectible_condition, conditionForModifierTotal(getModifierTotal(migrated[0].stat_modifiers)))
  assert.ok(Object.values(migrated[0].stat_modifiers).every((value) => value >= -5 && value <= 5))
  assert.equal(migrated[1].collectible_condition, 'editor')
  assert.deepEqual(migrated[1].stat_modifiers, {
    witterung: 0, flecken: 0, ambiente: 0, komfort: 0, charakter: 0,
  })
  assert.equal(migrated[1].stats.komfort, 95)
})

test('Fair is not a collectible grade', () => {
  assert.ok(!COLLECTIBLE_CONDITIONS.some(({ value }) => value === 'fair'))
})

test('copy status belongs to the selected owned copy, not to its motif', () => {
  const booster = { card_id: 'card', user_id: 'photographer', acquisition_type: 'booster', manual_entry_id: null, collectible_condition: 'poor' }
  const creator = { ...booster, acquisition_type: 'gift', collectible_condition: 'mint' }
  const editor = { ...creator, user_id: 'someone-else', manual_entry_id: 'card' }
  assert.equal(getCopyKind(booster, 'photographer'), undefined)
  assert.equal(getCopyKind(creator, 'photographer'), 'creator')
  assert.equal(getCopyKind(editor, 'photographer'), 'editor')
  assert.equal(getCopyKind({ ...creator, user_id: 'someone-else' }, 'photographer'), undefined)
  assert.equal(selectCollectionCopy([booster, creator, editor], 'card', 'photographer'), editor)
  assert.equal(selectCollectionCopy([booster, creator], 'card', 'photographer'), creator)
  assert.equal(selectCollectionCopy([booster], 'card', 'photographer'), booster)
  assert.equal(selectCollectionCopy([booster], 'missing-card', 'photographer'), undefined)
})

test('booster modifiers and conditions are assigned once, replayed unchanged and persisted', async () => {
  const { createServer } = await import('vite')
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const entries = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: (key) => entries.delete(key),
    },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: globalThis.localStorage },
  })
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { useDemoGameStore: store } = await server.ssrLoadModule('/src/store/demo-game-store.ts')
    const pack = {
      id: 'condition-test', name: 'Standard Pack', price_coins: 100, card_count: 5,
      rarity_weights: { common: 85, rare: 10, epic: 4, legendary: 1 },
      is_available: true, limited_edition: false, description: '', image_url: '',
    }
    const collection = store.getState().cards
    const drawn = store.getState().openBooster(pack, 'condition-test-request', collection)
    assert.equal(drawn.length, 5)
    for (const card of drawn) {
      assert.ok(COLLECTIBLE_CONDITIONS.some(({ value }) => value === card.collectible_condition))
      assert.ok(card.stat_modifiers)
      assert.ok(Object.values(card.stat_modifiers).every((value) => value >= -5 && value <= 5))
      assert.equal(card.collectible_condition, conditionForModifierTotal(getModifierTotal(card.stat_modifiers)))
    }
    const coins = store.getState().coins
    assert.deepEqual(store.getState().openBooster(pack, 'condition-test-request', collection), drawn)
    assert.equal(store.getState().coins, coins)
    assert.equal(store.getState().boostersOpened, 1)
    const saved = JSON.parse([...entries.values()][0])
    for (const card of drawn) {
      assert.equal(saved.state.cards.find(({ id }) => id === card.id).collectible_condition, card.collectible_condition)
      assert.deepEqual(saved.state.cards.find(({ id }) => id === card.id).stat_modifiers, card.stat_modifiers)
    }
    await store.persist.rehydrate()
    for (const card of drawn) {
      assert.equal(store.getState().cards.find(({ id }) => id === card.id).collectible_condition, card.collectible_condition)
      assert.deepEqual(store.getState().cards.find(({ id }) => id === card.id).stat_modifiers, card.stat_modifiers)
    }
    const creator = { ...drawn[0], id: 'creator-test', collectible_condition: 'poor' }
    assert.equal(store.getState().addCard(creator), true)
    assert.equal(store.getState().cards[0].collectible_condition,
      conditionForModifierTotal(getModifierTotal(store.getState().cards[0].stat_modifiers)))
    assert.equal(store.getState().cards[0].copy_kind, 'creator')
    const { StreetCard } = await server.ssrLoadModule('/src/components/cards/StreetCard.tsx')
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const render = (props) => renderToStaticMarkup(createElement(StreetCard, props))
    const missing = render({ card: { ...creator, copy_kind: 'editor' }, owned: false })
    assert.match(missing, /street-card--missing/)
    assert.doesNotMatch(missing, /street-card__grade|street-card__copy-seal|street-card--editor/)
    const editor = render({
      card: {
        ...creator,
        copy_kind: 'editor',
        collectible_condition: 'editor',
        stat_modifiers: { witterung: 0, flecken: 0, ambiente: 0, komfort: 0, charakter: 0 },
      },
      detailed: true,
    })
    assert.match(editor, /street-card--editor/)
    assert.match(editor, /Editor \(ED\) - Fest zugewiesenes Original des Spielers \(0\)/)
    assert.match(editor, /lucide-flag"/)
    assert.match(editor, /EDITOR · NICHT HANDELBAR/)
    assert.ok(editor.indexOf('street-card__image') < editor.indexOf('street-card__description'))
    assert.ok(editor.indexOf('street-card__image') < editor.indexOf('street-card__location'))
    assert.ok(editor.indexOf('street-card__location') < editor.indexOf('street-card__info'))
    assert.doesNotMatch(editor, /street-card__metadata|street-card__mattress-condition|Zustand der Matratze/)
    assert.match(render({ card: { ...drawn[0], collectible_condition: null } }), /lucide-signal-zero/)
    const adjusted = render({
      card: {
        ...drawn[0],
        stats: { witterung: 100, flecken: 2, ambiente: 50, komfort: 50, charakter: 50 },
        stat_modifiers: { witterung: 5, flecken: -5, ambiente: 0, komfort: 0, charakter: 0 },
      },
    })
    assert.match(adjusted, /<b>105<\/b>/)
    assert.match(adjusted, /<b>0<\/b>/)
    assert.doesNotMatch(adjusted, /street-card__base-marker|street-card__stat-inspect/)
    const detailCard = {
      ...drawn[0],
      stats: { witterung: 100, flecken: 2, ambiente: 50, komfort: 50, charakter: 50 },
      stat_modifiers: { witterung: 5, flecken: -5, ambiente: 0, komfort: 0, charakter: 0 },
    }
    const detailed = render({ card: detailCard, detailed: true })
    assert.match(detailed, /street-card__base-marker--positive" style="left:95\.23809523809523%"/)
    assert.match(detailed, /street-card__base-marker--negative" style="left:1\.9047619047619049%"/)
    assert.match(detailed, /street-card__base-marker--neutral/)
    assert.match(detailed, /Witterung: 105\. Originalwert 100, Modifikator \+5/)
    assert.match(detailed, /Flecken: 0\. Originalwert 2, Modifikator -5/)
    assert.match(detailed, /aria-label="[^"]* \(0\)"/)
    assert.match(render({ card: {
      ...detailCard,
      stat_modifiers: { witterung: 5, flecken: 0, ambiente: 0, komfort: 0, charakter: 0 },
    } }), /aria-label="[^"]* \(\+5\)"/)
    assert.match(render({ card: {
      ...detailCard,
      stat_modifiers: { witterung: 0, flecken: -5, ambiente: 0, komfort: 0, charakter: 0 },
    } }), /aria-label="[^"]* \(-5\)"/)
    assert.equal((detailed.match(/class="street-card__stat-inspect"/g) ?? []).length, 5)
    assert.match(editor, /street-card__base-marker--neutral/)
    assert.doesNotMatch(render({
      card: detailCard, detailed: true, editable: { field: null, onEdit() {} },
    }), /street-card__base-marker|street-card__stat-inspect/)
    const firstCopy = render({
      card: {
        ...drawn[0],
        stats: { witterung: 50, flecken: 50, ambiente: 50, komfort: 50, charakter: 50 },
        stat_modifiers: { witterung: -5, flecken: -4, ambiente: -3, komfort: -2, charakter: -1 },
      },
    })
    const secondCopy = render({
      card: {
        ...drawn[0],
        stats: { witterung: 50, flecken: 50, ambiente: 50, komfort: 50, charakter: 50 },
        stat_modifiers: { witterung: 5, flecken: 4, ambiente: 3, komfort: 2, charakter: 1 },
      },
    })
    assert.match(firstCopy, /<b>45<\/b>/)
    assert.match(secondCopy, /<b>55<\/b>/)
    assert.doesNotMatch(editor, /circle-help|Fragezeichen/)
  } finally {
    await server.close()
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
    else delete globalThis.localStorage
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else delete globalThis.window
  }
})
