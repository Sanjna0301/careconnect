const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const compactInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatINR = (n: number) => inr.format(n)
export const formatINRCompact = (n: number) => compactInr.format(n)

/** Cost ranges are shown as a band because real quotes vary by room class. */
export function formatCostBand(min: number, max: number): string {
  return `${compactInr.format(min)} – ${compactInr.format(max)}`
}

export function formatDistance(km: number | null): string {
  if (km === null) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** Rough drive time at 22 km/h — realistic for Indian city traffic. */
export function formatEta(km: number | null): string | null {
  if (km === null) return null
  const mins = Math.max(2, Math.round((km / 22) * 60))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export const formatCoins = (n: number) => new Intl.NumberFormat('en-IN').format(n)

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days} d ago`
  return formatDate(iso)
}
