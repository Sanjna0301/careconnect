import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * One place that both shows a toast and speaks it to a screen reader.
 * Anything worth telling a sighted user is worth telling everyone.
 */

type Tone = 'info' | 'success' | 'error'
type Toast = { id: number; message: string; tone: Tone }

const AnnouncerContext = createContext<(message: string, tone?: Tone) => void>(() => {})

export const useAnnounce = () => useContext(AnnouncerContext)

const ICONS: Record<Tone, ReactNode> = {
  info: <Info size={20} aria-hidden="true" />,
  success: <CircleCheck size={20} aria-hidden="true" />,
  error: <TriangleAlert size={20} aria-hidden="true" />,
}

const TONES: Record<Tone, string> = {
  info: 'bg-ink-900 text-white',
  success: 'bg-good-700 text-white',
  error: 'bg-alert-700 text-white',
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const announce = useCallback((message: string, tone: Tone = 'info') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 5000)
  }, [])

  const value = useMemo(() => announce, [announce])

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      {/* Errors interrupt; everything else waits its turn. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toasts.filter((t) => t.tone !== 'error').map((t) => t.message).join('. ')}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {toasts.filter((t) => t.tone === 'error').map((t) => t.message).join('. ')}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-100 flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'fade-up pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-medium shadow-[var(--shadow-e4)]',
              TONES[t.tone],
            )}
          >
            {ICONS[t.tone]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AnnouncerContext.Provider>
  )
}
