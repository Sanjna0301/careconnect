/**
 * CareCoins wallet + Good Samaritan ("CareConnect Hero") ledger.
 *
 * ── Economics, stated explicitly so they can be argued with ──────────────
 *  · 1 CareCoin = ₹1 of discount. Coins are NOT money: non-transferable,
 *    non-refundable, non-withdrawable.
 *  · A verified rescue credits 500 coins.
 *  · Redemption is capped at REDEEM_CAP_PCT of any single bill, so the
 *    programme's liability is bounded and coins can never create a negative
 *    bill or a cash-out path.
 *  · Coins expire COIN_LIFETIME_MONTHS after they are earned.
 *
 * ── Integrity controls ───────────────────────────────────────────────────
 * Paying people to bring patients to hospitals is an incentive to game, and
 * in India paid patient referral also runs into NMC ethics rules and state
 * anti-touting provisions. The controls below are load-bearing, not polish:
 *  · Coins credit ONLY after a hospital staff member confirms the arrival
 *    against a case reference. Self-reporting alone never pays out.
 *  · MAX_CLAIMS_PER_MONTH caps a single helper's claims.
 *  · Helpers employed by, or commercially linked to, the receiving hospital
 *    are ineligible — declared at claim time and checked at verification.
 *  · Every credit and debit is an immutable ledger row with its source.
 * Treat these as product requirements for the real backend, not UI details.
 */

import { readJSON, writeJSON } from '@/lib/storage'

export const COINS_PER_RESCUE = 500
export const REDEEM_CAP_PCT = 20
export const COIN_LIFETIME_MONTHS = 24
export const MAX_CLAIMS_PER_MONTH = 4

export type ClaimStatus = 'submitted' | 'hospital-review' | 'verified' | 'rejected'

export type RescueClaim = {
  id: string
  /** Free-text: what happened, in the helper's words. */
  incident: string
  incidentType: 'road-accident' | 'cardiac' | 'collapse' | 'fire-burns' | 'drowning' | 'other'
  occurredOn: string
  hospitalId: string
  /** Given by hospital reception on arrival; the anchor for verification. */
  caseReference: string
  /** Names of uploaded proof files. Real uploads go to object storage. */
  evidence: string[]
  status: ClaimStatus
  submittedAt: string
  reviewedAt: string | null
  reviewerNote: string | null
  coinsAwarded: number
  /** Helper confirmed they have no employment/commercial link to the hospital. */
  conflictDeclared: boolean
}

export type LedgerEntry = {
  id: string
  at: string
  /** Positive credits, negative debits. */
  delta: number
  reason: string
  /** What produced this row — a claim id, a bill id, or 'expiry'. */
  source: string
  expiresOn?: string
}

export type WalletState = {
  claims: RescueClaim[]
  ledger: LedgerEntry[]
}

const STORAGE_KEY = 'careconnect.wallet.v1'

const monthsFromNow = (m: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() + m)
  return d.toISOString()
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

/** Seed state so the wallet demonstrates a real history rather than a zero. */
export const SEED_WALLET: WalletState = {
  claims: [
    {
      id: 'rc-1042',
      incident:
        'A two-wheeler rider was hit near the Marathahalli flyover around 9:40 pm. He was conscious but bleeding heavily from the left leg. I applied pressure with my jacket, flagged down a cab and took him to the emergency department.',
      incidentType: 'road-accident',
      occurredOn: daysAgo(46),
      hospitalId: 'h-blr-01',
      caseReference: 'CAM-2026-08-4471',
      evidence: ['er-triage-slip.jpg', 'hospital-entry-photo.jpg'],
      status: 'verified',
      submittedAt: daysAgo(46),
      reviewedAt: daysAgo(44),
      reviewerNote: 'Arrival confirmed against ER triage log. Helper not affiliated with hospital.',
      coinsAwarded: COINS_PER_RESCUE,
      conflictDeclared: true,
    },
    {
      id: 'rc-1188',
      incident:
        'An elderly man collapsed at the Koramangala bus stop. No pulse that I could feel, so I started compressions and asked someone to call 108. Rode with him in the ambulance and stayed until his family arrived.',
      incidentType: 'cardiac',
      occurredOn: daysAgo(19),
      hospitalId: 'h-blr-02',
      caseReference: 'VNS-2026-09-0912',
      evidence: ['ambulance-handover.pdf'],
      status: 'verified',
      submittedAt: daysAgo(19),
      reviewedAt: daysAgo(17),
      reviewerNote: 'Confirmed by ER charge nurse. Bystander CPR noted in the case sheet.',
      coinsAwarded: COINS_PER_RESCUE,
      conflictDeclared: true,
    },
    {
      id: 'rc-1231',
      incident:
        'Found a woman who had fainted in the queue at a ration shop in Jayanagar. Moved her into shade, raised her legs, and took her to the nearest emergency room in an auto once she came around but stayed disoriented.',
      incidentType: 'collapse',
      occurredOn: daysAgo(4),
      hospitalId: 'h-blr-03',
      caseReference: 'WCH-2026-09-2207',
      evidence: ['op-registration.jpg'],
      status: 'hospital-review',
      submittedAt: daysAgo(4),
      reviewedAt: null,
      reviewerNote: null,
      coinsAwarded: 0,
      conflictDeclared: true,
    },
  ],
  ledger: [
    { id: 'l-01', at: daysAgo(44), delta: COINS_PER_RESCUE, reason: 'Verified rescue — road accident, Marathahalli', source: 'rc-1042', expiresOn: monthsFromNow(22) },
    { id: 'l-02', at: daysAgo(30), delta: -300, reason: 'Redeemed against consultation & X-ray', source: 'bill-CAM-77120' },
    { id: 'l-03', at: daysAgo(17), delta: COINS_PER_RESCUE, reason: 'Verified rescue — cardiac arrest, Koramangala', source: 'rc-1188', expiresOn: monthsFromNow(23) },
    { id: 'l-04', at: daysAgo(11), delta: 100, reason: 'First-aid certification bonus', source: 'course-bls-01', expiresOn: monthsFromNow(23) },
  ],
}

export function loadWallet(): WalletState {
  return readJSON<WalletState>(STORAGE_KEY, SEED_WALLET)
}

export function saveWallet(state: WalletState): void {
  writeJSON(STORAGE_KEY, state)
}

export function resetWallet(): WalletState {
  saveWallet(SEED_WALLET)
  return SEED_WALLET
}

export const balanceOf = (s: WalletState) =>
  s.ledger.reduce((sum, e) => sum + e.delta, 0)

export const earnedTotal = (s: WalletState) =>
  s.ledger.filter((e) => e.delta > 0).reduce((sum, e) => sum + e.delta, 0)

export const redeemedTotal = (s: WalletState) =>
  Math.abs(s.ledger.filter((e) => e.delta < 0).reduce((sum, e) => sum + e.delta, 0))

export const verifiedRescues = (s: WalletState) =>
  s.claims.filter((c) => c.status === 'verified').length

export const pendingClaims = (s: WalletState) =>
  s.claims.filter((c) => c.status === 'submitted' || c.status === 'hospital-review').length

/** Coins expiring within the next 60 days, so the wallet can warn in time. */
export function expiringSoon(s: WalletState): { coins: number; on: string } | null {
  const horizon = Date.now() + 60 * 86_400_000
  const soon = s.ledger
    .filter((e) => e.delta > 0 && e.expiresOn && new Date(e.expiresOn).getTime() < horizon)
    .sort((a, b) => a.expiresOn!.localeCompare(b.expiresOn!))
  if (soon.length === 0) return null
  return { coins: soon.reduce((sum, e) => sum + e.delta, 0), on: soon[0].expiresOn! }
}

/** The most that can come off this bill: capped by both balance and policy. */
export function maxRedeemable(balance: number, billAmount: number): number {
  return Math.max(0, Math.min(balance, Math.floor((billAmount * REDEEM_CAP_PCT) / 100)))
}

export function claimsThisMonth(s: WalletState): number {
  const now = new Date()
  return s.claims.filter((c) => {
    const d = new Date(c.submittedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function addClaim(
  s: WalletState,
  input: Omit<RescueClaim, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewerNote' | 'coinsAwarded'>,
): WalletState {
  const claim: RescueClaim = {
    ...input,
    id: uid('rc'),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerNote: null,
    coinsAwarded: 0,
  }
  return { ...s, claims: [claim, ...s.claims] }
}

/** Demo-only shortcut for what the hospital portal does server-side. */
export function verifyClaim(s: WalletState, claimId: string): WalletState {
  const claim = s.claims.find((c) => c.id === claimId)
  if (!claim || claim.status === 'verified') return s

  const claims = s.claims.map((c) =>
    c.id === claimId
      ? {
          ...c,
          status: 'verified' as const,
          reviewedAt: new Date().toISOString(),
          reviewerNote: 'Arrival confirmed against the hospital case reference.',
          coinsAwarded: COINS_PER_RESCUE,
        }
      : c,
  )

  const entry: LedgerEntry = {
    id: uid('l'),
    at: new Date().toISOString(),
    delta: COINS_PER_RESCUE,
    reason: 'Verified rescue — hospital confirmed arrival',
    source: claimId,
    expiresOn: monthsFromNow(COIN_LIFETIME_MONTHS),
  }

  return { claims, ledger: [entry, ...s.ledger] }
}

export function redeem(s: WalletState, coins: number, billRef: string, note: string): WalletState {
  const amount = Math.min(coins, balanceOf(s))
  if (amount <= 0) return s
  const entry: LedgerEntry = {
    id: uid('l'),
    at: new Date().toISOString(),
    delta: -amount,
    reason: note,
    source: billRef,
  }
  return { ...s, ledger: [entry, ...s.ledger] }
}
