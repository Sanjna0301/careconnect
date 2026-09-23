/**
 * Campaign creation — validation and goal derivation.
 *
 * Kept as pure functions so the rules can be tested without a browser, and
 * so the same rules can be lifted to the server unchanged. Client-side
 * validation here is a courtesy to the user; the server must re-run all of
 * it, because anything a browser checks, a browser can skip.
 *
 * ── The anti-fraud stance ───────────────────────────────────────────────
 * Medical crowdfunding fails when fabricated campaigns take money from real
 * patients. Three rules carry that weight:
 *   1. A new campaign is `unverified` and CANNOT receive donations until a
 *      hospital confirms the diagnosis and the estimate.
 *   2. The goal is anchored to the treating hospital's own cost band. Asking
 *      for wildly more than the treatment costs is the loudest fraud signal
 *      there is, so it is warned about and then hard-capped.
 *   3. A hospital estimate or bill, and an identity document, are mandatory.
 *      A story alone is never enough.
 */

import { HOSPITALS, costFor, offersTreatment, type Hospital } from '@/data/hospitals'
import { TREATMENT_BY_KEY, type Treatment } from '@/data/treatments'
import type { Campaign, CampaignDocument } from '@/data/campaigns'

/** Headroom over the hospital's top estimate: medicines, stay, complications. */
export const GOAL_BUFFER_PCT = 12
/** Above this multiple of the estimate we warn the user. */
export const GOAL_WARN_MULTIPLE = 1.5
/** Above this multiple we refuse to submit. */
export const GOAL_HARD_CAP_MULTIPLE = 3
export const MIN_GOAL = 5_000
export const MAX_GOAL = 5_000_000
export const MIN_STORY_LENGTH = 200
export const MIN_DURATION_DAYS = 15
export const MAX_DURATION_DAYS = 180

export type DraftDocument = {
  label: string
  kind: CampaignDocument['kind']
}

export type CampaignDraft = {
  patientName: string
  age: string
  city: string
  title: string
  condition: string
  treatmentKey: string
  hospitalId: string
  goal: string
  durationDays: string
  story: string
  documents: DraftDocument[]
  /** Declared truthful, and authorises the hospital to confirm the bill. */
  declaredTruthful: boolean
  authorisedHospital: boolean
}

export const EMPTY_DRAFT: CampaignDraft = {
  patientName: '',
  age: '',
  city: '',
  title: '',
  condition: '',
  treatmentKey: '',
  hospitalId: '',
  goal: '',
  durationDays: '60',
  story: '',
  documents: [],
  declaredTruthful: false,
  authorisedHospital: false,
}

export type DraftErrors = Partial<Record<keyof CampaignDraft, string>>

/** The hospital's own quoted band for this treatment, if both are chosen. */
export function estimateFor(
  hospitalId: string,
  treatmentKey: string,
): { hospital: Hospital; treatment: Treatment; min: number; max: number } | null {
  const hospital = HOSPITALS.find((h) => h.id === hospitalId)
  const treatment = TREATMENT_BY_KEY[treatmentKey]
  if (!hospital || !treatment || !offersTreatment(hospital, treatment)) return null
  const { min, max } = costFor(hospital, treatment)
  return { hospital, treatment, min, max }
}

/** Suggested goal: the top of the band plus headroom, rounded to ₹1,000. */
export function suggestGoal(hospitalId: string, treatmentKey: string): number | null {
  const estimate = estimateFor(hospitalId, treatmentKey)
  if (!estimate) return null
  const withBuffer = estimate.max * (1 + GOAL_BUFFER_PCT / 100)
  return Math.min(MAX_GOAL, Math.round(withBuffer / 1000) * 1000)
}

export type GoalCheck =
  | { level: 'ok'; message: null }
  | { level: 'warn' | 'block'; message: string }

/**
 * Compares the requested goal against the hospital's own estimate. Returns
 * `block` only above the hard cap — a genuine case can legitimately exceed
 * one estimate, so we explain rather than forbid at the warning level.
 */
export function checkGoalAgainstEstimate(goal: number, hospitalId: string, treatmentKey: string): GoalCheck {
  const estimate = estimateFor(hospitalId, treatmentKey)
  if (!estimate || goal <= 0) return { level: 'ok', message: null }

  const ratio = goal / estimate.max
  if (ratio > GOAL_HARD_CAP_MULTIPLE) {
    return {
      level: 'block',
      message:
        `That is more than ${GOAL_HARD_CAP_MULTIPLE}× this hospital's own top estimate. ` +
        `Lower the amount, or pick the hospital that gave you the higher quote — ` +
        `verification compares the two, and a mismatch stops the campaign.`,
    }
  }
  if (ratio > GOAL_WARN_MULTIPLE) {
    return {
      level: 'warn',
      message:
        `This is well above the estimate for this treatment here. That is fine if ` +
        `you expect a long stay or complications — explain it in your story, ` +
        `because donors and our verification team will both ask.`,
    }
  }
  return { level: 'ok', message: null }
}

export function validateDraft(draft: CampaignDraft): DraftErrors {
  const e: DraftErrors = {}

  if (draft.patientName.trim().length < 2) e.patientName = "Enter the patient's name."

  const age = Number(draft.age)
  if (draft.age.trim() === '' || !Number.isFinite(age)) e.age = 'Enter an age. Use 0 for a newborn.'
  else if (age < 0 || age > 120) e.age = 'Enter an age between 0 and 120.'

  if (!draft.city.trim()) e.city = 'Enter the city where treatment will happen.'

  const title = draft.title.trim()
  if (title.length < 10) e.title = 'Write a headline of at least 10 characters.'
  else if (title.length > 120) e.title = 'Keep the headline under 120 characters.'

  if (draft.condition.trim().length < 3) e.condition = 'Enter the diagnosis or condition.'

  if (!draft.treatmentKey) e.treatmentKey = 'Choose the treatment needed.'
  if (!draft.hospitalId) e.hospitalId = 'Choose the hospital that will treat this.'

  // A hospital that does not offer the treatment cannot verify the estimate.
  if (draft.hospitalId && draft.treatmentKey && !estimateFor(draft.hospitalId, draft.treatmentKey)) {
    e.hospitalId = 'This hospital does not treat that condition. Pick another, or change the treatment.'
  }

  const goal = Number(draft.goal)
  if (!draft.goal.trim() || !Number.isFinite(goal)) e.goal = 'Enter how much you need.'
  else if (goal < MIN_GOAL) e.goal = `The minimum goal is ₹${MIN_GOAL.toLocaleString('en-IN')}.`
  else if (goal > MAX_GOAL) e.goal = `The maximum goal is ₹${MAX_GOAL.toLocaleString('en-IN')}.`
  else {
    const check = checkGoalAgainstEstimate(goal, draft.hospitalId, draft.treatmentKey)
    if (check.level === 'block') e.goal = check.message
  }

  const days = Number(draft.durationDays)
  if (!Number.isFinite(days) || days < MIN_DURATION_DAYS || days > MAX_DURATION_DAYS) {
    e.durationDays = `Choose between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days.`
  }

  const story = draft.story.trim()
  if (story.length < MIN_STORY_LENGTH) {
    e.story = `Tell the full story — at least ${MIN_STORY_LENGTH} characters. You have written ${story.length}.`
  }

  const kinds = new Set(draft.documents.map((d) => d.kind))
  if (!kinds.has('estimate') && !kinds.has('hospital-bill')) {
    e.documents = 'Attach the hospital estimate or a bill. This is what gets verified.'
  } else if (!kinds.has('identity')) {
    e.documents = "Attach an identity document for the patient or guardian."
  }

  if (!draft.declaredTruthful) e.declaredTruthful = 'You must confirm this before submitting.'
  if (!draft.authorisedHospital) e.authorisedHospital = 'Verification cannot happen without this permission.'

  return e
}

export const isDraftValid = (draft: CampaignDraft) => Object.keys(validateDraft(draft)).length === 0

/** Campaigns a user has just created are never urgent by default — urgency
 *  is a claim, and claims here are verified, not self-assigned. */
export function draftToCampaign(draft: CampaignDraft, id: string): Campaign {
  const now = new Date()
  const deadline = new Date(now.getTime() + Number(draft.durationDays) * 86_400_000)
  const hospital = HOSPITALS.find((h) => h.id === draft.hospitalId)

  return {
    id,
    patientName: draft.patientName.trim(),
    age: Number(draft.age),
    city: draft.city.trim(),
    title: draft.title.trim(),
    condition: draft.condition.trim(),
    treatmentKey: draft.treatmentKey,
    hospitalId: draft.hospitalId,
    goal: Number(draft.goal),
    raised: 0,
    donors: 0,
    deadline: deadline.toISOString(),
    createdOn: now.toISOString(),
    status: 'unverified',
    verifiedBy: null,
    story: draft.story.trim(),
    documents: draft.documents.map((d) => ({
      label: d.label,
      kind: d.kind,
      verifiedOn: null,
      verifiedBy: null,
    })),
    disbursements: [],
    settlesTo: hospital
      ? `${hospital.name} — escrow account (assigned on verification)`
      : 'Hospital escrow account (assigned on verification)',
    urgent: false,
  }
}

/** Donations are blocked until a hospital has confirmed the paperwork. */
export const canAcceptDonations = (campaign: Campaign) => campaign.status === 'verified'
