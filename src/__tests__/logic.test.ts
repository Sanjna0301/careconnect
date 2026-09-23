import { describe, expect, test } from 'bun:test'
import { haversineKm } from '@/lib/geo'
import { formatCostBand, formatDistance, formatEta } from '@/lib/format'
import { matchTreatments, TREATMENT_BY_KEY, TREATMENTS } from '@/data/treatments'
import { HOSPITALS, bestInIndia, costFor, icuBedsFree, offersTreatment } from '@/data/hospitals'
import { parseReport } from '@/lib/reportParser'
import { runTriage } from '@/lib/triage'
import {
  COINS_PER_RESCUE, REDEEM_CAP_PCT, SEED_WALLET, balanceOf, earnedTotal,
  maxRedeemable, redeem, redeemedTotal, verifyClaim, verifiedRescues,
} from '@/store/wallet'
import { CITY_CENTRES } from '@/data/cityCentres'

describe('geo', () => {
  test('Delhi to Mumbai is roughly 1150 km', () => {
    const km = haversineKm(CITY_CENTRES.Delhi, CITY_CENTRES.Mumbai)
    expect(km).toBeGreaterThan(1100)
    expect(km).toBeLessThan(1200)
  })

  test('distance to itself is zero', () => {
    expect(haversineKm(CITY_CENTRES.Chennai, CITY_CENTRES.Chennai)).toBe(0)
  })

  test('sub-kilometre distances are shown in metres', () => {
    expect(formatDistance(0.42)).toBe('420 m')
    expect(formatDistance(3.14)).toBe('3.1 km')
    expect(formatDistance(48.6)).toBe('49 km')
    expect(formatDistance(null)).toBe('—')
  })

  test('ETA never claims under two minutes', () => {
    expect(formatEta(0.05)).toBe('2 min')
    expect(formatEta(22)).toBe('1 h')
    expect(formatEta(null)).toBeNull()
  })
})

describe('hospital directory', () => {
  test('every hospital has a plausible coordinate inside India', () => {
    for (const h of HOSPITALS) {
      expect(h.lat).toBeGreaterThan(6)
      expect(h.lat).toBeLessThan(37)
      expect(h.lng).toBeGreaterThan(68)
      expect(h.lng).toBeLessThan(98)
    }
  })

  test('hospital ids are unique', () => {
    expect(new Set(HOSPITALS.map((h) => h.id)).size).toBe(HOSPITALS.length)
  })

  test('occupancy stays within 0 and 1 so bed counts never go negative', () => {
    for (const h of HOSPITALS) {
      expect(h.occupancy).toBeGreaterThanOrEqual(0)
      expect(h.occupancy).toBeLessThanOrEqual(1)
      expect(icuBedsFree(h)).toBeGreaterThanOrEqual(0)
      expect(icuBedsFree(h)).toBeLessThanOrEqual(h.icuBeds)
    }
  })

  test('a government hospital quotes less than a premium private one', () => {
    const bypass = TREATMENT_BY_KEY['bypass']
    const govt = HOSPITALS.find((h) => h.ownership === 'government' && offersTreatment(h, bypass))!
    const premium = HOSPITALS.find((h) => h.tier === 'premium' && offersTreatment(h, bypass))!
    expect(costFor(govt, bypass).min).toBeLessThan(costFor(premium, bypass).min)
  })

  test('cost bands always have min below max', () => {
    for (const h of HOSPITALS) {
      for (const t of TREATMENTS) {
        if (!offersTreatment(h, t)) continue
        const { min, max } = costFor(h, t)
        expect(min).toBeLessThan(max)
        expect(min).toBeGreaterThan(0)
      }
    }
  })

  test('notOffered overrides the speciality', () => {
    const centre = HOSPITALS.find((h) => h.id === 'h-hyd-02')!
    expect(centre.specialties).toContain('transplant')
    expect(offersTreatment(centre, TREATMENT_BY_KEY['liver-transplant'])).toBe(false)
    expect(offersTreatment(centre, TREATMENT_BY_KEY['kidney-transplant'])).toBe(true)
  })

  test('national rankings come back in rank order', () => {
    const ranked = bestInIndia('cardiology')
    expect(ranked.length).toBeGreaterThan(1)
    const ranks = ranked.map((h) => h.nationalRank!.cardiology!)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  test('every hospital claiming a rank actually has that speciality', () => {
    for (const h of HOSPITALS) {
      for (const key of Object.keys(h.nationalRank ?? {})) {
        expect(h.specialties).toContain(key as never)
      }
    }
  })
})

describe('treatment search', () => {
  test('a symptom in plain words finds the right treatment', () => {
    expect(matchTreatments('chest pain')[0].key).toBe('heart-attack')
    expect(matchTreatments('slurred speech')[0].key).toBe('stroke')
    expect(matchTreatments('gall stone')[0].key).toBe('gallbladder')
  })

  test('Hindi transliterations are matched', () => {
    expect(matchTreatments('lakwa')[0].key).toBe('stroke')
    expect(matchTreatments('bukhar')[0].key).toBe('dengue')
  })

  test('one-character queries return nothing rather than everything', () => {
    expect(matchTreatments('c')).toHaveLength(0)
  })

  test('every treatment maps to a hospital that offers it', () => {
    for (const t of TREATMENTS) {
      expect(HOSPITALS.some((h) => offersTreatment(h, t))).toBe(true)
    }
  })

  test('cost bands format as a readable range', () => {
    expect(formatCostBand(180000, 450000)).toContain('–')
  })
})

describe('triage', () => {
  test('chest pain is red and routes to cardiology', () => {
    const r = runTriage('I have had chest pain since morning and I am sweating')
    expect(r.severity).toBe('red')
    expect(r.treatmentKey).toBe('heart-attack')
    expect(r.headline).toContain('112')
  })

  test('stroke signs are red', () => {
    expect(runTriage('my father has slurred speech and one side weak').severity).toBe('red')
  })

  test('red beats amber when both appear in one message', () => {
    const r = runTriage('high fever for four days and now severe chest pain')
    expect(r.severity).toBe('red')
    expect(r.treatmentKey).toBe('heart-attack')
  })

  test('self-harm routes to Tele-MANAS rather than a hospital list', () => {
    const r = runTriage('I feel suicidal')
    expect(r.severity).toBe('red')
    expect(r.actions.join(' ')).toContain('14416')
  })

  test('a fever is amber, not an emergency', () => {
    expect(runTriage('high fever for 4 days').severity).toBe('amber')
  })

  test('an unmatched message degrades to guidance, never to a diagnosis', () => {
    const r = runTriage('my shoulder feels a bit odd')
    expect(r.severity).toBe('green')
    expect(r.actions.length).toBeGreaterThan(0)
  })

  test('every triage result carries at least one action', () => {
    const samples = ['chest pain', 'cannot breathe', 'heavy bleeding', 'pregnant and bleeding', 'hello']
    for (const s of samples) {
      expect(runTriage(s).actions.length).toBeGreaterThan(0)
    }
  })
})

describe('report parser', () => {
  const report = `
    COMPLETE BLOOD COUNT
    Haemoglobin        9.2   g/dL     13.0 - 17.0
    Total Leucocyte Count  13400  /uL   4000 - 11000
    Platelet Count     95000  /uL      150000 - 450000
    BIOCHEMISTRY
    Creatinine         1.1    mg/dL
    HbA1c              7.8    %
    TSH                6.9    uIU/mL
  `

  test('reads every named analyte it recognises', () => {
    const s = parseReport(report)
    const keys = s.findings.map((f) => f.analyte.key).sort()
    expect(keys).toEqual(['creatinine', 'hb', 'hba1c', 'platelets', 'tsh', 'wbc'])
  })

  test('classifies low, high and normal correctly', () => {
    const s = parseReport(report)
    const by = Object.fromEntries(s.findings.map((f) => [f.analyte.key, f]))
    expect(by.hb.status).toBe('low')
    expect(by.wbc.status).toBe('high')
    expect(by.platelets.status).toBe('low')
    expect(by.creatinine.status).toBe('normal')
    expect(by.hba1c.status).toBe('high')
  })

  test('abnormal-but-not-critical values are not escalated', () => {
    // 95,000 platelets is low and worth a doctor; it is not a same-day crisis.
    const s = parseReport(report)
    expect(s.abnormal.map((f) => f.analyte.key)).toContain('platelets')
    expect(s.urgent).toHaveLength(0)
  })

  test('values past the critical threshold are escalated', () => {
    const s = parseReport('Platelet Count 38000 /uL\nHaemoglobin 6.1 g/dL')
    const urgent = s.urgent.map((f) => f.analyte.key).sort()
    expect(urgent).toEqual(['hb', 'platelets'])
  })

  test('an empty or unrelated document yields no findings, not a guess', () => {
    expect(parseReport('').findings).toHaveLength(0)
    expect(parseReport('Dear patient, your appointment is confirmed.').findings).toHaveLength(0)
  })

  test('the same analyte is never reported twice', () => {
    const s = parseReport('Hb 9.2 g/dL\nHaemoglobin 9.2 g/dL\nHGB 9.2')
    expect(s.findings).toHaveLength(1)
  })

  test('every finding carries an explanation', () => {
    for (const f of parseReport(report).findings) {
      expect(f.explanation.length).toBeGreaterThan(30)
    }
  })
})

describe('CareCoins wallet', () => {
  test('the seed balance equals credits minus debits', () => {
    expect(balanceOf(SEED_WALLET)).toBe(earnedTotal(SEED_WALLET) - redeemedTotal(SEED_WALLET))
  })

  test('only verified claims count as rescues', () => {
    expect(verifiedRescues(SEED_WALLET)).toBe(2)
  })

  test('redemption is capped at the policy percentage of the bill', () => {
    // 20% of 10,000 is 2,000 — the cap binds, not the balance.
    expect(maxRedeemable(5000, 10000)).toBe(10000 * REDEEM_CAP_PCT / 100)
  })

  test('redemption is also capped by the balance', () => {
    expect(maxRedeemable(300, 100000)).toBe(300)
  })

  test('a zero balance can never redeem', () => {
    expect(maxRedeemable(0, 50000)).toBe(0)
  })

  test('coins can never go negative, even on an over-redeem', () => {
    const after = redeem(SEED_WALLET, 999999, 'bill-x', 'test')
    expect(balanceOf(after)).toBe(0)
  })

  test('verifying a pending claim credits exactly one reward', () => {
    const before = balanceOf(SEED_WALLET)
    const after = verifyClaim(SEED_WALLET, 'rc-1231')
    expect(balanceOf(after)).toBe(before + COINS_PER_RESCUE)
    expect(after.claims.find((c) => c.id === 'rc-1231')!.status).toBe('verified')
  })

  test('verifying the same claim twice does not pay twice', () => {
    const once = verifyClaim(SEED_WALLET, 'rc-1231')
    const twice = verifyClaim(once, 'rc-1231')
    expect(balanceOf(twice)).toBe(balanceOf(once))
  })

  test('verifying an unknown claim is a no-op', () => {
    expect(verifyClaim(SEED_WALLET, 'nope')).toBe(SEED_WALLET)
  })

  test('the ledger is append-only — the seed state is never mutated', () => {
    const seedLength = SEED_WALLET.ledger.length
    verifyClaim(SEED_WALLET, 'rc-1231')
    redeem(SEED_WALLET, 100, 'bill-y', 'test')
    expect(SEED_WALLET.ledger).toHaveLength(seedLength)
  })
})
