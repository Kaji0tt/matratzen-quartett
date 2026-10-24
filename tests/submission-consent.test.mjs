import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasSubmissionConsent, saveSubmissionConsent } from '../src/lib/submission-consent.ts'

function memoryStorage() {
  const entries = new Map()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
}

test('consent is required initially and remembered for repeat visits by the same account', () => {
  const storage = memoryStorage()
  assert.equal(hasSubmissionConsent('alice', storage), false)
  saveSubmissionConsent('alice', storage)
  assert.equal(hasSubmissionConsent('alice', storage), true)
  assert.equal(hasSubmissionConsent('alice', storage), true)
})

test('consent is isolated per account and browser storage', () => {
  const storage = memoryStorage()
  saveSubmissionConsent('alice', storage)
  assert.equal(hasSubmissionConsent('bob', storage), false)
  assert.equal(hasSubmissionConsent('alice', memoryStorage()), false)
})

test('outdated versions and unrecognized values do not grant consent', () => {
  const storage = memoryStorage()
  storage.setItem('submission-consent:v0:alice', 'accepted')
  assert.equal(hasSubmissionConsent('alice', storage), false)
  storage.setItem('submission-consent:v1:alice', 'false')
  assert.equal(hasSubmissionConsent('alice', storage), false)
})

test('blocked storage propagates errors instead of claiming a saved decision', () => {
  const error = new Error('Storage blocked')
  assert.throws(() => hasSubmissionConsent('alice', { getItem() { throw error } }), /Storage blocked/)
  assert.throws(() => saveSubmissionConsent('alice', { setItem() { throw error } }), /Storage blocked/)
})
