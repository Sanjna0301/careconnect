import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Modal dialog that becomes a bottom sheet on phones — the reachable
 * position for a one-handed grip. Focus is trapped, Escape closes, and
 * background scroll is locked while open.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  tone = 'default',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  tone?: 'default' | 'emergency'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    restoreTo.current = document.activeElement as HTMLElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

    focusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      restoreTo.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-lg bg-white shadow-[var(--shadow-e4)]',
          'max-h-[90dvh] overflow-y-auto overscroll-contain',
          'rounded-t-3xl sm:rounded-3xl fade-up',
        )}
      >
        {/* Drag affordance — signals "swipeable sheet" on touch. */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-2 sm:hidden">
          <div className="mx-auto h-1.5 w-11 rounded-full bg-mist-300" aria-hidden="true" />
        </div>

        <div className="flex items-start gap-3 px-5 pt-4 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 className={cn('text-xl font-bold', tone === 'emergency' && 'text-alert-700')}>
              {title}
            </h2>
            {description && <p className="mt-1 text-[0.95rem] text-ink-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid size-11 shrink-0 place-items-center rounded-xl text-ink-500 hover:bg-mist-100"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="sticky bottom-0 border-t border-mist-200 bg-white/95 px-5 py-4 backdrop-blur-sm">
            {footer}
          </div>
        )}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
