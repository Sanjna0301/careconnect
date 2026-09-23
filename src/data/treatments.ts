/**
 * Treatment catalogue.
 *
 * `baseMin`/`baseMax` are national reference bands in INR for a standard
 * ward admission. A hospital's quoted band is this range scaled by its
 * price tier and city cost index (see `costFor` in data/hospitals.ts), so
 * every price shown in the UI is explainable rather than hand-authored.
 *
 * `aliases` drive search: users type a disease, a symptom or a slang term,
 * not a procedure name.
 */

export type Specialty =
  | 'emergency'
  | 'cardiology'
  | 'neurology'
  | 'orthopaedics'
  | 'oncology'
  | 'nephrology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'paediatrics'
  | 'maternity'
  | 'burns'
  | 'ophthalmology'
  | 'psychiatry'
  | 'transplant'

export const SPECIALTY_LABEL: Record<Specialty, string> = {
  emergency: 'Emergency & Trauma',
  cardiology: 'Heart (Cardiology)',
  neurology: 'Brain & Nerves (Neurology)',
  orthopaedics: 'Bones & Joints (Orthopaedics)',
  oncology: 'Cancer (Oncology)',
  nephrology: 'Kidney (Nephrology)',
  gastroenterology: 'Stomach & Liver (Gastro)',
  pulmonology: 'Lungs (Pulmonology)',
  paediatrics: 'Children (Paediatrics)',
  maternity: 'Maternity & Newborn',
  burns: 'Burns & Plastic Surgery',
  ophthalmology: 'Eye (Ophthalmology)',
  psychiatry: 'Mental Health',
  transplant: 'Organ Transplant',
}

export type Treatment = {
  key: string
  name: string
  specialty: Specialty
  /** True when minutes matter — these surface the SOS path first. */
  urgent: boolean
  baseMin: number
  baseMax: number
  aliases: string[]
}

export const TREATMENTS: Treatment[] = [
  // --- Time-critical ---
  { key: 'heart-attack', name: 'Heart Attack (Angioplasty / Stent)', specialty: 'cardiology', urgent: true, baseMin: 180000, baseMax: 450000,
    aliases: ['heart attack', 'chest pain', 'myocardial infarction', 'mi', 'cardiac arrest', 'angioplasty', 'stent', 'seene me dard', 'dil ka daura'] },
  { key: 'stroke', name: 'Stroke (Thrombolysis / Clot Retrieval)', specialty: 'neurology', urgent: true, baseMin: 150000, baseMax: 600000,
    aliases: ['stroke', 'brain stroke', 'paralysis', 'slurred speech', 'face drooping', 'numbness one side', 'lakwa', 'brain attack'] },
  { key: 'polytrauma', name: 'Road Accident / Polytrauma Care', specialty: 'emergency', urgent: true, baseMin: 80000, baseMax: 500000,
    aliases: ['accident', 'road accident', 'trauma', 'head injury', 'fracture bleeding', 'crash', 'durghatna', 'hit by car'] },
  { key: 'severe-burns', name: 'Severe Burns Management', specialty: 'burns', urgent: true, baseMin: 120000, baseMax: 700000,
    aliases: ['burn', 'burns', 'fire injury', 'scald', 'acid attack', 'jal gaya'] },
  { key: 'snake-bite', name: 'Snake Bite / Poisoning (Anti-venom)', specialty: 'emergency', urgent: true, baseMin: 25000, baseMax: 150000,
    aliases: ['snake bite', 'poison', 'poisoning', 'overdose', 'insecticide', 'saanp'] },
  { key: 'severe-asthma', name: 'Acute Asthma / Breathing Failure', specialty: 'pulmonology', urgent: true, baseMin: 30000, baseMax: 180000,
    aliases: ['asthma attack', 'breathless', 'cannot breathe', 'shortness of breath', 'copd', 'saans', 'wheezing'] },
  { key: 'appendicitis', name: 'Appendicitis (Appendectomy)', specialty: 'gastroenterology', urgent: true, baseMin: 55000, baseMax: 180000,
    aliases: ['appendix', 'appendicitis', 'severe stomach pain', 'right side pain', 'pet dard'] },
  { key: 'high-risk-delivery', name: 'Emergency Delivery / C-Section', specialty: 'maternity', urgent: true, baseMin: 45000, baseMax: 250000,
    aliases: ['delivery', 'labour', 'c section', 'cesarean', 'pregnancy emergency', 'bleeding pregnancy', 'prasav'] },
  { key: 'paed-emergency', name: 'Child Emergency / NICU Care', specialty: 'paediatrics', urgent: true, baseMin: 40000, baseMax: 350000,
    aliases: ['child fever', 'baby not breathing', 'nicu', 'newborn', 'seizure child', 'convulsion', 'bachcha'] },
  { key: 'psych-crisis', name: 'Mental Health Crisis Support', specialty: 'psychiatry', urgent: true, baseMin: 15000, baseMax: 90000,
    aliases: ['suicidal', 'self harm', 'panic attack', 'depression', 'mental health', 'anxiety attack'] },

  // --- Planned / non-urgent ---
  { key: 'bypass', name: 'Coronary Bypass Surgery (CABG)', specialty: 'cardiology', urgent: false, baseMin: 250000, baseMax: 650000,
    aliases: ['bypass', 'cabg', 'open heart surgery', 'blocked artery'] },
  { key: 'valve-replacement', name: 'Heart Valve Replacement', specialty: 'cardiology', urgent: false, baseMin: 280000, baseMax: 700000,
    aliases: ['valve', 'heart valve', 'mitral', 'aortic'] },
  { key: 'dialysis', name: 'Haemodialysis (per session)', specialty: 'nephrology', urgent: false, baseMin: 1500, baseMax: 4500,
    aliases: ['dialysis', 'kidney failure', 'creatinine high', 'renal failure', 'gurda'] },
  { key: 'kidney-transplant', name: 'Kidney Transplant', specialty: 'transplant', urgent: false, baseMin: 550000, baseMax: 1200000,
    aliases: ['kidney transplant', 'renal transplant', 'organ transplant'] },
  { key: 'liver-transplant', name: 'Liver Transplant', specialty: 'transplant', urgent: false, baseMin: 1800000, baseMax: 3200000,
    aliases: ['liver transplant', 'cirrhosis', 'liver failure'] },
  { key: 'chemotherapy', name: 'Chemotherapy (per cycle)', specialty: 'oncology', urgent: false, baseMin: 25000, baseMax: 150000,
    aliases: ['cancer', 'chemo', 'chemotherapy', 'tumour', 'tumor', 'oncology'] },
  { key: 'radiotherapy', name: 'Radiotherapy (full course)', specialty: 'oncology', urgent: false, baseMin: 150000, baseMax: 450000,
    aliases: ['radiation', 'radiotherapy', 'cancer treatment'] },
  { key: 'knee-replacement', name: 'Total Knee Replacement', specialty: 'orthopaedics', urgent: false, baseMin: 180000, baseMax: 420000,
    aliases: ['knee replacement', 'knee pain', 'arthritis', 'ghutna'] },
  { key: 'hip-replacement', name: 'Total Hip Replacement', specialty: 'orthopaedics', urgent: false, baseMin: 200000, baseMax: 450000,
    aliases: ['hip replacement', 'hip fracture'] },
  { key: 'spine-surgery', name: 'Spine / Disc Surgery', specialty: 'orthopaedics', urgent: false, baseMin: 150000, baseMax: 500000,
    aliases: ['slip disc', 'back pain surgery', 'spine', 'sciatica'] },
  { key: 'gallbladder', name: 'Gallbladder Removal (Lap Chole)', specialty: 'gastroenterology', urgent: false, baseMin: 60000, baseMax: 160000,
    aliases: ['gallbladder', 'gall stone', 'gallstones', 'pitta'] },
  { key: 'hernia', name: 'Hernia Repair', specialty: 'gastroenterology', urgent: false, baseMin: 45000, baseMax: 130000,
    aliases: ['hernia'] },
  { key: 'cataract', name: 'Cataract Surgery (per eye)', specialty: 'ophthalmology', urgent: false, baseMin: 18000, baseMax: 95000,
    aliases: ['cataract', 'eye surgery', 'blurred vision', 'motiyabind'] },
  { key: 'normal-delivery', name: 'Normal Delivery Package', specialty: 'maternity', urgent: false, baseMin: 25000, baseMax: 120000,
    aliases: ['normal delivery', 'childbirth', 'maternity package'] },
  { key: 'dengue', name: 'Dengue / Malaria Admission', specialty: 'emergency', urgent: false, baseMin: 20000, baseMax: 90000,
    aliases: ['dengue', 'malaria', 'typhoid', 'high fever', 'platelets low', 'bukhar', 'viral fever'] },
  { key: 'pneumonia', name: 'Pneumonia / Chest Infection', specialty: 'pulmonology', urgent: false, baseMin: 30000, baseMax: 140000,
    aliases: ['pneumonia', 'chest infection', 'lung infection', 'cough fever'] },
  { key: 'epilepsy', name: 'Seizure / Epilepsy Workup', specialty: 'neurology', urgent: false, baseMin: 25000, baseMax: 120000,
    aliases: ['seizure', 'epilepsy', 'fits', 'convulsions', 'mirgi'] },
  { key: 'diabetes-care', name: 'Diabetes Complication Care', specialty: 'nephrology', urgent: false, baseMin: 20000, baseMax: 110000,
    aliases: ['diabetes', 'sugar', 'diabetic foot', 'madhumeh'] },
]

export const TREATMENT_BY_KEY: Record<string, Treatment> = Object.fromEntries(
  TREATMENTS.map((t) => [t.key, t]),
)

/**
 * Free-text search over names and aliases.
 * Exact alias hits rank above partial name hits, so "chest pain" lands on
 * heart attack rather than on "chest infection".
 */
export function matchTreatments(query: string, limit = 6): Treatment[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const scored = TREATMENTS.map((t) => {
    const name = t.name.toLowerCase()
    let score = 0
    if (t.aliases.some((a) => a === q)) score = 100
    else if (t.aliases.some((a) => a.startsWith(q))) score = 80
    else if (t.aliases.some((a) => a.includes(q))) score = 60
    else if (name.startsWith(q)) score = 50
    else if (name.includes(q)) score = 30
    else if (SPECIALTY_LABEL[t.specialty].toLowerCase().includes(q)) score = 15
    if (score > 0 && t.urgent) score += 5
    return { t, score }
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.t)
}
