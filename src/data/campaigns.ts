/**
 * Crowdfunding campaigns — seed data.
 *
 * Every field that a donor uses to decide is modelled explicitly:
 * who verified the bill, when, which hospital account funds settle into,
 * and what has already been disbursed. Trust is the product here, so
 * nothing about verification is implied — it is stated or it is absent.
 */

export type VerificationStatus = 'verified' | 'pending' | 'unverified'

export type CampaignDocument = {
  label: string
  kind: 'hospital-bill' | 'diagnosis' | 'identity' | 'estimate'
  verifiedOn: string | null
  verifiedBy: string | null
}

export type Disbursement = {
  date: string
  amount: number
  to: string
  note: string
}

export type Campaign = {
  id: string
  patientName: string
  age: number
  city: string
  title: string
  condition: string
  treatmentKey: string
  hospitalId: string
  goal: number
  raised: number
  donors: number
  /** ISO date the campaign closes. */
  deadline: string
  createdOn: string
  status: VerificationStatus
  /** Set when a medical board or hospital confirmed the diagnosis and estimate. */
  verifiedBy: string | null
  story: string
  documents: CampaignDocument[]
  disbursements: Disbursement[]
  /** Funds settle directly to the hospital, never to an individual. */
  settlesTo: string
  urgent: boolean
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'c-001',
    patientName: 'Riya Kulkarni',
    age: 6,
    city: 'Pune',
    title: 'Riya needs a bone marrow transplant to beat leukaemia',
    condition: 'Acute Lymphoblastic Leukaemia',
    treatmentKey: 'chemotherapy',
    hospitalId: 'h-pun-01',
    goal: 1800000,
    raised: 1342500,
    donors: 2841,
    deadline: '2026-11-15',
    createdOn: '2026-08-02',
    status: 'verified',
    verifiedBy: 'Sahyadri Crest Hospital — Oncology Dept.',
    story:
      'Riya was diagnosed in June after weeks of fevers her parents thought were seasonal. She has completed two cycles of chemotherapy and her doctors have cleared her for a transplant, with her elder brother as a matched donor. Her father drives an auto-rickshaw; the family has already sold their two-wheeler and borrowed against their home to pay for the first cycles. The transplant must happen within the next eight weeks for the best chance of remission.',
    documents: [
      { label: 'Diagnosis summary (Oncology)', kind: 'diagnosis', verifiedOn: '2026-08-04', verifiedBy: 'Dr. A. Deshpande, MD (Onco)' },
      { label: 'Transplant cost estimate', kind: 'estimate', verifiedOn: '2026-08-04', verifiedBy: 'Hospital Billing Office' },
      { label: 'Hospital bills — cycles 1 & 2', kind: 'hospital-bill', verifiedOn: '2026-08-11', verifiedBy: 'Hospital Billing Office' },
      { label: 'Aadhaar & family income certificate', kind: 'identity', verifiedOn: '2026-08-04', verifiedBy: 'CareConnect Trust & Safety' },
    ],
    disbursements: [
      { date: '2026-08-20', amount: 400000, to: 'Sahyadri Crest Hospital', note: 'Chemotherapy cycle 3 + supportive care' },
      { date: '2026-09-09', amount: 350000, to: 'Sahyadri Crest Hospital', note: 'Donor workup and HLA typing' },
    ],
    settlesTo: 'Sahyadri Crest Hospital — Escrow A/C ending 4471',
    urgent: true,
  },
  {
    id: 'c-002',
    patientName: 'Mohammed Irfan',
    age: 34,
    city: 'Hyderabad',
    title: 'Auto driver paralysed after a hit-and-run needs spine surgery',
    condition: 'Spinal cord compression (T8–T10)',
    treatmentKey: 'spine-surgery',
    hospitalId: 'h-hyd-01',
    goal: 620000,
    raised: 487000,
    donors: 1120,
    deadline: '2026-10-28',
    createdOn: '2026-09-01',
    status: 'verified',
    verifiedBy: 'Charminar Institute of Medical Sciences — Neurosurgery',
    story:
      'Irfan was returning home from a night shift when a speeding car hit his auto near Kukatpally. A stranger stopped, put him in his own car and reached the hospital within twenty minutes — the reason he is alive. He has lost movement below the waist and surgery within the month gives him a real chance of walking again. He is the only earning member for his wife, two children and his mother.',
    documents: [
      { label: 'MRI report and surgical plan', kind: 'diagnosis', verifiedOn: '2026-09-03', verifiedBy: 'Dr. S. Rao, MCh (Neuro)' },
      { label: 'Surgery cost estimate', kind: 'estimate', verifiedOn: '2026-09-03', verifiedBy: 'Hospital Billing Office' },
      { label: 'FIR copy and accident report', kind: 'identity', verifiedOn: '2026-09-05', verifiedBy: 'CareConnect Trust & Safety' },
    ],
    disbursements: [
      { date: '2026-09-14', amount: 220000, to: 'Charminar Institute of Medical Sciences', note: 'ICU stay and stabilisation' },
    ],
    settlesTo: 'Charminar IMS — Escrow A/C ending 8820',
    urgent: true,
  },
  {
    id: 'c-003',
    patientName: 'Lakshmi Ammal',
    age: 61,
    city: 'Chennai',
    title: 'Help Lakshmi get the kidney transplant she has waited two years for',
    condition: 'End-stage renal disease',
    treatmentKey: 'kidney-transplant',
    hospitalId: 'h-chn-01',
    goal: 900000,
    raised: 268400,
    donors: 612,
    deadline: '2026-12-20',
    createdOn: '2026-09-10',
    status: 'verified',
    verifiedBy: 'Marina Superspeciality Hospital — Nephrology',
    story:
      'Lakshmi has been on dialysis three times a week for two years. Her daughter is a matched donor and both have been cleared for surgery. The family runs a small tailoring shop that has covered dialysis so far, but not the transplant. Her doctors say her heart will not tolerate dialysis for much longer.',
    documents: [
      { label: 'Nephrology assessment', kind: 'diagnosis', verifiedOn: '2026-09-12', verifiedBy: 'Dr. K. Venkatesan, DM (Nephro)' },
      { label: 'Transplant package estimate', kind: 'estimate', verifiedOn: '2026-09-12', verifiedBy: 'Hospital Billing Office' },
      { label: 'Dialysis bills — 24 months', kind: 'hospital-bill', verifiedOn: '2026-09-15', verifiedBy: 'Hospital Billing Office' },
    ],
    disbursements: [],
    settlesTo: 'Marina Superspeciality — Escrow A/C ending 1094',
    urgent: false,
  },
  {
    id: 'c-004',
    patientName: 'Baby Aarav',
    age: 0,
    city: 'Lucknow',
    title: 'Premature newborn Aarav needs 6 more weeks in the NICU',
    condition: 'Extreme prematurity (28 weeks), respiratory distress',
    treatmentKey: 'paed-emergency',
    hospitalId: 'h-luc-01',
    goal: 750000,
    raised: 701200,
    donors: 3204,
    deadline: '2026-10-10',
    createdOn: '2026-08-25',
    status: 'verified',
    verifiedBy: 'Awadh Institute of Medical Sciences — Neonatology',
    story:
      'Aarav was born twelve weeks early weighing 1.1 kg. He has been on ventilator support since birth and his doctors expect he will need the NICU for six more weeks before he can breathe on his own. His parents are daily-wage workers from Barabanki and have been sleeping in the hospital corridor.',
    documents: [
      { label: 'NICU admission and daily notes', kind: 'diagnosis', verifiedOn: '2026-08-27', verifiedBy: 'Dr. P. Srivastava, DM (Neonat)' },
      { label: 'Running NICU bill', kind: 'hospital-bill', verifiedOn: '2026-09-18', verifiedBy: 'Hospital Billing Office' },
      { label: 'Ayushman Bharat claim rejection letter', kind: 'estimate', verifiedOn: '2026-08-30', verifiedBy: 'CareConnect Trust & Safety' },
    ],
    disbursements: [
      { date: '2026-09-02', amount: 300000, to: 'Awadh Institute of Medical Sciences', note: 'NICU weeks 1–3, surfactant therapy' },
      { date: '2026-09-19', amount: 250000, to: 'Awadh Institute of Medical Sciences', note: 'NICU weeks 4–5, ventilator support' },
    ],
    settlesTo: 'Awadh IMS — Escrow A/C ending 7712',
    urgent: true,
  },
  {
    id: 'c-005',
    patientName: 'Sunita Devi',
    age: 42,
    city: 'Patna',
    title: 'Sunita survived a kitchen fire — she needs reconstructive surgery',
    condition: '38% burns, contracture of both hands',
    treatmentKey: 'severe-burns',
    hospitalId: 'h-pat-01',
    goal: 480000,
    raised: 132000,
    donors: 389,
    deadline: '2026-11-30',
    createdOn: '2026-09-16',
    status: 'pending',
    verifiedBy: null,
    story:
      'A gas cylinder leak set fire to Sunita\'s kitchen in July. She pulled her two children out before the flames reached them. She has survived the critical phase but scar contractures have left her unable to open either hand, and she cannot return to her work as a domestic helper without reconstructive surgery.',
    documents: [
      { label: 'Burns unit discharge summary', kind: 'diagnosis', verifiedOn: '2026-09-17', verifiedBy: 'Dr. N. Kumar, MS (Plastic)' },
      { label: 'Reconstruction estimate', kind: 'estimate', verifiedOn: null, verifiedBy: null },
      { label: 'Identity documents', kind: 'identity', verifiedOn: '2026-09-17', verifiedBy: 'CareConnect Trust & Safety' },
    ],
    disbursements: [],
    settlesTo: 'Magadh Medical College — Escrow A/C ending 3356',
    urgent: false,
  },
  {
    id: 'c-006',
    patientName: 'Gurpreet Singh',
    age: 28,
    city: 'Chandigarh',
    title: 'Factory worker needs urgent heart valve replacement',
    condition: 'Severe rheumatic mitral stenosis',
    treatmentKey: 'valve-replacement',
    hospitalId: 'h-chd-01',
    goal: 540000,
    raised: 540000,
    donors: 1876,
    deadline: '2026-09-30',
    createdOn: '2026-07-20',
    status: 'verified',
    verifiedBy: 'Shivalik Postgraduate Medical Institute — Cardiology',
    story:
      'Gurpreet was told at 14 that his childhood rheumatic fever had damaged a heart valve, and that he would need surgery "one day". That day arrived in June, when he collapsed on the factory floor. His surgery is complete and this campaign is fully funded — the page stays open so donors can see exactly where their money went.',
    documents: [
      { label: 'Echocardiogram and surgical plan', kind: 'diagnosis', verifiedOn: '2026-07-22', verifiedBy: 'Dr. H. Gill, DM (Cardio)' },
      { label: 'Final hospital bill', kind: 'hospital-bill', verifiedOn: '2026-09-08', verifiedBy: 'Hospital Billing Office' },
    ],
    disbursements: [
      { date: '2026-08-12', amount: 420000, to: 'Shivalik PGMI', note: 'Mitral valve replacement surgery' },
      { date: '2026-09-08', amount: 120000, to: 'Shivalik PGMI', note: 'Post-op ICU, medication, follow-up' },
    ],
    settlesTo: 'Shivalik PGMI — Escrow A/C ending 5508',
    urgent: false,
  },
]

/** Bounded to 0–100. A zero or missing goal reads as 0%, never NaN — a NaN
 *  here reaches the DOM as `aria-valuenow="NaN"` and a broken bar width. */
export const fundedPercent = (c: Campaign) => {
  if (!Number.isFinite(c.goal) || c.goal <= 0) return 0
  if (!Number.isFinite(c.raised) || c.raised <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((c.raised / c.goal) * 100)))
}

/** Whole days remaining, floored at 0. An unparseable deadline reads as
 *  expired rather than propagating NaN through the UI. */
export const daysLeft = (c: Campaign) => {
  const end = new Date(c.deadline).getTime()
  if (!Number.isFinite(end)) return 0
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000))
}

export const totalDisbursed = (c: Campaign) =>
  c.disbursements.reduce((sum, d) => sum + d.amount, 0)
