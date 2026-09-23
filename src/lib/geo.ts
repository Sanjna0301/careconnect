export type Coords = { lat: number; lng: number }

const EARTH_RADIUS_KM = 6371

/** Great-circle distance. Accurate enough for "how far is this hospital". */
export function haversineKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Deep-link into whichever maps app the device prefers. */
export function directionsUrl(to: Coords, label: string, from?: Coords | null): string {
  const dest = `${to.lat},${to.lng}`
  const origin = from ? `&origin=${from.lat},${from.lng}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${origin}&destination_place_id=&travelmode=driving&dir_action=navigate#${encodeURIComponent(label)}`
}

export type GeoStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'

export function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      // High accuracy matters when an ambulance is being routed to you.
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

/** Plain-text location message for WhatsApp / SMS to a contact. */
export function locationShareText(c: Coords): string {
  return `I need help. My location: https://maps.google.com/?q=${c.lat},${c.lng} (accuracy varies). Sent from CareConnect.`
}
