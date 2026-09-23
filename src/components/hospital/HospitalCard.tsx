import { memo } from 'react'
import { Link } from 'react-router-dom'
import {
  Ambulance, BedDouble, BadgeCheck, Droplets, HandHeart, Navigation, Phone,
  ShieldCheck, Star, Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'
import { costFor, icuBedsFree, offersTreatment, type Hospital } from '@/data/hospitals'
import { SPECIALTY_LABEL, type Treatment } from '@/data/treatments'
import { formatCostBand, formatDistance, formatEta } from '@/lib/format'
import { directionsUrl, type Coords } from '@/lib/geo'
import { cn } from '@/lib/cn'

const OWNERSHIP_LABEL = {
  government: 'Government',
  trust: 'Trust / Non-profit',
  private: 'Private',
} as const

export const HospitalCard = memo(function HospitalCard({
  hospital,
  distanceKm,
  treatment,
  from,
  rank,
}: {
  hospital: Hospital
  distanceKm: number | null
  /** When set, the card shows this treatment's price band and availability. */
  treatment?: Treatment | null
  from?: Coords | null
  /** National rank badge, shown in "best in India" results. */
  rank?: number
}) {
  const bedsFree = icuBedsFree(hospital)
  const offers = treatment ? offersTreatment(hospital, treatment) : true
  const cost = treatment && offers ? costFor(hospital, treatment) : null
  const eta = formatEta(distanceKm)

  return (
    <Card interactive className="overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Rank chip doubles as the card's visual anchor. */}
          <div
            className={cn(
              'grid size-12 shrink-0 place-items-center rounded-xl text-white',
              'shadow-[inset_0_1px_0_rgb(255_255_255/0.3),var(--shadow-e2)]',
              hospital.emergency24x7 ? 'bg-med-600' : 'bg-ink-500',
            )}
            aria-hidden="true"
          >
            {rank ? (
              <span className="text-lg font-extrabold">#{rank}</span>
            ) : (
              <Ambulance size={24} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[1.05rem] leading-snug font-bold text-ink-900">
              {hospital.name}
            </h3>
            <p className="mt-0.5 text-[0.88rem] text-ink-500">
              {hospital.area}, {hospital.city} · {OWNERSHIP_LABEL[hospital.ownership]}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.88rem]">
              <span className="inline-flex items-center gap-1 font-bold text-ink-900">
                <Star size={15} className="fill-warn-600 text-warn-600" aria-hidden="true" />
                {hospital.rating.toFixed(1)}
                <span className="font-normal text-ink-400">
                  ({hospital.reviews.toLocaleString('en-IN')})
                </span>
              </span>
              {distanceKm !== null && (
                <span className="font-semibold text-med-700">
                  {formatDistance(distanceKm)}
                  {eta && <span className="font-normal text-ink-500"> · ~{eta} drive</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status row: the three facts that decide where an ambulance goes. */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          {hospital.emergency24x7 ? (
            <Badge tone="good" icon={<ShieldCheck size={14} aria-hidden="true" />}>
              Emergency open 24×7
            </Badge>
          ) : (
            <Badge tone="warn">OPD hours only — no emergency</Badge>
          )}

          <Badge tone={bedsFree > 5 ? 'good' : bedsFree > 0 ? 'warn' : 'alert'}
                 icon={<BedDouble size={14} aria-hidden="true" />}>
            {bedsFree > 0 ? `${bedsFree} ICU beds free` : 'ICU full'}
          </Badge>

          {hospital.traumaCentre && <Badge tone="blue">Level-1 Trauma</Badge>}
          {hospital.bloodBank && (
            <Badge tone="blue" icon={<Droplets size={14} aria-hidden="true" />}>Blood bank</Badge>
          )}
          {hospital.accreditation.map((a) => (
            <Badge key={a} tone="neutral" icon={<BadgeCheck size={14} aria-hidden="true" />}>{a}</Badge>
          ))}
        </div>

        {/* Treatment-specific panel — only when the user searched a condition. */}
        {treatment && (
          <div
            className={cn(
              'mt-3.5 rounded-xl px-4 py-3 ring-1 ring-inset',
              offers ? 'bg-med-50 ring-med-200' : 'bg-mist-100 ring-mist-300',
            )}
          >
            {offers ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.85rem] font-semibold text-med-800">
                    {treatment.name}
                  </span>
                  <span className="shrink-0 text-[1.05rem] font-extrabold text-med-800">
                    {formatCostBand(cost!.min, cost!.max)}
                  </span>
                </div>
                <p className="mt-1 text-[0.78rem] text-ink-500">
                  Estimated package range. Confirm with the hospital — final cost
                  depends on room class, implants and length of stay.
                </p>
                <Link
                  to={`/fundraisers/start?hospital=${hospital.id}&t=${treatment.key}`}
                  data-tap
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 text-[0.85rem] font-bold text-med-700 ring-1 ring-med-200 hover:ring-med-400"
                >
                  <HandHeart size={16} aria-hidden="true" />
                  Can't afford this? Start a fundraiser
                </Link>
              </>
            ) : (
              <p className="text-[0.88rem] font-medium text-ink-700">
                Does not treat {SPECIALTY_LABEL[treatment.specialty].toLowerCase()} cases.
                Shown because it is nearby.
              </p>
            )}
          </div>
        )}

        {hospital.schemes.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-[0.84rem] text-ink-500">
            <Wallet size={15} className="mt-0.5 shrink-0 text-good-600" aria-hidden="true" />
            <span>
              Cashless under{' '}
              <strong className="font-semibold text-ink-700">
                {hospital.schemes.join(', ')}
              </strong>
              {hospital.partner && (
                <>
                  {' '}· <span className="font-semibold text-med-700">CareCoins accepted</span>
                </>
              )}
            </span>
          </p>
        )}
      </div>

      {/* Actions sit in a tinted tray so the tap targets read as a unit. */}
      <div className="grid grid-cols-2 gap-2.5 border-t border-mist-200 bg-mist-50 p-3">
        <LinkButton
          href={`tel:${hospital.phone}`}
          variant="primary"
          size="lg"
          icon={<Phone size={20} aria-hidden="true" />}
        >
          Call
          <span className="sr-only"> {hospital.name}</span>
        </LinkButton>
        <LinkButton
          href={directionsUrl({ lat: hospital.lat, lng: hospital.lng }, hospital.name, from)}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="lg"
          icon={<Navigation size={20} aria-hidden="true" />}
        >
          Directions
          <span className="sr-only"> to {hospital.name}</span>
        </LinkButton>
      </div>
    </Card>
  )
})
