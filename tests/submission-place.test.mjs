import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSubmissionPlace, readSubmissionPlace } from '../src/lib/submission-place.ts'

test('reverse geocoding selects city and district without retaining street addresses', () => {
  assert.deepEqual(readSubmissionPlace({ address: {
    city: 'Berlin', suburb: 'Mitte', road: 'Privatstraße', house_number: '42', country_code: 'de',
  } }), { city: 'Berlin', location: 'Mitte', country: 'DE' })
  assert.deepEqual(readSubmissionPlace({ address: { town: 'Potsdam', neighbourhood: 'Babelsberg', country_code: 'de' } }),
    { city: 'Potsdam', location: 'Babelsberg', country: 'DE' })
})

test('rural places without a district use the actual municipality', () => {
  assert.deepEqual(readSubmissionPlace({ address: { village: 'Caputh', country_code: 'de' } }),
    { city: 'Caputh', location: 'Caputh', country: 'DE' })
})

test('missing, malformed and oversized places are errors, not invented locations', () => {
  for (const value of [null, [], {}, { address: null }, { address: { city: 'Berlin' } },
    { address: { city: 'Berlin', country_code: 'Germany' } },
    { address: { city: 'x'.repeat(101), country_code: 'de' } },
    { address: { city: 'Berlin', suburb: 'x'.repeat(151), country_code: 'de' } }]) {
    assert.throws(() => readSubmissionPlace(value), /Adresse|bestimmt/)
  }
})

test('only coarse coordinates are sent, repeat lookups are cached, and aborts do not succeed', async () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const originalFetch = globalThis.fetch
  const calls = []
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    geolocation: { getCurrentPosition(resolve) { resolve({ coords: { latitude: 52.521234, longitude: 13.401234 } }) } },
  } })
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return Response.json(String(url) === '/geocoding.json'
      ? { reverseUrl: 'https://geocoder.example/reverse' }
      : { address: { city: 'Berlin', suburb: 'Mitte', country_code: 'de' } })
  }
  try {
    const place = await getSubmissionPlace(new AbortController().signal)
    assert.equal(place.city, 'Berlin')
    const url = new URL(calls[1])
    assert.equal(url.searchParams.get('lat'), '52.52')
    assert.equal(url.searchParams.get('lon'), '13.40')
    assert.equal(url.searchParams.get('zoom'), '14')
    assert.deepEqual(await getSubmissionPlace(new AbortController().signal), place)
    assert.equal(calls.length, 2)
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(getSubmissionPlace(controller.signal), { name: 'AbortError' })
  } finally {
    globalThis.fetch = originalFetch
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
    else delete globalThis.navigator
  }
})

test('denied geolocation explicitly requests permission without contacting a geocoder', async () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    geolocation: { getCurrentPosition(_resolve, reject) { reject({ code: 1 }) } },
  } })
  try {
    await assert.rejects(getSubmissionPlace(new AbortController().signal), /Standort freigeben/)
  } finally {
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
    else delete globalThis.navigator
  }
})
