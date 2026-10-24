const CONSENT_VERSION = 'v1'

function consentKey(userId: string) {
  return `submission-consent:${CONSENT_VERSION}:${userId}`
}

export function hasSubmissionConsent(userId: string, storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  return storage.getItem(consentKey(userId)) === 'accepted'
}

export function saveSubmissionConsent(userId: string, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(consentKey(userId), 'accepted')
}
