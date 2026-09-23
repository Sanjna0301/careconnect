import { useMemo, useState } from 'react'
import { BadgeCheck, Clock, HandHeart, ShieldCheck, Users } from 'lucide-react'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RouterButton } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { CAMPAIGNS, daysLeft, fundedPercent, type Campaign } from '@/data/campaigns'
import { formatINRCompact } from '@/lib/format'
import { cn } from '@/lib/cn'

type Tab = 'all' | 'urgent' | 'closing'

export function Fundraisers() {
  const [tab, setTab] = useState<Tab>('all')

  const list = useMemo(() => {
    if (tab === 'urgent') return CAMPAIGNS.filter((c) => c.urgent)
    if (tab === 'closing') return CAMPAIGNS.filter((c) => daysLeft(c) <= 30 && fundedPercent(c) < 100)
    return CAMPAIGNS
  }, [tab])

  const totals = useMemo(() => ({
    raised: CAMPAIGNS.reduce((s, c) => s + c.raised, 0),
    donors: CAMPAIGNS.reduce((s, c) => s + c.donors, 0),
    verified: CAMPAIGNS.filter((c) => c.status === 'verified').length,
  }), [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Medical fundraisers</h1>
        <p className="mt-1.5 max-w-2xl text-[1rem] leading-relaxed text-ink-500">
          People who cannot pay for treatment they need. Every bill here is
          checked against the hospital, and money goes to the hospital's account
          — never to an individual.
        </p>
      </header>

      {/* Trust band: the three numbers a first-time donor looks for. */}
      <div className="surface-raised mb-6 grid divide-y divide-mist-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { icon: HandHeart, k: formatINRCompact(totals.raised), v: 'raised across all campaigns' },
          { icon: Users, k: totals.donors.toLocaleString('en-IN'), v: 'people have donated' },
          { icon: ShieldCheck, k: `${totals.verified} of ${CAMPAIGNS.length}`, v: 'hospital-verified so far' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.v} className="flex items-center gap-3 px-5 py-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-med-50 text-med-700">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[1.3rem] leading-none font-extrabold text-ink-900">{s.k}</p>
                <p className="mt-1 text-[0.88rem] text-ink-500">{s.v}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter campaigns">
        {([
          ['all', `All (${CAMPAIGNS.length})`],
          ['urgent', 'Urgent'],
          ['closing', 'Closing soon'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'min-h-11 rounded-xl px-4 text-[0.92rem] font-bold transition-colors',
              tab === key
                ? 'bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_0_var(--color-med-800)]'
                : 'bg-white text-ink-700 ring-1 ring-mist-300 hover:ring-med-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => <CampaignCard key={c.id} campaign={c} />)}
      </div>

      <SectionHeading
        title="How we keep this honest"
        sub="The failure mode of medical crowdfunding is fraud. Here is what stops it."
        className="mt-14"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            t: 'The hospital confirms the bill',
            d: 'Diagnosis, estimate and running bills are checked directly with the treating hospital\'s billing office before a campaign is marked verified. Unverified campaigns stay visible, clearly labelled, and cannot receive disbursements.',
          },
          {
            t: 'Money never touches the patient',
            d: 'Donations settle into an escrow account and are released to the hospital against invoices. The patient\'s family never receives cash, which removes both the temptation and the suspicion.',
          },
          {
            t: 'Every rupee is published',
            d: 'Each campaign page lists what was disbursed, on what date, to which hospital and against which invoice. Unspent funds on a closed campaign are returned or redirected with the donor\'s consent.',
          },
        ].map((x) => (
          <Card key={x.t} className="p-5">
            <BadgeCheck size={24} className="text-good-600" aria-hidden="true" />
            <h3 className="mt-3 text-[1.05rem] font-bold">{x.t}</h3>
            <p className="mt-2 text-[0.93rem] leading-relaxed text-ink-500">{x.d}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const pct = fundedPercent(c)
  const days = daysLeft(c)
  const complete = pct >= 100

  return (
    <Card interactive className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Initial avatar: no stock photography, no borrowed faces. */}
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-med-700 text-[1.15rem] font-extrabold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
            aria-hidden="true"
          >
            {c.patientName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink-900">{c.patientName}</p>
            <p className="text-[0.85rem] text-ink-500">
              {c.age === 0 ? 'Newborn' : `${c.age} yrs`} · {c.city}
            </p>
          </div>
        </div>
        {c.urgent && !complete && <Badge tone="alert">Urgent</Badge>}
      </div>

      <h3 className="mt-3.5 text-[1.05rem] leading-snug font-bold">{c.title}</h3>
      <p className="mt-1.5 text-[0.88rem] text-ink-500">{c.condition}</p>

      <div className="mt-4 flex-1">
        <Progress value={pct} tone={complete ? 'good' : 'blue'} label={`${pct}% funded`} />
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[1.05rem] font-extrabold text-ink-900">
            {formatINRCompact(c.raised)}
            <span className="ml-1 text-[0.85rem] font-medium text-ink-500">
              of {formatINRCompact(c.goal)}
            </span>
          </span>
          <span className={cn('text-[0.88rem] font-bold', complete ? 'text-good-700' : 'text-med-700')}>
            {pct}%
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {c.status === 'verified' ? (
          <Badge tone="good" icon={<ShieldCheck size={14} aria-hidden="true" />}>
            Hospital verified
          </Badge>
        ) : (
          <Badge tone="warn">Verification in progress</Badge>
        )}
        <Badge tone="neutral" icon={<Users size={14} aria-hidden="true" />}>
          {c.donors.toLocaleString('en-IN')} donors
        </Badge>
        {!complete && (
          <Badge tone={days <= 14 ? 'warn' : 'neutral'} icon={<Clock size={14} aria-hidden="true" />}>
            {days} days left
          </Badge>
        )}
      </div>

      <RouterButton
        to={`/fundraisers/${c.id}`}
        block
        size="lg"
        variant={complete ? 'secondary' : 'primary'}
        className="mt-4"
      >
        {complete ? 'See where the money went' : 'Read the story & donate'}
      </RouterButton>
    </Card>
  )
}
