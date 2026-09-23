/** Tiny class joiner. Falsy values are dropped; later values win by order only. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
