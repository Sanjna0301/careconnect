import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Mic, Search, X } from 'lucide-react'
import { matchTreatments, SPECIALTY_LABEL, type Treatment } from '@/data/treatments'
import { listenOnce, speechSupported } from '@/lib/speech'
import { useAnnounce } from '@/components/ui/Announcer'
import { cn } from '@/lib/cn'

/**
 * Condition search with a combobox listbox and optional voice input.
 *
 * Someone typing here may be one-handed, panicking, or describing a symptom
 * rather than a procedure — so the matcher searches aliases ("chest pain",
 * "seene me dard") and not just treatment names.
 */
export function TreatmentSearch({
  value,
  onQueryChange,
  onSelect,
  autoFocus,
  size = 'lg',
}: {
  value: string
  onQueryChange: (q: string) => void
  onSelect: (t: Treatment) => void
  autoFocus?: boolean
  size?: 'lg' | 'xl'
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [listening, setListening] = useState(false)
  const announce = useAnnounce()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const results = matchTreatments(value)
  const canVoice = speechSupported()

  useEffect(() => {
    setActive(0)
  }, [value])

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  function choose(t: Treatment) {
    onSelect(t)
    onQueryChange(t.name)
    setOpen(false)
    announce(`Showing hospitals for ${t.name}.`, 'success')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function startVoice() {
    setListening(true)
    announce('Listening. Say the problem, for example: chest pain.', 'info')
    listenOnce(
      (transcript) => {
        setListening(false)
        onQueryChange(transcript)
        setOpen(true)
        const hits = matchTreatments(transcript)
        announce(
          hits.length > 0
            ? `Heard "${transcript}". ${hits.length} matches.`
            : `Heard "${transcript}". No match — try different words.`,
          hits.length > 0 ? 'success' : 'error',
        )
      },
      (reason) => {
        setListening(false)
        announce(
          reason === 'not-allowed'
            ? 'Microphone permission was blocked.'
            : 'Voice search did not work. Please type instead.',
          'error',
        )
      },
    )
  }

  const height = size === 'xl' ? 'h-16' : 'h-14'

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'flex items-center rounded-2xl bg-white ring-1 ring-mist-300',
          'shadow-[inset_0_1px_2px_rgb(10_22_40/0.05),var(--shadow-e2)]',
          'focus-within:ring-2 focus-within:ring-med-600',
          height,
        )}
      >
        <Search size={22} className="mx-4 shrink-0 text-ink-400" aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search a treatment, disease or symptom"
          autoFocus={autoFocus}
          value={value}
          placeholder="Chest pain, dengue, dialysis…"
          onChange={(e) => {
            onQueryChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[1.02rem] text-ink-900 placeholder:text-ink-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />

        {value && (
          <button
            onClick={() => { onQueryChange(''); setOpen(false) }}
            aria-label="Clear search"
            className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-mist-100"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {canVoice && (
          <button
            onClick={startVoice}
            disabled={listening}
            aria-label={listening ? 'Listening' : 'Search by voice'}
            className={cn(
              'mr-2 grid size-11 shrink-0 place-items-center rounded-xl transition-colors',
              listening ? 'bg-alert-600 text-white' : 'bg-med-50 text-med-700 hover:bg-med-100',
            )}
          >
            {listening
              ? <Loader2 size={20} className="animate-spin" aria-hidden="true" />
              : <Mic size={20} aria-hidden="true" />}
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching conditions"
          className="surface-raised absolute inset-x-0 top-full z-40 mt-2 max-h-80 overflow-y-auto p-1.5"
        >
          {results.map((t, i) => (
            <li key={t.key}>
              <button
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(t)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                  i === active ? 'bg-med-50' : 'hover:bg-mist-50',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-900">{t.name}</span>
                  <span className="block truncate text-[0.82rem] text-ink-500">
                    {SPECIALTY_LABEL[t.specialty]}
                  </span>
                </span>
                {t.urgent && (
                  <span className="shrink-0 rounded-md bg-alert-50 px-2 py-1 text-[0.72rem] font-bold text-alert-700 ring-1 ring-alert-200">
                    URGENT
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
