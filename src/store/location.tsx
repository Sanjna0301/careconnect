import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getPosition, type Coords, type GeoStatus } from '@/lib/geo'
import { readJSON, writeJSON } from '@/lib/storage'

/**
 * One shared location for the whole app.
 *
 * The last known position is cached so that a user who opens the app on a
 * dead network still sees a distance-sorted list instead of an empty state.
 * A manual city fallback exists because location permission is frequently
 * denied, and "permission denied" must never be a dead end in an emergency.
 */

const CACHE_KEY = 'careconnect.lastPosition.v1'

type LocationValue = {
  coords: Coords | null
  status: GeoStatus
  /** True when coords came from cache or a manually picked city. */
  approximate: boolean
  label: string | null
  /**
   * Requests a fix and RETURNS it. Callers must use the returned value —
   * reading `coords` straight after `await request()` gets the stale closure
   * value, because React state does not update an existing closure.
   */
  request: () => Promise<Coords | null>
  setManual: (coords: Coords, label: string) => void
}

const LocationContext = createContext<LocationValue | null>(null)

export function useLocation(): LocationValue {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used inside <LocationProvider>')
  return ctx
}

type Cached = { coords: Coords; label: string | null; at: number }

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [approximate, setApproximate] = useState(false)
  const [label, setLabel] = useState<string | null>(null)

  // Restore the cached position immediately so the first paint has content.
  useEffect(() => {
    const cached = readJSON<Cached | null>(CACHE_KEY, null)
    if (cached?.coords) {
      setCoords(cached.coords)
      setLabel(cached.label)
      setApproximate(true)
    }
  }, [])

  const request = useCallback(async (): Promise<Coords | null> => {
    setStatus('locating')
    try {
      const next = await getPosition()
      setCoords(next)
      setApproximate(false)
      setLabel(null)
      setStatus('granted')
      writeJSON(CACHE_KEY, { coords: next, label: null, at: Date.now() } satisfies Cached)
      return next
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code
      setStatus(code === 1 ? 'denied' : 'unavailable')
      return null
    }
  }, [])

  const setManual = useCallback((next: Coords, nextLabel: string) => {
    setCoords(next)
    setLabel(nextLabel)
    setApproximate(true)
    setStatus('granted')
    writeJSON(CACHE_KEY, { coords: next, label: nextLabel, at: Date.now() } satisfies Cached)
  }, [])

  const value = useMemo(
    () => ({ coords, status, approximate, label, request, setManual }),
    [coords, status, approximate, label, request, setManual],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}
