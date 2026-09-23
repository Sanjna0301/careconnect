/**
 * Adversarial tests for campaign rules. These deliberately probe the edges
 * where fraud, bad input or arithmetic mistakes would get through.
 */

import { describe, expect, test } from 'bun:test'
import {
  EMPTY_DRAFT, GOAL_HARD_CAP_MULTIPLE, MAX_GOAL, MIN_GOAL, MIN_STORY_LENGTH,
  canAcceptDonations, checkGoalAgainstEstimate, draftToCampaign, estimateFor,
  isDraftValid, suggestGoal, validateDraft, type CampaignDraft,
} from '@/lib/campaignDraft'
import { costFor, HOSPITALS } from '@/data/hospitals'
import { TREATMENT_BY_KEY } from '@/data/treatments'
import { CAMPAIGNS, daysLeft, fundedPercent, totalDisbursed } from '@/data/campaigns'

const STORY = 'x'.repeat(MIN_STORY_LENGTH + 10)

const validDraft = (over: Partial<CampaignDraft> = {}): CampaignDraft => ({
  ...EMPTY_DRAFT,
  patientName: 'Lakshmi Ammal',
  age: '61',
  city: 'Chandigarh',
  title: 'Help my mother get her heart valve replaced',
  condition: 'Severe mitral stenosis',
  treatmentKey: 'valve-replacement',
  hospitalId: 'h-chd-01',
  goal: String(suggestGoal('h-chd-01', 'valve-replacement')),
  durationDays: '60',
  story: STORY,
  documents: [
    { label: 'estimate.pdf', kind: 'estimate' },
    { label: 'aadhaar.pdf', kind: 'identity' },
  ],
  declaredTruthful: true,
  authorisedHospital: true,
  ...over,
})

describe('goal derivation', () => {
  test('the suggested goal sits above the hospital top estimate', () => {
    const estimate = estimateFor('h-chd-01', 'valve-replacement')!
    const goal = suggestGoal('h-chd-01', 'valve-replacement')!
    expect(goal).toBeGreaterThan(estimate.max)
    expect(goal).toBeLessThan(estimate.max * 1.3)
  })

  test('the suggestion tracks the hospital, not a flat national number', () => {
    const premium = suggestGoal('h-chd-01', 'bypass')
    const govt = suggestGoal('h-mum-02', 'polytrauma')
    expect(premium).not.toBe(govt)
  })

  test('no suggestion when the hospital does not offer the treatment', () => {
    // A dialysis centre does not do liver transplants.
    expect(suggestGoal('h-hyd-02', 'liver-transplant')).toBeNull()
    expect(estimateFor('h-hyd-02', 'liver-transplant')).toBeNull()
  })

  test('an unknown hospital or treatment yields null rather than throwing', () => {
    expect(suggestGoal('nope', 'nope')).toBeNull()
    expect(suggestGoal('', '')).toBeNull()
    expect(estimateFor('h-chd-01', 'not-a-treatment')).toBeNull()
  })

  test('the suggestion never exceeds the platform maximum', () => {
    for (const h of HOSPITALS) {
      for (const key of ['liver-transplant', 'kidney-transplant', 'bypass']) {
        const goal = suggestGoal(h.id, key)
        if (goal !== null) expect(goal).toBeLessThanOrEqual(MAX_GOAL)
      }
    }
  })
})

describe('goal sanity against the estimate — the fraud signal', () => {
  const estimate = estimateFor('h-chd-01', 'valve-replacement')!

  test('a goal in line with the estimate passes silently', () => {
    expect(checkGoalAgainstEstimate(estimate.max, 'h-chd-01', 'valve-replacement').level).toBe('ok')
  })

  test('a goal well above the estimate warns but does not block', () => {
    const check = checkGoalAgainstEstimate(estimate.max * 2, 'h-chd-01', 'valve-replacement')
    expect(check.level).toBe('warn')
    expect(isDraftValid(validDraft({ goal: String(Math.round(estimate.max * 2)) }))).toBe(true)
  })

  test('a goal beyond the hard cap is rejected', () => {
    const absurd = Math.round(estimate.max * (GOAL_HARD_CAP_MULTIPLE + 1))
    expect(checkGoalAgainstEstimate(absurd, 'h-chd-01', 'valve-replacement').level).toBe('block')
    expect(validateDraft(validDraft({ goal: String(absurd) })).goal).toBeTruthy()
  })

  test('the cap cannot be dodged by picking a hospital that does not treat it', () => {
    // No estimate means no anchor — so the hospital itself must be rejected.
    const errors = validateDraft(validDraft({
      hospitalId: 'h-hyd-02',
      treatmentKey: 'liver-transplant',
      goal: '5000000',
    }))
    expect(errors.hospitalId).toBeTruthy()
  })
})

describe('draft validation', () => {
  test('a complete draft is valid', () => {
    expect(validateDraft(validDraft())).toEqual({})
  })

  test.each([
    ['patientName', { patientName: 'A' }],
    ['age', { age: '' }],
    ['age', { age: '150' }],
    ['city', { city: '  ' }],
    ['title', { title: 'Short' }],
    ['condition', { condition: '' }],
    ['treatmentKey', { treatmentKey: '' }],
    ['hospitalId', { hospitalId: '' }],
    ['goal', { goal: '' }],
    ['goal', { goal: String(MIN_GOAL - 1) }],
    ['goal', { goal: String(MAX_GOAL + 1) }],
    ['durationDays', { durationDays: '5' }],
    ['durationDays', { durationDays: '365' }],
    ['story', { story: 'too short' }],
    ['declaredTruthful', { declaredTruthful: false }],
    ['authorisedHospital', { authorisedHospital: false }],
  ])('rejects a bad %s', (field, override) => {
    const errors = validateDraft(validDraft(override as Partial<CampaignDraft>))
    expect(errors[field as keyof CampaignDraft]).toBeTruthy()
  })

  test('a newborn (age 0) is accepted', () => {
    expect(validateDraft(validDraft({ age: '0' })).age).toBeUndefined()
  })

  test('non-numeric age and goal are rejected rather than coerced to NaN', () => {
    expect(validateDraft(validDraft({ age: 'abc' })).age).toBeTruthy()
    expect(validateDraft(validDraft({ goal: 'lots' })).goal).toBeTruthy()
  })

  test('a story of whitespace does not satisfy the length rule', () => {
    expect(validateDraft(validDraft({ story: ' '.repeat(500) })).story).toBeTruthy()
  })

  test('documents: an estimate alone is not enough', () => {
    const errors = validateDraft(validDraft({ documents: [{ label: 'e.pdf', kind: 'estimate' }] }))
    expect(errors.documents).toMatch(/identity/i)
  })

  test('documents: identity alone is not enough', () => {
    const errors = validateDraft(validDraft({ documents: [{ label: 'id.pdf', kind: 'identity' }] }))
    expect(errors.documents).toMatch(/estimate or a bill/i)
  })

  test('documents: a paid bill substitutes for an estimate', () => {
    const errors = validateDraft(validDraft({
      documents: [{ label: 'bill.pdf', kind: 'hospital-bill' }, { label: 'id.pdf', kind: 'identity' }],
    }))
    expect(errors.documents).toBeUndefined()
  })

  test('a diagnosis report alone satisfies neither requirement', () => {
    const errors = validateDraft(validDraft({ documents: [{ label: 'mri.pdf', kind: 'diagnosis' }] }))
    expect(errors.documents).toBeTruthy()
  })
})

describe('draft → campaign', () => {
  test('a new campaign starts unverified, empty, and cannot take donations', () => {
    const c = draftToCampaign(validDraft(), 'c-test')
    expect(c.status).toBe('unverified')
    expect(c.verifiedBy).toBeNull()
    expect(c.raised).toBe(0)
    expect(c.donors).toBe(0)
    expect(c.disbursements).toEqual([])
    expect(canAcceptDonations(c)).toBe(false)
  })

  test('urgency cannot be self-assigned', () => {
    expect(draftToCampaign(validDraft(), 'c-test').urgent).toBe(false)
  })

  test('documents arrive unverified regardless of what was uploaded', () => {
    const c = draftToCampaign(validDraft(), 'c-test')
    expect(c.documents).toHaveLength(2)
    for (const d of c.documents) {
      expect(d.verifiedOn).toBeNull()
      expect(d.verifiedBy).toBeNull()
    }
  })

  test('the deadline honours the chosen duration', () => {
    const c = draftToCampaign(validDraft({ durationDays: '30' }), 'c-test')
    expect(daysLeft(c)).toBeGreaterThanOrEqual(29)
    expect(daysLeft(c)).toBeLessThanOrEqual(30)
  })

  test('funds settle to the hospital, never to the creator', () => {
    const c = draftToCampaign(validDraft(), 'c-test')
    expect(c.settlesTo).toContain('Shivalik')
    expect(c.settlesTo).not.toContain('Lakshmi')
  })

  test('leading and trailing whitespace is stripped from user text', () => {
    const c = draftToCampaign(validDraft({
      patientName: '  Lakshmi Ammal  ',
      title: `  ${'Help my mother get treated today'}  `,
      story: `  ${STORY}  `,
    }), 'c-test')
    expect(c.patientName).toBe('Lakshmi Ammal')
    expect(c.title.startsWith(' ')).toBe(false)
    expect(c.story.endsWith(' ')).toBe(false)
  })
})

describe('campaign maths', () => {
  test('funded percent is bounded to 0–100 and never NaN', () => {
    for (const c of CAMPAIGNS) {
      const pct = fundedPercent(c)
      expect(Number.isFinite(pct)).toBe(true)
      expect(pct).toBeGreaterThanOrEqual(0)
      expect(pct).toBeLessThanOrEqual(100)
    }
  })

  test('a zero goal does not produce NaN', () => {
    const broken = { ...CAMPAIGNS[0], goal: 0, raised: 0 }
    expect(Number.isFinite(fundedPercent(broken))).toBe(true)
  })

  test('days left never goes negative for an expired campaign', () => {
    const expired = { ...CAMPAIGNS[0], deadline: '2020-01-01' }
    expect(daysLeft(expired)).toBe(0)
  })

  test('disbursed never exceeds raised in the seed data', () => {
    for (const c of CAMPAIGNS) {
      expect(totalDisbursed(c)).toBeLessThanOrEqual(c.raised)
    }
  })

  test('every seed campaign points at a hospital and treatment that exist', () => {
    for (const c of CAMPAIGNS) {
      const hospital = HOSPITALS.find((h) => h.id === c.hospitalId)
      expect(hospital).toBeTruthy()
      expect(TREATMENT_BY_KEY[c.treatmentKey]).toBeTruthy()
      // The quote should be in the same universe as the ask.
      const band = costFor(hospital!, TREATMENT_BY_KEY[c.treatmentKey])
      expect(band.max).toBeGreaterThan(0)
    }
  })

  test('only verified campaigns can accept donations', () => {
    for (const c of CAMPAIGNS) {
      expect(canAcceptDonations(c)).toBe(c.status === 'verified')
    }
  })
})

describe('regression — values that reach the DOM must never be NaN', () => {
  test('a malformed deadline reads as expired, not NaN', () => {
    expect(daysLeft({ ...CAMPAIGNS[0], deadline: 'not-a-date' })).toBe(0)
  })

  test('negative or missing amounts clamp to 0%', () => {
    expect(fundedPercent({ ...CAMPAIGNS[0], raised: -100 })).toBe(0)
    expect(fundedPercent({ ...CAMPAIGNS[0], goal: Number.NaN })).toBe(0)
    expect(fundedPercent({ ...CAMPAIGNS[0], raised: Number.NaN })).toBe(0)
  })

  test('over-funding still caps the bar at 100%', () => {
    expect(fundedPercent({ ...CAMPAIGNS[0], raised: 99_999_999, goal: 1000 })).toBe(100)
  })
})
