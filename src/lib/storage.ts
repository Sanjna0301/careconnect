/**
 * localStorage that never throws. Private browsing, blocked site data and
 * quota errors all degrade to "no stored value" instead of a white screen.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Storage unavailable — the app still works, it just forgets. */
  }
}
