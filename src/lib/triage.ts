/**
 * Symptom triage engine.
 *
 * This is deliberately NOT a diagnosis engine. It does one job well: spot
 * patterns that must not wait, and say so in the first sentence. Everything
 * else routes the user toward a real clinician.
 *
 * Rules are ordered by severity. The first RED match wins outright — when
 * someone describes crushing chest pain, nothing else in their message
 * matters.
 *
 * ── Swapping in a real model ────────────────────────────────────────────
 * Replace `runTriage` with a call to your backend, which calls Claude with
 * a system prompt carrying these same red-flag rules. Keep the red-flag
 * check client-side as a floor: it must work when the network does not,
 * and it must not depend on a model choosing to comply.
 */

import type { Specialty } from '@/data/treatments'

export type Severity = 'red' | 'amber' | 'green'

export type TriageResult = {
  severity: Severity
  headline: string
  /** Why this matters — two sentences at most. */
  reasoning: string
  actions: string[]
  /** Routes the "find hospitals" button. */
  treatmentKey?: string
  specialty?: Specialty
  /** Questions a clinician will ask; helps the user prepare. */
  askYourself: string[]
}

type Rule = {
  severity: Severity
  /** Every group must match at least one of its terms. */
  all?: string[][]
  any?: string[]
  result: Omit<TriageResult, 'severity'>
}

const RULES: Rule[] = [
  {
    severity: 'red',
    any: ['chest pain', 'chest tightness', 'crushing chest', 'pain in chest', 'left arm pain', 'seene me dard', 'heart attack'],
    result: {
      headline: 'Treat this as a possible heart attack. Call 112 now.',
      reasoning:
        'Chest pain with sweating, breathlessness, or pain spreading to the jaw or left arm is a heart attack until proven otherwise. Heart muscle dies every minute this is delayed, and there is no way to rule it out at home.',
      actions: [
        'Call 112 or 108 immediately — do not drive yourself.',
        'Sit down and stay still. Loosen tight clothing.',
        'If you are not allergic to aspirin, not bleeding, and over 16, chew one 300 mg aspirin slowly. Confirm with the operator.',
        'Unlock your door so paramedics can get in.',
      ],
      treatmentKey: 'heart-attack',
      specialty: 'cardiology',
      askYourself: [
        'Is the pain spreading to your jaw, neck, back or left arm?',
        'Are you sweating, nauseous, or unusually breathless?',
        'Has this lasted more than 15 minutes, or come back repeatedly?',
      ],
    },
  },
  {
    severity: 'red',
    any: ['face drooping', 'slurred speech', 'cannot speak', 'one side weak', 'weakness one side', 'numb one side', 'sudden confusion', 'stroke', 'lakwa', 'paralysis'],
    result: {
      headline: 'These are stroke signs. Call 112 now and note the time.',
      reasoning:
        'Facial droop, arm weakness or slurred speech that started suddenly points to a stroke. Clot-busting treatment only works within a few hours of the first symptom, so the exact start time changes what treatment is possible.',
      actions: [
        'Call 112 immediately. Say the words "possible stroke".',
        'Write down the exact time symptoms started — the hospital will ask.',
        'Do not give food, water or any medicine; swallowing may be affected.',
        'Lie the person on their side with the head slightly raised.',
      ],
      treatmentKey: 'stroke',
      specialty: 'neurology',
      askYourself: [
        'Exactly what time did the symptoms start?',
        'Can they smile evenly, raise both arms, repeat a sentence clearly?',
        'Are they on blood thinners or have they had a recent head injury?',
      ],
    },
  },
  {
    severity: 'red',
    any: ['cannot breathe', "can't breathe", 'not breathing', 'gasping', 'blue lips', 'choking', 'suffocating', 'severe breathlessness'],
    result: {
      headline: 'Breathing failure is an emergency. Call 112 now.',
      reasoning:
        'Struggling to breathe, blue lips or being unable to finish a sentence means oxygen is not reaching the blood. This gets worse quickly and cannot be managed at home.',
      actions: [
        'Call 112 or 108 immediately.',
        'Sit them upright, leaning slightly forward. Do not lay them flat.',
        'If they have an inhaler, help them use it — 4 puffs, one at a time.',
        'If they stop responding and are not breathing normally, start CPR.',
      ],
      treatmentKey: 'severe-asthma',
      specialty: 'pulmonology',
      askYourself: [
        'Can they speak a full sentence without stopping for breath?',
        'Are the lips, tongue or fingertips turning blue or grey?',
        'Is there a known asthma, COPD or allergy history?',
      ],
    },
  },
  {
    severity: 'red',
    any: ['unconscious', 'not responding', 'collapsed', 'fainted and not waking', 'no pulse', 'cardiac arrest'],
    result: {
      headline: 'Unresponsive person — call 112 and check breathing now.',
      reasoning:
        'Someone who does not respond to being shaken and shouted at needs an ambulance regardless of the cause. If they are also not breathing normally, chest compressions are the only thing that helps.',
      actions: [
        'Call 112. Put the phone on speaker so you can keep your hands free.',
        'Check breathing for no more than 10 seconds.',
        'If breathing is absent or gasping, start chest compressions — hard and fast, centre of the chest.',
        'If breathing normally, roll them onto their side.',
      ],
      specialty: 'emergency',
      askYourself: [
        'Are they breathing normally, or gasping irregularly?',
        'Was there a fall, a seizure, or a known heart condition?',
        'How long have they been unresponsive?',
      ],
    },
  },
  {
    severity: 'red',
    any: ['heavy bleeding', 'bleeding a lot', 'blood not stopping', 'severe bleeding', 'spurting blood'],
    result: {
      headline: 'Uncontrolled bleeding — press hard and call 108.',
      reasoning:
        'Bleeding that soaks through cloth or spurts is losing blood faster than the body can replace it. Direct, continuous pressure is the single most effective thing a bystander can do.',
      actions: [
        'Press firmly on the wound with a clean cloth. Use your full body weight.',
        'Call 108 without releasing the pressure.',
        'Do not lift the cloth to look — add more cloth on top if it soaks through.',
        'Keep the person lying down and warm.',
      ],
      treatmentKey: 'polytrauma',
      specialty: 'emergency',
      askYourself: [
        'Is the bleeding pulsing in time with the heartbeat?',
        'Is there anything embedded in the wound?',
        'Are they pale, cold, drowsy or confused?',
      ],
    },
  },
  {
    severity: 'red',
    any: ['suicidal', 'kill myself', 'end my life', 'self harm', 'want to die', 'hurt myself'],
    result: {
      headline: "You deserve support right now. Tele-MANAS is free on 14416.",
      reasoning:
        'What you are feeling is a medical emergency in the same way a physical injury is, and it is treatable. Talking to a trained person today genuinely changes outcomes.',
      actions: [
        'Call Tele-MANAS on 14416 — free, 24×7, confidential, in your language.',
        'If you are in immediate danger, call 112.',
        'Tell one person nearby what is happening. You do not have to explain it well.',
        'Move away from anything you could use to hurt yourself, and stay with someone.',
      ],
      specialty: 'psychiatry',
      askYourself: [],
    },
  },
  {
    severity: 'amber',
    any: ['high fever', 'fever for', 'bukhar', 'dengue', 'malaria', 'typhoid', 'platelets'],
    result: {
      headline: 'A fever lasting more than 3 days needs a blood test.',
      reasoning:
        'In India, a fever past 72 hours is worth testing for dengue, malaria and typhoid, which look identical early on but are treated very differently. Falling platelets in dengue are the thing to watch.',
      actions: [
        'See a doctor today if the fever has lasted 3 days or more.',
        'Ask for a CBC, dengue NS1/IgM and a malaria smear.',
        'Drink fluids steadily — ORS, coconut water, soups.',
        'Paracetamol only. Avoid ibuprofen, aspirin and combination painkillers until dengue is ruled out.',
      ],
      treatmentKey: 'dengue',
      specialty: 'emergency',
      askYourself: [
        'How many days has the fever lasted, and what is the highest reading?',
        'Any bleeding from the gums or nose, or a rash appearing?',
        'Any severe stomach pain, vomiting, or drowsiness?',
      ],
    },
  },
  {
    severity: 'amber',
    any: ['severe stomach pain', 'appendix', 'right side pain', 'pet dard', 'abdominal pain'],
    result: {
      headline: 'Severe abdominal pain should be examined the same day.',
      reasoning:
        'Pain that starts near the navel and settles in the lower right, especially with fever or vomiting, can be appendicitis. A burst appendix is far more dangerous than an operated one.',
      actions: [
        'Go to an emergency department today, not tomorrow.',
        'Do not eat or drink anything — surgery may be needed.',
        'Do not take painkillers before being examined; they mask the signs a surgeon looks for.',
      ],
      treatmentKey: 'appendicitis',
      specialty: 'gastroenterology',
      askYourself: [
        'Did the pain start near the navel and move to the lower right?',
        'Does it hurt more when you release pressure than when you press?',
        'Is there fever, vomiting or an inability to pass gas?',
      ],
    },
  },
  {
    severity: 'amber',
    any: ['pregnant', 'pregnancy', 'labour', 'bleeding pregnancy', 'contractions'],
    result: {
      headline: 'In pregnancy, bleeding or severe pain is never "wait and see".',
      reasoning:
        'Bleeding, severe headache, blurred vision, swelling or reduced baby movement all need same-day assessment. Most turn out fine, and the ones that do not need speed.',
      actions: [
        'Call your obstetrician now, or go to a maternity emergency.',
        'Call 102 — the free ambulance for maternity and newborn transport.',
        'Carry your antenatal card and any recent scans.',
      ],
      treatmentKey: 'high-risk-delivery',
      specialty: 'maternity',
      askYourself: [
        'Is there any bleeding, or fluid leaking?',
        'Have you felt the baby move in the last two hours?',
        'Any severe headache, blurred vision, or sudden swelling?',
      ],
    },
  },
  {
    severity: 'amber',
    any: ['head injury', 'hit my head', 'fell down', 'vomiting after', 'head hurt'],
    result: {
      headline: 'A head injury with vomiting or drowsiness needs a scan.',
      reasoning:
        'Bleeding inside the skull can take hours to show. Repeated vomiting, worsening headache, confusion or unequal pupils are the signs that matter.',
      actions: [
        'Go to an emergency department with a CT scanner today.',
        'Do not let the person sleep unobserved for the next 12 hours.',
        'Tell the doctor if they are on blood thinners — this changes everything.',
      ],
      treatmentKey: 'polytrauma',
      specialty: 'emergency',
      askYourself: [
        'Was there any loss of consciousness, even briefly?',
        'Has there been repeated vomiting since the injury?',
        'Is the headache getting worse rather than better?',
      ],
    },
  },
  {
    severity: 'amber',
    any: ['diabetes', 'sugar high', 'sugar low', 'hba1c', 'diabetic'],
    result: {
      headline: 'Let us look at the numbers rather than the feeling.',
      reasoning:
        'Diabetes is managed by trends, not single readings. Very high sugars with vomiting and deep breathing, or lows under 70 mg/dL with confusion, are the two situations that cannot wait.',
      actions: [
        'If sugar is above 300 mg/dL with vomiting or drowsiness, go to an emergency department.',
        'If below 70 mg/dL, take 15 g of fast sugar now — glucose, juice, or three teaspoons of sugar — and re-check in 15 minutes.',
        'Otherwise, book a review with your physician and carry your last three months of readings.',
      ],
      treatmentKey: 'diabetes-care',
      specialty: 'nephrology',
      askYourself: [
        'What was the last reading and when was it taken?',
        'Any vomiting, deep rapid breathing, or a fruity smell on the breath?',
        'Have you missed insulin or medication doses recently?',
      ],
    },
  },
]

const GENERAL: TriageResult = {
  severity: 'green',
  headline: 'Tell me a bit more and I can be more specific.',
  reasoning:
    'I could not match that to a pattern I recognise. The more concrete you are — what hurts, since when, how bad out of ten, what makes it worse — the more useful my answer will be.',
  actions: [
    'Describe when it started and whether it is getting better or worse.',
    'Mention any fever, breathlessness, bleeding, or loss of consciousness.',
    'List medicines you take and any conditions you already have.',
  ],
  askYourself: [
    'When exactly did this start?',
    'What makes it better or worse?',
    'Has anything like this happened before?',
  ],
}

/** Red-flag terms checked on every message regardless of rule matching. */
const HARD_RED = [
  'not breathing', 'no pulse', 'unconscious', 'cardiac arrest',
  'suicidal', 'kill myself',
]

export function runTriage(message: string): TriageResult {
  const text = message.toLowerCase()

  // Severity order is load-bearing: red rules are evaluated before amber.
  for (const severity of ['red', 'amber', 'green'] as const) {
    for (const rule of RULES) {
      if (rule.severity !== severity) continue
      const anyHit = rule.any?.some((term) => text.includes(term)) ?? false
      const allHit = rule.all?.every((group) => group.some((term) => text.includes(term))) ?? false
      if (anyHit || allHit) {
        return { severity: rule.severity, ...rule.result }
      }
    }
  }

  if (HARD_RED.some((t) => text.includes(t))) {
    return { ...GENERAL, severity: 'red', headline: 'Call 112 now. This cannot wait for a chat.' }
  }

  return GENERAL
}
