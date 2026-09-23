import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft, ArrowUpRight, Award, Building2, CircleAlert, Coins,
  HeartHandshake, Info, RotateCcw, Shield, TrendingUp,
} from 'lucide-react'
import { Button, RouterButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Sheet } from '@/components/ui/Sheet'
import { useAnnounce } from '@/components/ui/Announcer'
import { useWallet } from '@/store/walletContext'
import {
  COINS_PER_RESCUE, COIN_LIFETIME_MONTHS, REDEEM_CAP_PCT,
  balanceOf, earnedTotal, expiringSoon, maxRedeemable, pendingClaims,
  redeemedTotal, verifiedRescues,
} from '@/store/wallet'
import { HOSPITALS } from '@/data/hospitals'
import { formatCoins, formatDate, formatINR, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

export function WalletPage() {
  const { wallet, spend, reset } = useWallet()
  const announce = useAnnounce()
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [billAmount, setBillAmount] = useState(12000)
  const [partnerId, setPartnerId] = useState('')

  const balance = balanceOf(wallet)
  const earned = earnedTotal(wallet)
  const redeemed = redeemedTotal(wallet)
  const rescues = verifiedRescues(wallet)
  const pending = pendingClaims(wallet)
  const expiring = expiringSoon(wallet)

  const partners = useMemo(
    () => HOSPITALS.filter((h) => h.partner).sort((a, b) => a.city.localeCompare(b.city)),
    [],
  )

  const applicable = maxRedeemable(balance, billAmount)
  const payable = billAmount - applicable

  // Next milestone gives the wallet a forward-looking number, not just a total.
  const nextMilestone = Math.ceil((earned + 1) / 1000) * 1000

  function doRedeem() {
    if (applicable <= 0) {
      announce('Nothing to redeem on this bill.', 'error')
      return
    }
    const hospital = partners.find((h) => h.id === partnerId)
    spend(
      applicable,
      `bill-${Date.now().toString(36).toUpperCase()}`,
      hospital ? `Redeemed at ${hospital.name}` : 'Redeemed against a hospital bill',
    )
    setRedeemOpen(false)
    announce(`${formatCoins(applicable)} CareCoins applied. You pay ${formatINR(payable)}.`, 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">My wallet</h1>
          <p className="mt-1.5 text-[1rem] text-ink-500">
            CareCoins you have earned by helping, and where you can use them.
          </p>
        </div>
        <button
          onClick={() => { reset(); announce('Wallet reset to the demo state.', 'info') }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[0.88rem] font-semibold text-ink-500 hover:bg-mist-200"
        >
          <RotateCcw size={16} aria-hidden="true" /> Reset demo data
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          {/* ── Balance card: the one number this page exists for ── */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-7"
            style={{
              background: 'linear-gradient(160deg, var(--color-med-700), var(--color-med-950))',
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.22), var(--shadow-e4)',
            }}
          >
            {/* Light catch along the top-left edge — gives the card thickness. */}
            <div
              className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #fff, transparent 65%)' }}
              aria-hidden="true"
            />

            <div className="relative">
              <p className="flex items-center gap-2 text-[0.85rem] font-bold tracking-wider text-med-200 uppercase">
                <Coins size={18} aria-hidden="true" /> CareCoins balance
              </p>

              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-[3rem] leading-none font-extrabold tracking-tight sm:text-[3.6rem]">
                  {formatCoins(balance)}
                </span>
                <span className="text-[1rem] font-semibold text-med-200">coins</span>
              </p>
              <p className="mt-1.5 text-[0.95rem] text-med-100">
                Worth up to {formatINR(balance)} off hospital bills
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
                {[
                  { k: formatCoins(earned), v: 'earned' },
                  { k: formatCoins(redeemed), v: 'redeemed' },
                  { k: String(rescues), v: rescues === 1 ? 'verified rescue' : 'verified rescues' },
                ].map((s) => (
                  <div key={s.v}>
                    <p className="text-[1.25rem] leading-none font-extrabold">{s.k}</p>
                    <p className="mt-1 text-[0.8rem] text-med-200">{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setRedeemOpen(true)}
                  disabled={balance <= 0}
                >
                  Redeem on a bill
                </Button>
                <RouterButton
                  to="/hero"
                  size="lg"
                  className="flex-1 bg-white/15 shadow-none ring-1 ring-white/30 hover:bg-white/25"
                >
                  Earn more
                </RouterButton>
              </div>
            </div>
          </div>

          {/* ── Alerts that cost the user money if missed ── */}
          {expiring && (
            <Card className="mt-4 flex items-start gap-3 p-4 ring-1 ring-warn-100">
              <CircleAlert size={22} className="mt-0.5 shrink-0 text-warn-700" aria-hidden="true" />
              <p className="text-[0.93rem] leading-relaxed text-ink-700">
                <strong className="font-bold text-warn-700">
                  {formatCoins(expiring.coins)} coins expire on {formatDate(expiring.on)}.
                </strong>{' '}
                Coins last {COIN_LIFETIME_MONTHS} months from the day they are earned.
                Use them on any partner hospital bill before then.
              </p>
            </Card>
          )}

          {pending > 0 && (
            <Card className="mt-4 flex items-start gap-3 p-4">
              <Shield size={22} className="mt-0.5 shrink-0 text-med-600" aria-hidden="true" />
              <p className="text-[0.93rem] leading-relaxed text-ink-700">
                {pending} claim{pending === 1 ? ' is' : 's are'} waiting on hospital
                verification — worth {formatCoins(pending * COINS_PER_RESCUE)} coins if approved.{' '}
                <Link to="/hero" className="font-bold text-med-700 hover:underline">Track them</Link>.
              </p>
            </Card>
          )}

          {/* ── Progress toward the next milestone ── */}
          <Card className="mt-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
                <TrendingUp size={20} className="text-med-600" aria-hidden="true" />
                Lifetime earned
              </h2>
              <span className="text-[0.9rem] font-semibold text-ink-500">
                {formatCoins(earned)} / {formatCoins(nextMilestone)}
              </span>
            </div>
            <Progress
              className="mt-3"
              value={(earned / nextMilestone) * 100}
              label={`${formatCoins(earned)} of ${formatCoins(nextMilestone)} coins earned`}
            />
            <p className="mt-2 text-[0.88rem] text-ink-500">
              {formatCoins(nextMilestone - earned)} more coins to the next milestone.
              Each verified rescue is {COINS_PER_RESCUE}.
            </p>
          </Card>

          {/* ── Transaction ledger ── */}
          <SectionHeading className="mt-10" title="Transaction history" sub="Every credit and debit, with its source." />

          {wallet.ledger.length === 0 ? (
            <Card className="p-8 text-center text-ink-500">No transactions yet.</Card>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-mist-200">
                {wallet.ledger.map((e) => {
                  const credit = e.delta > 0
                  return (
                    <li key={e.id} className="flex items-center gap-3.5 p-4">
                      <span
                        className={cn(
                          'grid size-11 shrink-0 place-items-center rounded-xl',
                          credit ? 'bg-good-50 text-good-700' : 'bg-med-50 text-med-700',
                        )}
                      >
                        {credit
                          ? <ArrowDownLeft size={20} aria-hidden="true" />
                          : <ArrowUpRight size={20} aria-hidden="true" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">{e.reason}</p>
                        <p className="text-[0.85rem] text-ink-500">
                          {timeAgo(e.at)} · ref {e.source}
                          {e.expiresOn && ` · expires ${formatDate(e.expiresOn)}`}
                        </p>
                      </div>

                      <span
                        className={cn(
                          'shrink-0 font-mono text-[1.02rem] font-bold',
                          credit ? 'text-good-700' : 'text-ink-700',
                        )}
                      >
                        {credit ? '+' : '−'}{formatCoins(Math.abs(e.delta))}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* ── Rail: rules and partners ── */}
        <aside className="space-y-4">
          <Card raised className="p-5">
            <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
              <Info size={20} className="text-med-600" aria-hidden="true" />
              How CareCoins work
            </h2>
            <ul className="mt-3 space-y-2.5 text-[0.92rem] leading-relaxed text-ink-700">
              <li className="flex gap-2"><span className="text-med-600">•</span>1 coin = ₹1 off a hospital bill.</li>
              <li className="flex gap-2"><span className="text-med-600">•</span>{COINS_PER_RESCUE} coins per rescue the hospital confirms.</li>
              <li className="flex gap-2"><span className="text-med-600">•</span>Up to {REDEEM_CAP_PCT}% of any single bill can be paid in coins.</li>
              <li className="flex gap-2"><span className="text-med-600">•</span>Coins expire {COIN_LIFETIME_MONTHS} months after they are earned.</li>
              <li className="flex gap-2"><span className="text-med-600">•</span>They cannot be transferred, sold or withdrawn as cash.</li>
            </ul>
            <p className="mt-3 border-t border-mist-200 pt-3 text-[0.85rem] leading-relaxed text-ink-500">
              The {REDEEM_CAP_PCT}% cap is deliberate. It keeps the programme a
              thank-you rather than a cash-equivalent, which is what keeps it on
              the right side of medical referral rules.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
              <Building2 size={20} className="text-med-600" aria-hidden="true" />
              Partner hospitals ({partners.length})
            </h2>
            <p className="mt-1 text-[0.88rem] text-ink-500">
              Where coins can be redeemed today.
            </p>
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {partners.map((h) => (
                <li key={h.id} className="rounded-xl bg-mist-50 px-3.5 py-2.5 ring-1 ring-mist-200">
                  <p className="text-[0.92rem] font-semibold text-ink-900">{h.name}</p>
                  <p className="text-[0.82rem] text-ink-500">{h.area}, {h.city}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <Award size={24} className="text-warn-600" aria-hidden="true" />
            <h2 className="mt-2 text-[1.05rem] font-bold">Other ways to earn</h2>
            <ul className="mt-2 space-y-2 text-[0.9rem] text-ink-700">
              <li className="flex items-baseline justify-between gap-2">
                <span>Verified rescue</span>
                <span className="font-bold text-good-700">+{COINS_PER_RESCUE}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span>Complete a basic life support course</span>
                <span className="font-bold text-good-700">+100</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span>Verified blood donation</span>
                <span className="font-bold text-good-700">+250</span>
              </li>
            </ul>
            <Link
              to="/hero"
              data-tap
              className="mt-3 inline-flex items-center gap-1.5 font-bold text-med-700 hover:underline"
            >
              <HeartHandshake size={18} aria-hidden="true" /> Report a rescue
            </Link>
          </Card>
        </aside>
      </div>

      {/* ── Redemption calculator ── */}
      <Sheet
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        title="Redeem CareCoins"
        description="See exactly what comes off before you commit anything."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[0.9rem] font-semibold text-ink-700">
              Hospital bill amount
            </span>
            <input
              type="number"
              min={0}
              step={500}
              value={billAmount}
              onChange={(e) => setBillAmount(Math.max(0, Number(e.target.value)))}
              className="h-14 w-full rounded-xl bg-white px-4 text-[1.15rem] font-bold ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.9rem] font-semibold text-ink-700">
              Partner hospital
            </span>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="h-13 w-full rounded-xl bg-white px-4 text-[0.98rem] ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
            >
              <option value="">Select a hospital…</option>
              {partners.map((h) => (
                <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl bg-mist-50 p-4 ring-1 ring-mist-200">
            <dl className="space-y-2.5 text-[0.95rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Bill</dt>
                <dd className="font-semibold text-ink-900">{formatINR(billAmount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Your balance</dt>
                <dd className="font-semibold text-ink-900">{formatCoins(balance)} coins</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Cap ({REDEEM_CAP_PCT}% of bill)</dt>
                <dd className="font-semibold text-ink-900">
                  {formatINR(Math.floor((billAmount * REDEEM_CAP_PCT) / 100))}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-mist-300 pt-2.5">
                <dt className="font-bold text-good-700">Coins applied</dt>
                <dd className="font-bold text-good-700">−{formatINR(applicable)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[1.05rem] font-bold text-ink-900">You pay</dt>
                <dd className="text-[1.25rem] font-extrabold text-ink-900">{formatINR(payable)}</dd>
              </div>
            </dl>
          </div>

          {applicable < balance && balance > 0 && (
            <p className="text-[0.85rem] leading-relaxed text-ink-500">
              Only {formatCoins(applicable)} of your {formatCoins(balance)} coins can be
              used here — the rest stays in your wallet for the next bill.
            </p>
          )}

          <Button block size="xl" onClick={doRedeem} disabled={applicable <= 0}>
            Apply {formatCoins(applicable)} coins
          </Button>
          <p className="text-center text-[0.82rem] text-ink-400">
            In production this generates a one-time code the hospital billing desk enters.
          </p>
        </div>
      </Sheet>
    </div>
  )
}
