import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CITIES } from '@/data/hospitals'
import { SPECIALTY_LABEL, type Specialty } from '@/data/treatments'
import { cn } from '@/lib/cn'

export type FilterState = {
  radiusKm: number
  budget: 'any' | 'budget' | 'standard' | 'premium'
  minRating: number
  specialty: Specialty | 'any'
  emergencyOnly: boolean
  schemeOnly: boolean
  partnerOnly: boolean
  city: string | 'any'
}

export const DEFAULT_FILTERS: FilterState = {
  radiusKm: 25,
  budget: 'any',
  minRating: 0,
  specialty: 'any',
  emergencyOnly: false,
  schemeOnly: false,
  partnerOnly: false,
  city: 'any',
}

export function countActive(f: FilterState): number {
  let n = 0
  if (f.radiusKm !== DEFAULT_FILTERS.radiusKm) n++
  if (f.budget !== 'any') n++
  if (f.minRating > 0) n++
  if (f.specialty !== 'any') n++
  if (f.emergencyOnly) n++
  if (f.schemeOnly) n++
  if (f.partnerOnly) n++
  if (f.city !== 'any') n++
  return n
}

const RADII = [2, 5, 10, 25, 50, 200]
const BUDGETS = [
  { value: 'any', label: 'Any' },
  { value: 'budget', label: 'Budget-friendly' },
  { value: 'standard', label: 'Mid-range' },
  { value: 'premium', label: 'Premium' },
] as const
const RATINGS = [0, 4, 4.5]

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 text-[0.85rem] font-bold tracking-wide text-ink-500 uppercase">
        {label}
      </legend>
      {children}
    </fieldset>
  )
}

function Chip({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'min-h-11 rounded-xl px-3.5 text-[0.9rem] font-semibold transition-colors',
        selected
          ? 'bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_0_var(--color-med-800)]'
          : 'bg-white text-ink-700 ring-1 ring-mist-300 hover:ring-med-300',
      )}
    >
      {children}
    </button>
  )
}

export function Filters({
  value, onChange, onClose, hasLocation,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
  onClose?: () => void
  hasLocation: boolean
}) {
  const set = <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
    onChange({ ...value, [key]: v })

  const active = countActive(value)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
          <SlidersHorizontal size={20} className="text-med-600" aria-hidden="true" />
          Filters
          {active > 0 && (
            <span className="rounded-full bg-med-600 px-2 py-0.5 text-[0.75rem] font-bold text-white">
              {active}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          {active > 0 && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="min-h-11 rounded-lg px-3 text-[0.88rem] font-bold text-med-700 hover:bg-mist-100"
            >
              Reset
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close filters"
              className="grid size-11 place-items-center rounded-lg text-ink-500 hover:bg-mist-100 lg:hidden"
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <Group label={hasLocation ? 'Distance from you' : 'Distance (needs location)'}>
        <div className="flex flex-wrap gap-2">
          {RADII.map((r) => (
            <Chip
              key={r}
              selected={value.radiusKm === r}
              onClick={() => set('radiusKm', r)}
            >
              {r >= 200 ? 'All India' : `${r} km`}
            </Chip>
          ))}
        </div>
        {!hasLocation && (
          <p className="mt-2 text-[0.82rem] text-ink-500">
            Without location this filter is ignored — pick a city instead.
          </p>
        )}
      </Group>

      <Group label="Budget">
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <Chip
              key={b.value}
              selected={value.budget === b.value}
              onClick={() => set('budget', b.value)}
            >
              {b.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Minimum rating">
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <Chip key={r} selected={value.minRating === r} onClick={() => set('minRating', r)}>
              {r === 0 ? 'Any' : `${r}★ and above`}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Speciality">
        <select
          value={value.specialty}
          onChange={(e) => set('specialty', e.target.value as Specialty | 'any')}
          aria-label="Speciality"
          className="h-12 w-full rounded-xl bg-white px-3 text-[0.95rem] ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
        >
          <option value="any">All specialities</option>
          {(Object.keys(SPECIALTY_LABEL) as Specialty[]).map((s) => (
            <option key={s} value={s}>{SPECIALTY_LABEL[s]}</option>
          ))}
        </select>
      </Group>

      <Group label="City">
        <select
          value={value.city}
          onChange={(e) => set('city', e.target.value)}
          aria-label="City"
          className="h-12 w-full rounded-xl bg-white px-3 text-[0.95rem] ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
        >
          <option value="any">Any city</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Group>

      <Group label="Must have">
        <div className="space-y-2">
          {([
            ['emergencyOnly', 'Emergency open 24×7'],
            ['schemeOnly', 'Accepts Ayushman Bharat / state scheme'],
            ['partnerOnly', 'Accepts CareCoins'],
          ] as const).map(([key, label]) => (
            <label
              key={key}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-white px-3.5 ring-1 ring-mist-300 hover:ring-med-300"
            >
              <input
                type="checkbox"
                checked={value[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="size-5 shrink-0 accent-[var(--color-med-600)]"
              />
              <span className="text-[0.95rem] font-medium text-ink-900">{label}</span>
            </label>
          ))}
        </div>
      </Group>

      {onClose && (
        <Button block size="lg" onClick={onClose} className="lg:hidden">
          Show results
        </Button>
      )}
    </div>
  )
}
