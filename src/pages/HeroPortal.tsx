import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleCheck, Clock, Coins, FileUp, Info, ScrollText, ShieldAlert, Trash2, TriangleAlert, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SelectField, TextArea, TextField } from '@/components/ui/Field'
import { useAnnounce } from '@/components/ui/Announcer'
import { useWallet } from '@/store/walletContext'
import { HOSPITALS } from '@/data/hospitals'
import {
  COINS_PER_RESCUE, MAX_CLAIMS_PER_MONTH, claimsThisMonth, type RescueClaim,
} from '@/store/wallet'
import { formatDate, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

const INCIDENT_TYPES = [
  { value: 'road-accident', label: 'Road accident' },
  { value: 'cardiac', label: 'Collapse / cardiac arrest' },
  { value: 'collapse', label: 'Fainting / unresponsive person' },
  { value: 'fire-burns', label: 'Fire or burns' },
  { value: 'drowning', label: 'Drowning' },
  { value: 'other', label: 'Something else' },
] as const

type Errors = Partial<Record<'incident' | 'hospitalId' | 'caseReference' | 'occurredOn' | 'conflict' | 'evidence', string>>

export function HeroPortal() {
  const { wallet, submitClaim, markVerified } = useWallet()
  const announce = useAnnounce()

  const [incident, setIncident] = useState('')
  const [incidentType, setIncidentType] = useState<RescueClaim['incidentType']>('road-accident')
  const [hospitalId, setHospitalId] = useState('')
  const [caseReference, setCaseReference] = useState('')
  const [occurredOn, setOccurredOn] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [conflict, setConflict] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const used = claimsThisMonth(wallet)
  const atLimit = used >= MAX_CLAIMS_PER_MONTH

  const sortedHospitals = useMemo(
    () => HOSPITALS.slice().sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
    [],
  )

  function validate(): Errors {
    const e: Errors = {}
    if (incident.trim().length < 40) e.incident = 'Please describe what happened in at least a couple of sentences.'
    if (!hospitalId) e.hospitalId = 'Choose the hospital you took them to.'
    if (caseReference.trim().length < 4) e.caseReference = 'Enter the case or registration number from the hospital.'
    if (!occurredOn) e.occurredOn = 'When did this happen?'
    else if (new Date(occurredOn) > new Date()) e.occurredOn = 'That date is in the future.'
    if (evidence.length === 0) e.evidence = 'Attach at least one photo or document as proof.'
    if (!conflict) e.conflict = 'You must confirm this before the claim can be reviewed.'
    return e
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      announce('Some details are missing. Check the highlighted fields.', 'error')
      return
    }

    submitClaim({
      incident: incident.trim(),
      incidentType,
      occurredOn: new Date(occurredOn).toISOString(),
      hospitalId,
      caseReference: caseReference.trim().toUpperCase(),
      evidence,
      conflictDeclared: conflict,
    })

    setIncident(''); setHospitalId(''); setCaseReference('')
    setOccurredOn(''); setEvidence([]); setConflict(false); setErrors({})
    announce('Claim sent to the hospital for verification.', 'success')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Be a CareConnect Hero</h1>
        <p className="mt-1.5 max-w-2xl text-[1rem] leading-relaxed text-ink-500">
          If you stopped for a stranger and got them to a hospital, tell us. Once
          the hospital confirms they arrived, {COINS_PER_RESCUE} CareCoins go into
          your wallet — usable against your own future treatment.
        </p>
      </header>

      {/* Legal protection first. Fear of police hassle is the actual reason
          people drive past an accident in India. */}
      <Card className="mb-6 flex items-start gap-3 p-4 ring-1 ring-good-100">
        <ShieldAlert size={22} className="mt-0.5 shrink-0 text-good-600" aria-hidden="true" />
        <div>
          <h2 className="font-bold text-ink-900">You are protected by law</h2>
          <p className="mt-1 text-[0.93rem] leading-relaxed text-ink-700">
            Under the Good Samaritan provisions of the Motor Vehicles Act, a
            bystander who helps an accident victim cannot be detained, forced to
            pay for treatment, or compelled to reveal their identity. Hospitals
            must begin treatment before asking for money or paperwork.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div>
          <Card className="p-5 sm:p-6">
            <h2 className="text-[1.15rem] font-bold">Report a rescue</h2>
            <p className="mt-1 text-[0.92rem] text-ink-500">
              This goes to the hospital's verification desk, not to a public feed.
            </p>

            {atLimit && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-warn-50 p-3.5 ring-1 ring-warn-100">
                <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warn-700" aria-hidden="true" />
                <p className="text-[0.9rem] text-warn-700">
                  You have submitted {used} claims this month, which is the limit.
                  The cap exists so the reward cannot be farmed. It resets next month.
                </p>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-5">
              <SelectField
                label="What kind of emergency was it?"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as RescueClaim['incidentType'])}
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </SelectField>

              <TextArea
                label="What happened?"
                required
                value={incident}
                error={errors.incident}
                onChange={(e) => setIncident(e.target.value)}
                placeholder="Where it happened, roughly what time, what condition the person was in, and what you did."
                hint="The hospital matches this against their own record of the arrival."
              />

              <TextField
                label="When did it happen?"
                type="datetime-local"
                required
                value={occurredOn}
                error={errors.occurredOn}
                max={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setOccurredOn(e.target.value)}
              />

              <SelectField
                label="Which hospital did you take them to?"
                required
                value={hospitalId}
                error={errors.hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
              >
                <option value="">Select a hospital…</option>
                {sortedHospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
                ))}
              </SelectField>

              <TextField
                label="Hospital case or registration number"
                required
                value={caseReference}
                error={errors.caseReference}
                onChange={(e) => setCaseReference(e.target.value)}
                placeholder="e.g. CAM-2026-09-4471"
                hint="Printed on the triage slip or OP registration receipt. Ask reception if you did not keep it — this is what the hospital checks against."
              />

              <EvidenceUpload
                files={evidence}
                error={errors.evidence}
                onChange={setEvidence}
                onNotice={announce}
              />

              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1',
                  errors.conflict ? 'bg-alert-50 ring-alert-200' : 'bg-mist-50 ring-mist-200',
                )}
              >
                <input
                  type="checkbox"
                  checked={conflict}
                  onChange={(e) => setConflict(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--color-med-600)]"
                />
                <span className="text-[0.92rem] leading-relaxed text-ink-700">
                  I confirm I am not employed by this hospital, do not work as an
                  agent or tout for it, and received no payment for bringing this
                  patient here.
                  {errors.conflict && (
                    <span className="mt-1 block font-semibold text-alert-700">{errors.conflict}</span>
                  )}
                </span>
              </label>

              <Button type="submit" block size="xl" disabled={atLimit}>
                Submit for hospital verification
              </Button>
              <p className="text-center text-[0.82rem] text-ink-400">
                {used} of {MAX_CLAIMS_PER_MONTH} claims used this month
              </p>
            </form>
          </Card>

          <SectionHeading className="mt-10" title="Your claims" sub="Every submission and where it stands." />

          {wallet.claims.length === 0 ? (
            <Card className="p-8 text-center text-ink-500">
              You have not reported a rescue yet.
            </Card>
          ) : (
            <ul className="space-y-4">
              {wallet.claims.map((c) => (
                <ClaimRow key={c.id} claim={c} onVerify={() => markVerified(c.id)} />
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <Card raised className="p-5">
            <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
              <ScrollText size={20} className="text-med-600" aria-hidden="true" />
              How verification works
            </h2>
            <ol className="mt-3 space-y-3">
              {[
                'You submit the case number and what happened.',
                'The hospital checks it against their ER arrival log.',
                'A staff member confirms or rejects, usually within 48 hours.',
                `On confirmation, ${COINS_PER_RESCUE} CareCoins are credited to your wallet.`,
              ].map((s, i) => (
                <li key={s} className="flex gap-3 text-[0.92rem] leading-relaxed text-ink-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-med-600 text-[0.75rem] font-bold text-white">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
              <Info size={20} className="text-ink-500" aria-hidden="true" />
              Why the rules are strict
            </h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-500">
              A reward for bringing patients to hospitals is exactly the kind of
              thing that gets gamed, and paid patient referral is separately
              restricted under medical ethics rules. Hospital-side verification,
              a monthly cap and the conflict declaration are what keep this a
              thank-you rather than a commission.
            </p>
            <Link
              to="/wallet"
              data-tap
              className="mt-3 inline-flex items-center gap-1.5 font-bold text-med-700 hover:underline"
            >
              <Coins size={18} aria-hidden="true" /> Go to my wallet
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function EvidenceUpload({
  files, error, onChange, onNotice,
}: {
  files: string[]
  error?: string
  onChange: (next: string[]) => void
  onNotice: (m: string, t?: 'info' | 'success' | 'error') => void
}) {
  const [dragging, setDragging] = useState(false)

  function accept(list: FileList | null) {
    if (!list) return
    const names: string[] = []
    for (const f of Array.from(list)) {
      if (f.size > 8 * 1024 * 1024) {
        onNotice(`${f.name} is over 8 MB and was skipped.`, 'error')
        continue
      }
      names.push(f.name)
    }
    if (names.length > 0) {
      onChange([...files, ...names].slice(0, 5))
      onNotice(`${names.length} file${names.length === 1 ? '' : 's'} attached.`, 'success')
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[0.9rem] font-semibold text-ink-700">
        Proof <span className="text-alert-600" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </span>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files) }}
        className={cn(
          'rounded-xl border-2 border-dashed p-5 text-center transition-colors',
          error ? 'border-alert-500 bg-alert-50'
            : dragging ? 'border-med-600 bg-med-50'
            : 'border-mist-300 bg-mist-50',
        )}
      >
        <FileUp size={26} className="mx-auto text-med-600" aria-hidden="true" />
        <p className="mt-2 text-[0.92rem] font-semibold text-ink-900">
          Triage slip, registration receipt, or a photo at the hospital
        </p>
        <p className="mt-1 text-[0.82rem] text-ink-500">
          Up to 5 files, 8 MB each. Do not upload photos of the injured person.
        </p>
        <label className="mt-3 inline-block">
          <span className="inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-white px-4 font-semibold text-med-700 ring-1 ring-mist-300 hover:ring-med-300">
            Choose files
          </span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => { accept(e.target.files); e.target.value = '' }}
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="mt-2.5 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f}-${i}`}
              className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-mist-200"
            >
              <CircleCheck size={18} className="shrink-0 text-good-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[0.9rem] text-ink-700">{f}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f}`}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-mist-100 hover:text-alert-700"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="mt-1.5 text-[0.85rem] font-medium text-alert-700">{error}</p>}
    </div>
  )
}

const STATUS_META = {
  submitted: { tone: 'neutral' as const, label: 'Submitted', icon: Clock },
  'hospital-review': { tone: 'warn' as const, label: 'With the hospital', icon: Clock },
  verified: { tone: 'good' as const, label: 'Verified', icon: CircleCheck },
  rejected: { tone: 'alert' as const, label: 'Rejected', icon: X },
}

function ClaimRow({ claim, onVerify }: { claim: RescueClaim; onVerify: () => void }) {
  const hospital = HOSPITALS.find((h) => h.id === claim.hospitalId)
  const meta = STATUS_META[claim.status]
  const Icon = meta.icon

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-ink-900">{hospital?.name ?? 'Unknown hospital'}</p>
            <p className="text-[0.88rem] text-ink-500">
              {formatDate(claim.occurredOn)} · Case {claim.caseReference}
            </p>
          </div>
          <Badge tone={meta.tone} icon={<Icon size={14} aria-hidden="true" />}>{meta.label}</Badge>
        </div>

        <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-700">{claim.incident}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.85rem] text-ink-500">
          <span>Submitted {timeAgo(claim.submittedAt)}</span>
          <span>{claim.evidence.length} file{claim.evidence.length === 1 ? '' : 's'} attached</span>
          {claim.status === 'verified' && (
            <span className="font-bold text-good-700">+{claim.coinsAwarded} CareCoins</span>
          )}
        </div>

        {claim.reviewerNote && (
          <p className="mt-3 rounded-xl bg-mist-50 p-3 text-[0.88rem] text-ink-700">
            <strong className="font-semibold">Hospital note:</strong> {claim.reviewerNote}
          </p>
        )}

        {/* Stands in for the hospital-side portal, which is a separate product. */}
        {claim.status === 'hospital-review' && (
          <div className="mt-3 rounded-xl border border-dashed border-mist-300 p-3">
            <p className="text-[0.82rem] text-ink-400">
              Demo control — in production only hospital staff can do this.
            </p>
            <Button size="md" variant="secondary" className="mt-2" onClick={onVerify}>
              Simulate hospital approval
            </Button>
          </div>
        )}
      </Card>
    </li>
  )
}
