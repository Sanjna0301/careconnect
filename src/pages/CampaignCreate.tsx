import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Building2, CircleCheck, FileUp, Info, Landmark,
  ShieldCheck, Trash2, TriangleAlert, Wallet,
} from 'lucide-react'
import { Button, RouterButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SelectField, TextArea, TextField } from '@/components/ui/Field'
import { useAnnounce } from '@/components/ui/Announcer'
import { useCampaigns } from '@/store/campaignsContext'
import { HOSPITALS } from '@/data/hospitals'
import { SPECIALTY_LABEL, TREATMENTS, TREATMENT_BY_KEY } from '@/data/treatments'
import {
  EMPTY_DRAFT, MAX_DURATION_DAYS, MIN_DURATION_DAYS, MIN_STORY_LENGTH,
  checkGoalAgainstEstimate, estimateFor, suggestGoal, validateDraft,
  type CampaignDraft, type DraftDocument, type DraftErrors,
} from '@/lib/campaignDraft'
import { formatCostBand, formatINR } from '@/lib/format'
import { cn } from '@/lib/cn'

const DOCUMENT_KINDS: Array<{ value: DraftDocument['kind']; label: string; help: string }> = [
  { value: 'estimate', label: 'Hospital cost estimate', help: 'The quote the hospital gave you. This is the single most important document.' },
  { value: 'hospital-bill', label: 'Hospital bill', help: 'Bills already paid or outstanding for this treatment.' },
  { value: 'diagnosis', label: 'Diagnosis / medical report', help: 'Discharge summary, scan report, or the doctor’s assessment.' },
  { value: 'identity', label: 'Identity document', help: 'Aadhaar or equivalent for the patient or guardian. Redacted before publication.' },
]

const STEPS = ['Treatment', 'Your story', 'Documents', 'Review'] as const
type Step = 0 | 1 | 2 | 3

/** Which draft fields each step is responsible for, so errors surface on the
 *  step that owns them rather than all at the end. */
const STEP_FIELDS: Record<Step, Array<keyof CampaignDraft>> = {
  0: ['patientName', 'age', 'city', 'condition', 'treatmentKey', 'hospitalId', 'goal', 'durationDays'],
  1: ['title', 'story'],
  2: ['documents'],
  3: ['declaredTruthful', 'authorisedHospital'],
}

export function CampaignCreate() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const announce = useAnnounce()
  const { create } = useCampaigns()

  const [step, setStep] = useState<Step>(0)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Prefill from the hospital search: ?hospital=…&t=…&goal=…
  const [draft, setDraft] = useState<CampaignDraft>(() => {
    const hospitalId = params.get('hospital') ?? ''
    const treatmentKey = params.get('t') ?? ''
    const treatment = TREATMENT_BY_KEY[treatmentKey]
    const hospital = HOSPITALS.find((h) => h.id === hospitalId)
    const suggested = hospitalId && treatmentKey ? suggestGoal(hospitalId, treatmentKey) : null

    return {
      ...EMPTY_DRAFT,
      hospitalId,
      treatmentKey,
      city: hospital?.city ?? '',
      condition: treatment?.name ?? '',
      goal: suggested ? String(suggested) : '',
    }
  })

  const arrivedFromSearch = Boolean(params.get('hospital') && params.get('t'))

  const estimate = useMemo(
    () => estimateFor(draft.hospitalId, draft.treatmentKey),
    [draft.hospitalId, draft.treatmentKey],
  )

  const goalCheck = useMemo(
    () => checkGoalAgainstEstimate(Number(draft.goal), draft.hospitalId, draft.treatmentKey),
    [draft.goal, draft.hospitalId, draft.treatmentKey],
  )

  // Moving between steps must move focus, or a screen reader stays put.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function set<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  /** Re-derive the suggested goal when the hospital or treatment changes,
   *  unless the user has already typed their own number. */
  function setTreatmentOrHospital(key: 'treatmentKey' | 'hospitalId', value: string) {
    setDraft((d) => {
      const next = { ...d, [key]: value }
      const suggested = suggestGoal(next.hospitalId, next.treatmentKey)
      const untouched = !d.goal || d.goal === String(suggestGoal(d.hospitalId, d.treatmentKey) ?? '')
      if (suggested && untouched) next.goal = String(suggested)
      if (key === 'hospitalId') {
        const hospital = HOSPITALS.find((h) => h.id === value)
        if (hospital && !d.city) next.city = hospital.city
      }
      if (key === 'treatmentKey' && !d.condition) {
        next.condition = TREATMENT_BY_KEY[value]?.name ?? ''
      }
      return next
    })
    setErrors((e) => ({ ...e, [key]: undefined, goal: undefined }))
  }

  function goNext() {
    const all = validateDraft(draft)
    const mine = STEP_FIELDS[step]
    const stepErrors: DraftErrors = {}
    for (const field of mine) if (all[field]) stepErrors[field] = all[field]

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      announce('Some details need fixing before you continue.', 'error')
      return
    }
    setErrors({})
    setStep((s) => Math.min(3, s + 1) as Step)
  }

  function goBack() {
    setErrors({})
    setStep((s) => Math.max(0, s - 1) as Step)
  }

  function submit() {
    const all = validateDraft(draft)
    if (Object.keys(all).length > 0) {
      setErrors(all)
      // Jump to the earliest step that still has a problem.
      const firstBad = ([0, 1, 2, 3] as Step[]).find((s) =>
        STEP_FIELDS[s].some((f) => all[f]),
      )
      if (firstBad !== undefined) setStep(firstBad)
      announce('Some details are still missing.', 'error')
      return
    }

    setSubmitting(true)
    const campaign = create(draft)
    announce('Campaign created. It is now waiting on hospital verification.', 'success')
    navigate(`/fundraisers/${campaign.id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 font-semibold text-med-700 hover:underline"
      >
        <ArrowLeft size={18} aria-hidden="true" /> Back
      </button>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-extrabold outline-none sm:text-3xl"
      >
        Ask for help with treatment costs
      </h1>
      <p className="mt-1.5 text-[1rem] leading-relaxed text-ink-500">
        Four short steps. Nothing is public until a hospital confirms your
        estimate — that check is what makes strangers willing to give.
      </p>

      {arrivedFromSearch && estimate && (
        <Card className="mt-5 flex items-start gap-3 p-4 ring-1 ring-med-200">
          <Wallet size={22} className="mt-0.5 shrink-0 text-med-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-bold text-ink-900">
              Carried over from your search
            </p>
            <p className="mt-1 text-[0.93rem] leading-relaxed text-ink-700">
              {estimate.treatment.name} at {estimate.hospital.name}, estimated at{' '}
              <strong className="font-semibold">
                {formatCostBand(estimate.min, estimate.max)}
              </strong>
              . We have set a starting goal from that — change it if your quote differs.
            </p>
          </div>
        </Card>
      )}

      {/* ── Step indicator ── */}
      <ol className="mt-6 flex items-center gap-1.5" aria-label="Progress">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo'
          return (
            <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  'h-1.5 rounded-full',
                  state === 'todo' ? 'bg-mist-300' : 'bg-med-600',
                )}
              />
              <span
                className={cn(
                  'truncate text-[0.78rem] font-bold',
                  state === 'current' ? 'text-med-700' : 'text-ink-400',
                )}
              >
                {i + 1}. {label}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of 4: {STEPS[step]}
      </p>

      <Card className="mt-4 p-5 sm:p-6">
        {step === 0 && (
          <StepTreatment
            draft={draft}
            errors={errors}
            set={set}
            setLinked={setTreatmentOrHospital}
            estimate={estimate}
            goalCheck={goalCheck}
          />
        )}
        {step === 1 && <StepStory draft={draft} errors={errors} set={set} />}
        {step === 2 && <StepDocuments draft={draft} errors={errors} set={set} onNotice={announce} />}
        {step === 3 && <StepReview draft={draft} errors={errors} set={set} estimate={estimate} />}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-mist-200 pt-5 sm:flex-row">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={goBack} className="sm:w-auto">
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button size="lg" onClick={goNext} trailing={<ArrowRight size={20} aria-hidden="true" />}>
              Continue
            </Button>
          ) : (
            <Button size="xl" onClick={submit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create campaign'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 1 — treatment, hospital, money                                 */
/* ------------------------------------------------------------------ */

function StepTreatment({
  draft, errors, set, setLinked, estimate, goalCheck,
}: {
  draft: CampaignDraft
  errors: DraftErrors
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
  setLinked: (k: 'treatmentKey' | 'hospitalId', v: string) => void
  estimate: ReturnType<typeof estimateFor>
  goalCheck: ReturnType<typeof checkGoalAgainstEstimate>
}) {
  const hospitals = useMemo(
    () => HOSPITALS.slice().sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
    [],
  )
  const treatments = useMemo(
    () => TREATMENTS.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )
  const suggested = suggestGoal(draft.hospitalId, draft.treatmentKey)

  return (
    <div className="space-y-5">
      <h2 className="text-[1.15rem] font-bold">Who needs treatment, and for what?</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Patient's full name"
          required
          value={draft.patientName}
          error={errors.patientName}
          onChange={(e) => set('patientName', e.target.value)}
          placeholder="As printed on hospital records"
        />
        <TextField
          label="Age"
          type="number"
          min={0}
          max={120}
          required
          value={draft.age}
          error={errors.age}
          onChange={(e) => set('age', e.target.value)}
          hint="Use 0 for a newborn."
        />
      </div>

      <SelectField
        label="Treatment needed"
        required
        value={draft.treatmentKey}
        error={errors.treatmentKey}
        onChange={(e) => setLinked('treatmentKey', e.target.value)}
      >
        <option value="">Select a treatment…</option>
        {treatments.map((t) => (
          <option key={t.key} value={t.key}>
            {t.name} — {SPECIALTY_LABEL[t.specialty]}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Treating hospital"
        required
        value={draft.hospitalId}
        error={errors.hospitalId}
        onChange={(e) => setLinked('hospitalId', e.target.value)}
        hint="Funds settle into this hospital's account, never to you."
      >
        <option value="">Select a hospital…</option>
        {hospitals.map((h) => (
          <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
        ))}
      </SelectField>

      <TextField
        label="Diagnosis / condition"
        required
        value={draft.condition}
        error={errors.condition}
        onChange={(e) => set('condition', e.target.value)}
        placeholder="e.g. Acute Lymphoblastic Leukaemia"
      />

      <TextField
        label="City where treatment will happen"
        required
        value={draft.city}
        error={errors.city}
        onChange={(e) => set('city', e.target.value)}
      />

      {estimate && (
        <div className="rounded-xl bg-med-50 p-4 ring-1 ring-med-200">
          <p className="flex items-center gap-2 text-[0.85rem] font-bold tracking-wide text-med-800 uppercase">
            <Building2 size={16} aria-hidden="true" /> This hospital's estimate
          </p>
          <p className="mt-1.5 text-[1.3rem] font-extrabold text-med-800">
            {formatCostBand(estimate.min, estimate.max)}
          </p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-700">
            Verification compares your goal against this band. Asking for far
            more than the treatment costs is the fastest way to have a campaign
            rejected.
          </p>
        </div>
      )}

      <div>
        <TextField
          label="How much do you need?"
          type="number"
          min={0}
          step={1000}
          required
          value={draft.goal}
          error={errors.goal}
          onChange={(e) => set('goal', e.target.value)}
          hint={
            suggested
              ? `Suggested: ${formatINR(suggested)} — the top of the estimate plus headroom for medicines and a longer stay.`
              : 'Pick a treatment and hospital to see a suggested amount.'
          }
        />
        {goalCheck.level === 'warn' && !errors.goal && (
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-warn-50 p-3 text-[0.88rem] leading-relaxed text-warn-700 ring-1 ring-warn-100">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            {goalCheck.message}
          </p>
        )}
      </div>

      <SelectField
        label="How long should the campaign run?"
        value={draft.durationDays}
        error={errors.durationDays}
        onChange={(e) => set('durationDays', e.target.value)}
        hint={`Between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days.`}
      >
        {[15, 30, 45, 60, 90, 120, 180].map((d) => (
          <option key={d} value={String(d)}>{d} days</option>
        ))}
      </SelectField>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 2 — the story                                                  */
/* ------------------------------------------------------------------ */

function StepStory({
  draft, errors, set,
}: {
  draft: CampaignDraft
  errors: DraftErrors
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
}) {
  const length = draft.story.trim().length
  const remaining = Math.max(0, MIN_STORY_LENGTH - length)

  return (
    <div className="space-y-5">
      <h2 className="text-[1.15rem] font-bold">Tell people what happened</h2>
      <p className="-mt-3 text-[0.93rem] leading-relaxed text-ink-500">
        Donors give to people, not to conditions. Write it the way you would
        explain it to a neighbour.
      </p>

      <TextField
        label="Headline"
        required
        value={draft.title}
        error={errors.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="e.g. Riya needs a bone marrow transplant to beat leukaemia"
        hint={`${draft.title.trim().length}/120 characters.`}
      />

      <div>
        <TextArea
          label="Your story"
          required
          value={draft.story}
          error={errors.story}
          onChange={(e) => set('story', e.target.value)}
          className="min-h-56"
          placeholder="What happened, when it started, what treatment the doctors have advised, what you have already spent and tried, and what happens if the treatment does not go ahead."
        />
        <p
          className={cn(
            'mt-1.5 text-[0.85rem]',
            remaining > 0 ? 'text-ink-500' : 'font-semibold text-good-700',
          )}
          aria-live="polite"
        >
          {remaining > 0
            ? `${length} characters — ${remaining} more needed.`
            : `${length} characters. That is enough to publish.`}
        </p>
      </div>

      <div className="rounded-xl bg-mist-50 p-4 ring-1 ring-mist-200">
        <p className="flex items-center gap-2 font-bold text-ink-900">
          <Info size={18} className="text-med-600" aria-hidden="true" /> What donors look for
        </p>
        <ul className="mt-2 space-y-1.5 text-[0.9rem] leading-relaxed text-ink-700">
          <li>· What the doctors have actually said, in their words where you can.</li>
          <li>· What the family has already done — sold, borrowed, raised.</li>
          <li>· Why the timing matters: what changes if this is delayed.</li>
          <li>· Do not include phone numbers or bank details. Money goes to the hospital.</li>
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 3 — documents                                                  */
/* ------------------------------------------------------------------ */

function StepDocuments({
  draft, errors, set, onNotice,
}: {
  draft: CampaignDraft
  errors: DraftErrors
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
  onNotice: (m: string, t?: 'info' | 'success' | 'error') => void
}) {
  const [kind, setKind] = useState<DraftDocument['kind']>('estimate')
  const [dragging, setDragging] = useState(false)

  function accept(list: FileList | null) {
    if (!list || list.length === 0) return
    const added: DraftDocument[] = []
    for (const file of Array.from(list)) {
      if (file.size > 10 * 1024 * 1024) {
        onNotice(`${file.name} is over 10 MB and was skipped.`, 'error')
        continue
      }
      added.push({ label: file.name, kind })
    }
    if (added.length > 0) {
      set('documents', [...draft.documents, ...added].slice(0, 10))
      onNotice(`${added.length} document${added.length === 1 ? '' : 's'} attached.`, 'success')
    }
  }

  const present = new Set(draft.documents.map((d) => d.kind))

  return (
    <div className="space-y-5">
      <h2 className="text-[1.15rem] font-bold">Attach the paperwork</h2>
      <p className="-mt-3 text-[0.93rem] leading-relaxed text-ink-500">
        This is what gets checked with the hospital. Without it, a campaign
        cannot be verified and cannot receive money.
      </p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {DOCUMENT_KINDS.map((k) => {
          const required = k.value === 'identity' || k.value === 'estimate'
          const have = present.has(k.value)
          return (
            <li
              key={k.value}
              className={cn(
                'rounded-xl p-3.5 ring-1',
                have ? 'bg-good-50 ring-good-100' : 'bg-mist-50 ring-mist-200',
              )}
            >
              <p className="flex items-center gap-2 text-[0.92rem] font-bold text-ink-900">
                {have && <CircleCheck size={16} className="shrink-0 text-good-600" aria-hidden="true" />}
                {k.label}
                {required && !have && (
                  <span className="text-[0.72rem] font-bold text-alert-600">REQUIRED</span>
                )}
              </p>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-500">{k.help}</p>
            </li>
          )
        })}
      </ul>

      <SelectField
        label="What are you attaching next?"
        value={kind}
        onChange={(e) => setKind(e.target.value as DraftDocument['kind'])}
      >
        {DOCUMENT_KINDS.map((k) => (
          <option key={k.value} value={k.value}>{k.label}</option>
        ))}
      </SelectField>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files) }}
        className={cn(
          'rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          errors.documents ? 'border-alert-500 bg-alert-50'
            : dragging ? 'border-med-600 bg-med-50'
            : 'border-mist-300 bg-mist-50',
        )}
      >
        <FileUp size={28} className="mx-auto text-med-600" aria-hidden="true" />
        <p className="mt-2 font-semibold text-ink-900">
          Drop files here, or choose them
        </p>
        <p className="mt-1 text-[0.82rem] text-ink-500">
          PDF or photos, up to 10 MB each, 10 files maximum.
        </p>
        <label className="mt-3 inline-block">
          <span className="inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-white px-4 font-semibold text-med-700 ring-1 ring-mist-300 hover:ring-med-300">
            Choose files
          </span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            aria-label="Attach documents"
            className="sr-only"
            onChange={(e) => { accept(e.target.files); e.target.value = '' }}
          />
        </label>
      </div>

      {errors.documents && (
        <p role="alert" className="text-[0.88rem] font-medium text-alert-700">{errors.documents}</p>
      )}

      {draft.documents.length > 0 && (
        <ul className="space-y-2">
          {draft.documents.map((d, i) => (
            <li
              key={`${d.label}-${i}`}
              className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-mist-200"
            >
              <Badge tone="blue">
                {DOCUMENT_KINDS.find((k) => k.value === d.kind)?.label ?? d.kind}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-[0.9rem] text-ink-700">{d.label}</span>
              <button
                type="button"
                onClick={() => set('documents', draft.documents.filter((_, j) => j !== i))}
                aria-label={`Remove ${d.label}`}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-mist-100 hover:text-alert-700"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-xl bg-mist-100 p-3.5 text-[0.85rem] leading-relaxed text-ink-700">
        Documents are checked with the hospital and then redacted. Donors see
        that a bill was verified and by whom — never the bill itself, and never
        patient identifiers.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 4 — review and declarations                                    */
/* ------------------------------------------------------------------ */

function StepReview({
  draft, errors, set, estimate,
}: {
  draft: CampaignDraft
  errors: DraftErrors
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
  estimate: ReturnType<typeof estimateFor>
}) {
  const rows = [
    ['Patient', `${draft.patientName || '—'}${draft.age !== '' ? `, ${draft.age === '0' ? 'newborn' : `${draft.age} years`}` : ''}`],
    ['Condition', draft.condition || '—'],
    ['Treatment', TREATMENT_BY_KEY[draft.treatmentKey]?.name ?? '—'],
    ['Hospital', estimate?.hospital.name ?? '—'],
    ['City', draft.city || '—'],
    ['Goal', draft.goal ? formatINR(Number(draft.goal)) : '—'],
    ['Runs for', `${draft.durationDays} days`],
    ['Documents', `${draft.documents.length} attached`],
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-[1.15rem] font-bold">Check and confirm</h2>

      <dl className="divide-y divide-mist-200 overflow-hidden rounded-xl ring-1 ring-mist-200">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3">
            <dt className="text-[0.88rem] text-ink-500">{k}</dt>
            <dd className="text-right font-semibold text-ink-900">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl bg-med-50 p-4 ring-1 ring-med-200">
        <p className="flex items-center gap-2 font-bold text-med-800">
          <Landmark size={18} aria-hidden="true" /> What happens after you submit
        </p>
        <ol className="mt-2 space-y-1.5 text-[0.9rem] leading-relaxed text-ink-700">
          <li>1. Your campaign is created with an <strong>unverified</strong> badge.</li>
          <li>2. We send the estimate to the hospital's billing office to confirm.</li>
          <li>3. Once confirmed, the campaign goes public and can receive donations.</li>
          <li>4. Money settles to the hospital against invoices — never to you.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <Declaration
          checked={draft.declaredTruthful}
          error={errors.declaredTruthful}
          onChange={(v) => set('declaredTruthful', v)}
        >
          Everything I have written is true, and the documents I have attached are
          genuine and relate to this patient. I understand that a false campaign
          is fraud and will be reported.
        </Declaration>

        <Declaration
          checked={draft.authorisedHospital}
          error={errors.authorisedHospital}
          onChange={(v) => set('authorisedHospital', v)}
        >
          I authorise CareConnect to confirm this diagnosis, estimate and billing
          information directly with {estimate?.hospital.name ?? 'the treating hospital'},
          and to publish that a verification took place.
        </Declaration>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-warn-50 p-4 ring-1 ring-warn-100">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-warn-700" aria-hidden="true" />
        <p className="text-[0.88rem] leading-relaxed text-warn-700">
          Donations stay closed until verification completes. This protects you as
          much as donors — a campaign that takes money before it is checked is the
          one that gets accused of fraud.
        </p>
      </div>
    </div>
  )
}

function Declaration({
  checked, error, onChange, children,
}: {
  checked: boolean
  error?: string
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1',
        error ? 'bg-alert-50 ring-alert-200' : 'bg-mist-50 ring-mist-200',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-[var(--color-med-600)]"
      />
      <span className="text-[0.9rem] leading-relaxed text-ink-700">
        {children}
        {error && <span className="mt-1 block font-semibold text-alert-700">{error}</span>}
      </span>
    </label>
  )
}

/** Entry point shown on the fundraisers index. */
export function StartCampaignCta() {
  return (
    <RouterButton to="/fundraisers/start" size="lg" variant="primary">
      Start a campaign
    </RouterButton>
  )
}
