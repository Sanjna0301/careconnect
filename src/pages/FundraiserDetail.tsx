import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Banknote, CircleCheck, Clock, FileCheck2, Heart, Landmark,
  Share2, ShieldCheck, Users,
} from 'lucide-react'
import { Button, RouterButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Sheet } from '@/components/ui/Sheet'
import { useAnnounce } from '@/components/ui/Announcer'
import { daysLeft, fundedPercent, totalDisbursed } from '@/data/campaigns'
import { useCampaigns } from '@/store/campaignsContext'
import { canAcceptDonations } from '@/lib/campaignDraft'
import { HOSPITALS } from '@/data/hospitals'
import { formatDate, formatINR, formatINRCompact } from '@/lib/format'
import { cn } from '@/lib/cn'

const PRESETS = [500, 1000, 2500, 5000]

export function FundraiserDetail() {
  const { id } = useParams()
  const { byId, isMine, markVerified } = useCampaigns()
  const campaign = id ? byId(id) : undefined
  const [donateOpen, setDonateOpen] = useState(false)
  const [amount, setAmount] = useState(1000)
  const announce = useAnnounce()

  const hospital = useMemo(
    () => HOSPITALS.find((h) => h.id === campaign?.hospitalId),
    [campaign],
  )

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Campaign not found</h1>
        <p className="mt-2 text-ink-500">It may have closed, or the link is wrong.</p>
        <RouterButton to="/fundraisers" size="lg" className="mt-5">
          See all fundraisers
        </RouterButton>
      </div>
    )
  }

  const mine = isMine(campaign.id)
  const donatable = canAcceptDonations(campaign)
  const pct = fundedPercent(campaign)
  const days = daysLeft(campaign)
  const disbursed = totalDisbursed(campaign)
  const complete = pct >= 100
  const verifiedDocs = campaign.documents.filter((d) => d.verifiedOn)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: campaign!.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        announce('Link copied. Sharing is often worth more than donating.', 'success')
      }
    } catch { /* dismissed */ }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/fundraisers"
        data-tap
        className="mb-4 inline-flex items-center gap-1.5 font-semibold text-med-700 hover:underline"
      >
        <ArrowLeft size={18} aria-hidden="true" /> All fundraisers
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {campaign.status === 'verified' ? (
              <Badge tone="good" icon={<ShieldCheck size={14} aria-hidden="true" />}>
                Verified by {campaign.verifiedBy}
              </Badge>
            ) : campaign.status === 'pending' ? (
              <Badge tone="warn">Verification in progress — donations held in escrow</Badge>
            ) : (
              <Badge tone="warn">Awaiting hospital verification — donations closed</Badge>
            )}
            {mine && <Badge tone="blue">Your campaign</Badge>}
            {campaign.urgent && !complete && <Badge tone="alert">Urgent</Badge>}
          </div>

          <h1 className="mt-3 text-2xl leading-tight font-extrabold sm:text-[2rem]">
            {campaign.title}
          </h1>
          <p className="mt-2 text-[1rem] text-ink-500">
            {campaign.patientName} · {campaign.age === 0 ? 'Newborn' : `${campaign.age} years old`} ·{' '}
            {campaign.city} · {campaign.condition}
          </p>

          <Card className="mt-5 p-5">
            <h2 className="text-[1.1rem] font-bold">The story</h2>
            <p className="mt-2.5 text-[1rem] leading-relaxed whitespace-pre-line text-ink-700">
              {campaign.story}
            </p>
          </Card>

          {/* Documents — the reason to believe any of this. */}
          <Card className="mt-5 p-5">
            <h2 className="flex items-center gap-2 text-[1.1rem] font-bold">
              <FileCheck2 size={22} className="text-med-600" aria-hidden="true" />
              Documents ({verifiedDocs.length} of {campaign.documents.length} verified)
            </h2>
            <ul className="mt-3 divide-y divide-mist-200 overflow-hidden rounded-xl ring-1 ring-mist-200">
              {campaign.documents.map((d) => (
                <li key={d.label} className="flex flex-wrap items-center gap-3 p-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">{d.label}</span>
                    <span className="block text-[0.85rem] text-ink-500">
                      {d.verifiedOn
                        ? `Checked ${formatDate(d.verifiedOn)} by ${d.verifiedBy}`
                        : 'Submitted — not yet checked'}
                    </span>
                  </span>
                  <Badge tone={d.verifiedOn ? 'good' : 'warn'}>
                    {d.verifiedOn ? 'Verified' : 'Pending'}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-500">
              Documents are checked with the hospital, then redacted before
              publication. Patient identifiers are never shown publicly — donors
              see that a bill was verified, not the bill itself.
            </p>
          </Card>

          {/* Money trail */}
          <Card className="mt-5 p-5">
            <h2 className="flex items-center gap-2 text-[1.1rem] font-bold">
              <Landmark size={22} className="text-med-600" aria-hidden="true" />
              Where the money has gone
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { k: formatINRCompact(campaign.raised), v: 'raised' },
                { k: formatINRCompact(disbursed), v: 'paid to hospital' },
                { k: formatINRCompact(campaign.raised - disbursed), v: 'held in escrow' },
              ].map((s) => (
                <div key={s.v} className="rounded-xl bg-mist-50 p-3.5 ring-1 ring-mist-200">
                  <p className="text-[1.2rem] font-extrabold text-ink-900">{s.k}</p>
                  <p className="text-[0.85rem] text-ink-500">{s.v}</p>
                </div>
              ))}
            </div>

            {campaign.disbursements.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {campaign.disbursements.map((d, i) => (
                  <li key={d.date + i} className="flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-good-50 text-good-700 ring-1 ring-good-100">
                      <CircleCheck size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-bold text-ink-900">{formatINR(d.amount)}</span>
                        <span className="text-[0.85rem] text-ink-500">{formatDate(d.date)}</span>
                      </p>
                      <p className="text-[0.9rem] text-ink-700">{d.note}</p>
                      <p className="text-[0.82rem] text-ink-400">Paid to {d.to}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-xl bg-mist-50 p-3.5 text-[0.92rem] text-ink-700">
                Nothing has been disbursed yet. Funds stay in escrow until the
                hospital raises an invoice against this treatment.
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 text-[0.85rem] leading-relaxed text-ink-500">
              <Banknote size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Settlement account: {campaign.settlesTo}. Donations are not paid to
              the patient or the family at any point.
            </p>
          </Card>
        </div>

        {/* Donation rail — sticky on desktop, pinned card on mobile. */}
        <aside>
          <Card raised className="p-5 lg:sticky lg:top-22">
            <Progress value={pct} tone={complete ? 'good' : 'blue'} label={`${pct}% funded`} />
            <p className="mt-3 text-[1.6rem] leading-none font-extrabold text-ink-900">
              {formatINRCompact(campaign.raised)}
            </p>
            <p className="mt-1 text-[0.92rem] text-ink-500">
              raised of {formatINRCompact(campaign.goal)} goal
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="neutral" icon={<Users size={14} aria-hidden="true" />}>
                {campaign.donors.toLocaleString('en-IN')} donors
              </Badge>
              {!complete && (
                <Badge tone={days <= 14 ? 'warn' : 'neutral'} icon={<Clock size={14} aria-hidden="true" />}>
                  {days} days left
                </Badge>
              )}
            </div>

            {complete ? (
              <div className="mt-5 rounded-xl bg-good-50 p-4 ring-1 ring-good-100">
                <p className="font-bold text-good-700">Fully funded. Treatment complete.</p>
                <p className="mt-1 text-[0.9rem] text-good-700">
                  This page stays open so donors can see exactly where their money went.
                </p>
              </div>
            ) : !donatable ? (
              <div className="mt-5 rounded-xl bg-warn-50 p-4 ring-1 ring-warn-100">
                <p className="flex items-center gap-2 font-bold text-warn-700">
                  <ShieldCheck size={18} aria-hidden="true" /> Donations are closed
                </p>
                <p className="mt-1 text-[0.9rem] leading-relaxed text-warn-700">
                  This campaign cannot receive money until the hospital confirms
                  the diagnosis and the cost estimate. That check is what protects
                  both donors and the patient.
                </p>
              </div>
            ) : (
              <Button
                block
                size="xl"
                className="mt-5"
                onClick={() => setDonateOpen(true)}
                icon={<Heart size={22} aria-hidden="true" />}
              >
                Donate
              </Button>
            )}

            {/* Stands in for the hospital's verification desk, which is a
                separate product with its own accounts and audit trail. */}
            {mine && campaign.status !== 'verified' && (
              <div className="mt-3 rounded-xl border border-dashed border-mist-300 p-3">
                <p className="text-[0.82rem] text-ink-400">
                  Demo control — in production only hospital staff can do this.
                </p>
                <Button
                  size="md"
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => {
                    markVerified(campaign.id)
                    announce('Hospital confirmed the estimate. Donations are now open.', 'success')
                  }}
                >
                  Simulate hospital verification
                </Button>
              </div>
            )}

            <Button
              block
              size="lg"
              variant="secondary"
              className="mt-2.5"
              onClick={share}
              icon={<Share2 size={20} aria-hidden="true" />}
            >
              Share
            </Button>

            {hospital && (
              <div className="mt-5 border-t border-mist-200 pt-4">
                <p className="text-[0.8rem] font-bold tracking-wide text-ink-500 uppercase">
                  Treating hospital
                </p>
                <p className="mt-1.5 font-semibold text-ink-900">{hospital.name}</p>
                <p className="text-[0.88rem] text-ink-500">
                  {hospital.area}, {hospital.city}
                </p>
                <Link
                  to={`/hospitals?t=${campaign.treatmentKey}`}
                  data-tap
                  className="mt-2 inline-flex text-[0.9rem] font-bold text-med-700 hover:underline"
                >
                  See this treatment's typical cost
                </Link>
              </div>
            )}
          </Card>
        </aside>
      </div>

      <Sheet
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        title={`Donate to ${campaign.patientName}`}
        description="Payments are not connected in this prototype build."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                aria-pressed={amount === p}
                className={cn(
                  'min-h-13 rounded-xl text-[1rem] font-bold transition-colors',
                  amount === p
                    ? 'bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_0_var(--color-med-800)]'
                    : 'bg-white text-ink-900 ring-1 ring-mist-300 hover:ring-med-300',
                )}
              >
                ₹{p.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[0.9rem] font-semibold text-ink-700">
              Or enter an amount
            </span>
            <input
              type="number"
              min={100}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="h-13 w-full rounded-xl bg-white px-4 text-[1.05rem] font-bold ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
            />
          </label>

          <div className="rounded-xl bg-mist-50 p-4 text-[0.9rem] leading-relaxed text-ink-700">
            <p className="font-semibold text-ink-900">What happens to {formatINR(amount)}</p>
            <ul className="mt-2 space-y-1.5">
              <li>· It goes to {campaign.settlesTo}, not to the family.</li>
              <li>· It is released only against a hospital invoice for this treatment.</li>
              <li>· You will see it appear in the disbursement list on this page.</li>
              <li>· Donations to registered medical trusts may qualify for 80G relief.</li>
            </ul>
          </div>

          <Button
            block
            size="xl"
            onClick={() => {
              setDonateOpen(false)
              announce('Payments are not wired up in this prototype build.', 'info')
            }}
          >
            Continue to payment
          </Button>
          <p className="text-center text-[0.82rem] text-ink-400">
            Payment gateway is not connected in this build.
          </p>
        </div>
      </Sheet>
    </div>
  )
}
