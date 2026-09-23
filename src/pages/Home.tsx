import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowRight, Bot, Building2, Coins, HandHeart, LocateFixed, Phone, ShieldCheck, TriangleAlert,
} from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { HospitalCardSkeleton } from '@/components/ui/Skeleton'
import { QuickActions } from '@/components/layout/QuickActions'
import { Hero3D } from '@/components/layout/Hero3D'
import { HospitalCard } from '@/components/hospital/HospitalCard'
import { TreatmentSearch } from '@/components/hospital/TreatmentSearch'
import { HOSPITALS } from '@/data/hospitals'
import { haversineKm } from '@/lib/geo'
import { useLocation } from '@/store/location'
import { COINS_PER_RESCUE } from '@/store/wallet'
import type { Treatment } from '@/data/treatments'

type ShellContext = { openSos: () => void }

export function Home() {
  const { openSos } = useOutletContext<ShellContext>()
  const { coords, status, approximate, request } = useLocation()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  /** Nearest emergency-capable hospitals. Falls back to top-rated when we
   *  have no position, so the section is never empty. */
  const nearby = useMemo(() => {
    const open = HOSPITALS.filter((h) => h.emergency24x7)
    if (!coords) {
      return open
        .slice()
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3)
        .map((h) => ({ hospital: h, distanceKm: null as number | null }))
    }
    return open
      .map((h) => ({ hospital: h, distanceKm: haversineKm(coords, { lat: h.lat, lng: h.lng }) }))
      .sort((a, b) => a.distanceKm! - b.distanceKm!)
      .slice(0, 3)
  }, [coords])

  function goToResults(t: Treatment) {
    navigate(`/hospitals?t=${encodeURIComponent(t.key)}`)
  }

  return (
    <>
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden border-b border-mist-200 bg-white">
        {/* A single soft light wash, not a decorative gradient field. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60rem 30rem at 78% -10%, var(--color-med-50), transparent 65%)',
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-med-50 px-3 py-1.5 text-[0.82rem] font-bold text-med-800 ring-1 ring-med-200">
              <ShieldCheck size={16} aria-hidden="true" />
              {HOSPITALS.length} verified hospitals · 20 cities
            </p>

            <h1 className="mt-4 text-[2.1rem] leading-[1.08] font-extrabold sm:text-5xl lg:text-[3.4rem]">
              Get emergency medical help{' '}
              <span className="text-med-600">quickly</span>.
            </h1>

            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-ink-700 sm:text-[1.15rem]">
              The nearest hospital that can actually treat you, what it will cost,
              and an ambulance on the way — in under a minute, on any phone.
            </p>

            {/* The two decisions someone makes on arrival. Nothing else competes. */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LinkButton
                href="tel:112"
                variant="emergency"
                size="xl"
                className="flex-1"
                icon={<Phone size={26} aria-hidden="true" />}
              >
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-lg font-extrabold">EMERGENCY — CALL NOW</span>
                  <span className="text-[0.82rem] font-semibold text-white/85">
                    112 · free from any phone
                  </span>
                </span>
              </LinkButton>

              <Button
                variant="secondary"
                size="xl"
                className="flex-1"
                onClick={() => navigate('/hospitals')}
                icon={<Building2 size={24} aria-hidden="true" />}
              >
                Find Nearby Hospital
              </Button>
            </div>

            <button
              onClick={openSos}
              className="mt-3 inline-flex items-center gap-2 text-[0.92rem] font-semibold text-ink-700 underline underline-offset-4 hover:text-alert-700"
            >
              <TriangleAlert size={18} aria-hidden="true" />
              More options — ambulance, share location, all helplines
            </button>
          </div>

          <div className="hidden pt-6 lg:block">
            <Hero3D />
          </div>
        </div>
      </section>

      {/* ───────────────── Search ───────────────── */}
      <section
        aria-labelledby="search-heading"
        className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"
      >
        <h2 id="search-heading" className="mb-3 text-xl font-bold sm:text-2xl">
          What is the problem?
        </h2>
        <p className="mb-4 max-w-2xl text-[0.98rem] text-ink-500">
          Type or say the injury, symptom or treatment. We will show hospitals
          that treat it, what it costs there, and how far it is.
        </p>
        <TreatmentSearch
          value={query}
          onQueryChange={setQuery}
          onSelect={goToResults}
          size="xl"
        />
      </section>

      {/* ───────────────── Quick actions ───────────────── */}
      <section aria-labelledby="quick-heading" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <h2 id="quick-heading" className="mb-4 text-xl font-bold sm:text-2xl">
          Quick actions
        </h2>
        <QuickActions />
      </section>

      {/* ───────────────── Nearby facilities ───────────────── */}
      <section aria-labelledby="nearby-heading" className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <SectionHeading
          id="nearby-heading"
          title="Nearby emergency hospitals"
          sub={
            coords
              ? approximate
                ? 'Based on your last known location'
                : 'Based on your current location'
              : 'Turn on location for accurate distances'
          }
          action={
            <Link
              to="/hospitals"
              data-tap
              className="hidden shrink-0 items-center gap-1 text-[0.95rem] font-bold text-med-700 hover:underline sm:inline-flex"
            >
              See all <ArrowRight size={18} aria-hidden="true" />
            </Link>
          }
        />

        {!coords && status !== 'locating' && (
          <Card className="mb-4 flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
            <LocateFixed size={24} className="shrink-0 text-med-600" aria-hidden="true" />
            <p className="flex-1 text-[0.95rem] text-ink-700">
              {status === 'denied'
                ? 'Location is blocked. You can pick your city on the hospitals page instead.'
                : 'Share your location to sort hospitals by how far away they are.'}
            </p>
            <Button size="md" onClick={request} className="w-full sm:w-auto">
              {status === 'denied' ? 'Try again' : 'Use my location'}
            </Button>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {status === 'locating'
            ? Array.from({ length: 3 }, (_, i) => <HospitalCardSkeleton key={i} />)
            : nearby.map(({ hospital, distanceKm }) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  distanceKm={distanceKm}
                  from={coords}
                />
              ))}
        </div>

        <Link
          to="/hospitals"
          data-tap
          className="mt-4 flex items-center justify-center gap-2 text-[0.98rem] font-bold text-med-700 sm:hidden"
        >
          See all {HOSPITALS.length} hospitals <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      {/* ───────────────── Three pillars ───────────────── */}
      <section aria-labelledby="more-heading" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <SectionHeading
          id="more-heading"
          title="Beyond the emergency"
          sub="What CareConnect does once the immediate danger has passed."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            to="/assistant"
            icon={<Bot size={26} aria-hidden="true" />}
            title="AI Health Assistant"
            body="Describe symptoms in plain language, or upload a report and get it explained without the jargon. Always with a clear line about when to see a real doctor."
            cta="Ask a question"
          />
          <FeatureCard
            to="/fundraisers"
            icon={<HandHeart size={26} aria-hidden="true" />}
            title="Medical Fundraisers"
            body="Patients who cannot pay, with hospital-verified bills and every rupee traced from donation to hospital account."
            cta="See who needs help"
          />
          <FeatureCard
            to="/hero"
            icon={<Coins size={26} aria-hidden="true" />}
            title="Be a CareConnect Hero"
            body={`Helped a stranger reach a hospital? Once the hospital confirms it, ${COINS_PER_RESCUE} CareCoins land in your wallet — usable against your own future bills.`}
            cta="Report a rescue"
          />
        </div>
      </section>

      {/* ───────────────── Reassurance band ───────────────── */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="surface-raised overflow-hidden">
          <div className="grid divide-y divide-mist-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { k: '< 60 sec', v: 'From opening the app to a ringing ambulance line' },
              { k: '112 · 108', v: 'Real national helplines, one tap, no login required' },
              { k: 'Offline', v: 'First aid and emergency numbers work without a network' },
            ].map((s) => (
              <div key={s.k} className="px-6 py-7 text-center">
                <p className="text-2xl font-extrabold text-med-700">{s.k}</p>
                <p className="mt-1.5 text-[0.92rem] text-ink-500">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function FeatureCard({
  to, icon, title, body, cta,
}: { to: string; icon: React.ReactNode; title: string; body: string; cta: string }) {
  return (
    <Card interactive className="flex flex-col p-5">
      <span className="grid size-13 place-items-center rounded-2xl bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),var(--shadow-e2)]">
        {icon}
      </span>
      <h3 className="mt-4 text-[1.15rem] font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink-500">{body}</p>
      <Link
        to={to}
        data-tap
        className="mt-4 inline-flex items-center gap-1.5 font-bold text-med-700 hover:underline"
      >
        {cta} <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  )
}
