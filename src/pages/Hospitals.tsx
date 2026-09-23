import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LocateFixed, MapPin, SlidersHorizontal, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { HospitalCard } from '@/components/hospital/HospitalCard'
import { TreatmentSearch } from '@/components/hospital/TreatmentSearch'
import { DEFAULT_FILTERS, Filters, countActive, type FilterState } from '@/components/hospital/Filters'
import { bestInIndia, CITY_INDEX, costFor, HOSPITALS, offersTreatment, type Hospital } from '@/data/hospitals'
import { SPECIALTY_LABEL, TREATMENT_BY_KEY, type Treatment } from '@/data/treatments'
import { haversineKm } from '@/lib/geo'
import { useLocation } from '@/store/location'
import { CITY_CENTRES } from '@/data/cityCentres'

type Sort = 'distance' | 'cost' | 'rating'

type Row = { hospital: Hospital; distanceKm: number | null }

export function Hospitals() {
  const [params, setParams] = useSearchParams()
  const { coords, status, approximate, label, request, setManual } = useLocation()

  const treatment: Treatment | null = params.get('t')
    ? TREATMENT_BY_KEY[params.get('t')!] ?? null
    : null

  const [query, setQuery] = useState(treatment?.name ?? '')
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    emergencyOnly: params.get('emergency') === '1',
    specialty: treatment?.specialty ?? 'any',
  }))
  const [sort, setSort] = useState<Sort>('distance')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Keep the filter's speciality aligned when the searched condition changes.
  useEffect(() => {
    if (treatment) {
      setQuery(treatment.name)
      setFilters((f) => ({ ...f, specialty: treatment.specialty }))
    }
  }, [treatment])

  function selectTreatment(t: Treatment) {
    const next = new URLSearchParams(params)
    next.set('t', t.key)
    setParams(next, { replace: true })
  }

  function clearTreatment() {
    const next = new URLSearchParams(params)
    next.delete('t')
    setParams(next, { replace: true })
    setQuery('')
    setFilters((f) => ({ ...f, specialty: 'any' }))
  }

  const rows: Row[] = useMemo(() => {
    let list = HOSPITALS.slice()

    if (filters.emergencyOnly) list = list.filter((h) => h.emergency24x7)
    if (filters.budget !== 'any') list = list.filter((h) => h.tier === filters.budget)
    if (filters.minRating > 0) list = list.filter((h) => h.rating >= filters.minRating)
    if (filters.specialty !== 'any') list = list.filter((h) => h.specialties.includes(filters.specialty as never))
    if (filters.city !== 'any') list = list.filter((h) => h.city === filters.city)
    if (filters.partnerOnly) list = list.filter((h) => h.partner)
    if (filters.schemeOnly) list = list.filter((h) => h.schemes.length > 0)
    if (treatment) list = list.filter((h) => offersTreatment(h, treatment))

    let withDistance: Row[] = list.map((h) => ({
      hospital: h,
      distanceKm: coords ? haversineKm(coords, { lat: h.lat, lng: h.lng }) : null,
    }))

    if (coords && filters.radiusKm < 200) {
      withDistance = withDistance.filter((r) => (r.distanceKm ?? Infinity) <= filters.radiusKm)
    }

    const effectiveSort = sort === 'distance' && !coords ? 'rating' : sort

    withDistance.sort((a, b) => {
      if (effectiveSort === 'rating') return b.hospital.rating - a.hospital.rating
      if (effectiveSort === 'cost') {
        // Without a chosen treatment, tier × city index is the honest proxy.
        const cost = (h: Hospital) =>
          treatment
            ? costFor(h, treatment).min
            : ({ budget: 1, standard: 2, premium: 3 }[h.tier] * (CITY_INDEX[h.city] ?? 1))
        return cost(a.hospital) - cost(b.hospital)
      }
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    })

    return withDistance
  }, [filters, sort, coords, treatment])

  const national = treatment ? bestInIndia(treatment.specialty) : []
  const activeFilters = countActive(filters)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Find a hospital</h1>
        <p className="mt-1.5 text-[0.98rem] text-ink-500">
          {treatment
            ? `Hospitals that treat ${treatment.name.toLowerCase()}, with what it costs there.`
            : 'Search a condition to see which hospitals treat it and what they charge.'}
        </p>
      </header>

      <div className="mb-4">
        <TreatmentSearch value={query} onQueryChange={setQuery} onSelect={selectTreatment} />
      </div>

      {/* Location strip — one line, always says exactly what it knows. */}
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3.5">
        <MapPin size={20} className="shrink-0 text-med-600" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-[0.92rem] text-ink-700">
          {coords ? (
            <>
              <span className="font-semibold">
                {label ?? (approximate ? 'Last known location' : 'Your current location')}
              </span>
              {!approximate && <span className="text-ink-500"> · live GPS</span>}
            </>
          ) : status === 'denied' ? (
            'Location blocked — choose a city to continue.'
          ) : (
            'Location off — distances are hidden.'
          )}
        </p>
        <div className="flex items-center gap-2">
          <select
            aria-label="Set location by city"
            value=""
            onChange={(e) => {
              const centre = CITY_CENTRES[e.target.value]
              if (centre) setManual(centre, e.target.value)
            }}
            className="h-11 rounded-xl bg-white px-3 text-[0.88rem] font-medium ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
          >
            <option value="">Pick a city…</option>
            {Object.keys(CITY_CENTRES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button
            size="md"
            variant="secondary"
            onClick={request}
            disabled={status === 'locating'}
            icon={<LocateFixed size={18} aria-hidden="true" />}
          >
            {status === 'locating' ? 'Locating…' : 'Use GPS'}
          </Button>
        </div>
      </Card>

      {treatment && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl bg-med-600 px-3.5 py-2 text-[0.9rem] font-bold text-white">
            {treatment.name}
            <button onClick={clearTreatment} className="text-white/80 hover:text-white" aria-label="Clear condition filter">✕</button>
          </span>
          <span className="text-[0.88rem] text-ink-500">
            {SPECIALTY_LABEL[treatment.specialty]}
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <Card className="sticky top-22 p-5">
            <Filters value={filters} onChange={setFilters} hasLocation={Boolean(coords)} />
          </Card>
        </aside>

        <div>
          <div className="mb-4 flex items-center gap-3">
            <p className="flex-1 text-[0.95rem] font-semibold text-ink-700" aria-live="polite">
              {rows.length} {rows.length === 1 ? 'hospital' : 'hospitals'}
              {treatment ? ' that treat this' : ''}
            </p>

            <label className="flex items-center gap-2 text-[0.88rem] text-ink-500">
              <span className="hidden sm:inline">Sort</span>
              <select
                aria-label="Sort results"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-11 rounded-xl bg-white px-3 text-[0.9rem] font-semibold text-ink-900 ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
              >
                <option value="distance">Nearest first</option>
                <option value="cost">Lowest cost</option>
                <option value="rating">Highest rated</option>
              </select>
            </label>

            <Button
              variant="secondary"
              size="md"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
              icon={<SlidersHorizontal size={18} aria-hidden="true" />}
            >
              Filters{activeFilters > 0 && ` (${activeFilters})`}
            </Button>
          </div>

          {rows.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[1.05rem] font-bold">No hospitals match these filters.</p>
              <p className="mx-auto mt-2 max-w-md text-[0.95rem] text-ink-500">
                Widen the distance, clear the budget filter, or switch the city.
                In an emergency, call 108 — the operator will route you to whichever
                hospital can take you.
              </p>
              <Button className="mt-4" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset all filters
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {rows.map(({ hospital, distanceKm }) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  distanceKm={distanceKm}
                  treatment={treatment}
                  from={coords}
                />
              ))}
            </div>
          )}

          {/* Best in India — the national view, independent of distance. */}
          {national.length > 0 && (
            <section aria-labelledby="national-heading" className="mt-10">
              <div className="mb-4 flex items-center gap-2.5">
                <Trophy size={24} className="shrink-0 text-warn-600" aria-hidden="true" />
                <div>
                  <h2 id="national-heading" className="text-xl font-bold">
                    Best in India for {SPECIALTY_LABEL[treatment!.specialty].toLowerCase()}
                  </h2>
                  <p className="text-[0.9rem] text-ink-500">
                    Ranked nationally, wherever they are. Worth the travel for
                    planned treatment — not for an emergency.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {national.map((h) => (
                  <HospitalCard
                    key={`nat-${h.id}`}
                    hospital={h}
                    distanceKm={coords ? haversineKm(coords, { lat: h.lat, lng: h.lng }) : null}
                    treatment={treatment}
                    from={coords}
                    rank={h.nationalRank![treatment!.specialty]}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter hospitals"
        description="Narrow the list down to what you can reach and afford."
      >
        <Filters
          value={filters}
          onChange={setFilters}
          onClose={() => setFiltersOpen(false)}
          hasLocation={Boolean(coords)}
        />
      </Sheet>
    </div>
  )
}
