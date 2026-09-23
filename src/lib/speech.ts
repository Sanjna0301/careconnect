/**
 * Voice search. Uses the Web Speech API where available (Chrome, Edge,
 * Safari 16+) and reports unsupported everywhere else so the UI can hide
 * the control rather than offer a dead button.
 */

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechWindow = typeof window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function speechSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as SpeechWindow
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export type ListenHandle = { stop: () => void }

export function listenOnce(
  onResult: (transcript: string) => void,
  onError: (reason: string) => void,
  lang = 'en-IN',
): ListenHandle | null {
  const w = window as SpeechWindow
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) {
    onError('unsupported')
    return null
  }

  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = false
  rec.continuous = false

  rec.onresult = (e) => {
    const transcript = e.results[0]?.[0]?.transcript ?? ''
    if (transcript) onResult(transcript.trim())
  }
  rec.onerror = (e) => onError(e.error)

  try {
    rec.start()
  } catch {
    onError('start-failed')
    return null
  }

  return { stop: () => { try { rec.stop() } catch { /* already stopped */ } } }
}

/** Reads a short string aloud — used for first-aid steps. */
export function speak(text: string, lang = 'en-IN'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}
