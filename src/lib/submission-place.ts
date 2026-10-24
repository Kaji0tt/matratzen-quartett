export interface SubmissionPlace {
  city: string
  location: string
  country: string
}

const cache = new Map<string, SubmissionPlace>()
let nextRequestAt = 0

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readSubmissionPlace(value: unknown): SubmissionPlace {
  if (!record(value) || !record(value.address)) throw new Error('Die Ortsbestimmung hat keine Adresse geliefert.')
  const address = value.address
  const first = (...keys: string[]) => keys.map((key) => address[key]).find((item): item is string => typeof item === 'string' && item.trim().length >= 2)?.trim()
  const city = first('city', 'town', 'village', 'municipality', 'county')
  const location = first('suburb', 'quarter', 'neighbourhood', 'city_district', 'borough') ?? city
  const country = first('country_code')?.toUpperCase()
  if (!city || !location || !country || !/^[A-Z]{2}$/.test(country) || city.length > 100 || location.length > 150) {
    throw new Error('Stadt und Land konnten nicht zuverlässig bestimmt werden. Bitte erneut versuchen.')
  }
  return { city, location, country }
}

export async function getSubmissionPlace(signal: AbortSignal): Promise<SubmissionPlace> {
  if (!navigator.geolocation) throw new Error('Dein Browser unterstützt keine Standortbestimmung.')
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new Error(error.code === 1
        ? 'Bitte den Standort freigeben, damit dein Fund automatisch zugeordnet werden kann.'
        : 'Dein Standort ist gerade nicht verfügbar. Bitte erneut versuchen.'))
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 })
  })
  signal.throwIfAborted()
  // Only coarse coordinates leave the device; no street address is requested or stored.
  const lat = position.coords.latitude.toFixed(2)
  const lon = position.coords.longitude.toFixed(2)
  const key = `${lat},${lon}`
  const cached = cache.get(key)
  if (cached) return cached
  const configResponse = await fetch('/geocoding.json', { signal, cache: 'no-cache' })
  if (!configResponse.ok) throw new Error('Die Standort-Konfiguration konnte nicht geladen werden.')
  const config: unknown = await configResponse.json()
  if (!record(config) || typeof config.reverseUrl !== 'string') throw new Error('Die Standort-Konfiguration ist ungültig.')
  const url = new URL(config.reverseUrl)
  if (url.protocol !== 'https:') throw new Error('Die Ortsbestimmung benötigt eine sichere HTTPS-Verbindung.')
  url.search = new URLSearchParams({ format: 'jsonv2', lat, lon, zoom: '14', addressdetails: '1', 'accept-language': 'de' }).toString()
  const wait = Math.max(0, nextRequestAt - Date.now())
  nextRequestAt = Date.now() + wait + 1100
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait))
  signal.throwIfAborted()
  const response = await fetch(url, { signal, referrerPolicy: 'strict-origin-when-cross-origin' })
  if (!response.ok) throw new Error('Die Ortsbestimmung ist gerade nicht erreichbar. Bitte erneut versuchen.')
  const place = readSubmissionPlace(await response.json())
  cache.set(key, place)
  return place
}
