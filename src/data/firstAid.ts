/**
 * First-aid guidance.
 *
 * Content is aligned with Indian Red Cross / AHA basic-life-support public
 * guidance. It is deliberately short: someone reading this has one hand free
 * and thirty seconds of attention. Every guide leads with the call-for-help
 * step, because bystander first aid buys time, it does not replace an
 * ambulance.
 */

export type FirstAidGuide = {
  key: string
  title: string
  icon: string
  /** Shown as a red banner above the steps. */
  callFirst: string
  steps: string[]
  never: string[]
}

export const FIRST_AID: FirstAidGuide[] = [
  {
    key: 'cpr',
    title: 'CPR — Not Breathing',
    icon: 'heart-pulse',
    callFirst: 'Call 112 now, then start compressions. Put the phone on speaker.',
    steps: [
      'Check response: tap the shoulders and shout. No response and no normal breathing means start CPR.',
      'Lay them flat on a firm surface. Kneel beside the chest.',
      'Place the heel of one hand on the centre of the chest, the other hand on top, fingers interlocked.',
      'Push hard and fast: 5–6 cm deep, about 100–120 pushes per minute. Let the chest come back up fully each time.',
      'Keep going without stopping until the ambulance arrives or the person starts breathing.',
      'If an AED is available, switch it on and follow its spoken instructions.',
    ],
    never: [
      'Do not stop to check the pulse repeatedly — it wastes time.',
      'Do not give water or food to an unconscious person.',
    ],
  },
  {
    key: 'bleeding',
    title: 'Severe Bleeding',
    icon: 'droplet',
    callFirst: 'Call 108 for an ambulance while you apply pressure.',
    steps: [
      'Press firmly on the wound with a clean cloth, both hands, full body weight if needed.',
      'Do not lift the cloth to look. If blood soaks through, add another cloth on top.',
      'Raise the injured limb above the level of the heart if there is no suspected fracture.',
      'Keep pressing until help arrives. Keep the person warm and lying down.',
      'If a limb is severed, wrap the part in clean cloth, place it in a sealed bag, and put that bag on ice — never directly on ice.',
    ],
    never: [
      'Do not apply a tourniquet unless trained and bleeding is uncontrollable.',
      'Do not remove an object stuck in the wound — press around it instead.',
    ],
  },
  {
    key: 'choking',
    title: 'Choking',
    icon: 'wind',
    callFirst: 'If they cannot cough, speak or breathe, call 112 and act immediately.',
    steps: [
      'Encourage them to cough if they still can. Coughing is more effective than anything you can do.',
      'If they cannot cough: give 5 sharp back blows between the shoulder blades with the heel of your hand, leaning them forward.',
      'If that fails: stand behind, make a fist above the navel, grasp it with the other hand and pull sharply inwards and upwards 5 times.',
      'Alternate 5 back blows and 5 abdominal thrusts until the object comes out.',
      'If they become unresponsive, start CPR.',
    ],
    never: [
      'Do not use abdominal thrusts on a baby under 1 year — use back blows and chest thrusts.',
      'Do not try to pull the object out with your fingers blindly.',
    ],
  },
  {
    key: 'burns',
    title: 'Burns & Scalds',
    icon: 'flame',
    callFirst: 'Call 112 for burns that are large, deep, on the face, hands, or genitals.',
    steps: [
      'Move the person away from the heat source. Stop the burning.',
      'Cool the burn under cool running water for a full 20 minutes. Not ice.',
      'Remove rings, watches and tight clothing near the burn before it swells — unless stuck to the skin.',
      'Cover loosely with cling film or a clean, non-fluffy cloth.',
      'Keep the rest of the body warm — long cooling can cause hypothermia, especially in children.',
    ],
    never: [
      'Never apply toothpaste, butter, oil, ink or haldi. They trap heat and cause infection.',
      'Never burst blisters.',
    ],
  },
  {
    key: 'stroke',
    title: 'Stroke — Act F.A.S.T.',
    icon: 'brain',
    callFirst: 'Call 112 the moment you suspect a stroke. Note the exact time symptoms started.',
    steps: [
      'FACE — ask them to smile. Does one side droop?',
      'ARMS — ask them to raise both arms. Does one drift down?',
      'SPEECH — ask them to repeat a simple sentence. Is it slurred or confused?',
      'TIME — if any of these are present, call an ambulance immediately.',
      'Lay them on their side with the head slightly raised. Loosen tight clothing.',
      'Tell the hospital the time symptoms began — clot-busting drugs only work within a few hours.',
    ],
    never: [
      'Do not give aspirin, food, water or any medicine — they may not be able to swallow.',
      'Do not drive them yourself if an ambulance is available; ambulances pre-alert the stroke unit.',
    ],
  },
  {
    key: 'seizure',
    title: 'Seizure / Fits',
    icon: 'activity',
    callFirst: 'Call 112 if the seizure lasts over 5 minutes, repeats, or the person is injured, pregnant or diabetic.',
    steps: [
      'Clear hard or sharp objects away from them. Do not move the person unless they are in danger.',
      'Cushion the head with something soft.',
      'Time the seizure from the start.',
      'Once the shaking stops, roll them onto their side (recovery position) to keep the airway clear.',
      'Stay with them and speak calmly until they are fully alert.',
    ],
    never: [
      'Never put anything in the mouth — they cannot swallow their tongue.',
      'Never hold them down or restrain their movements.',
    ],
  },
  {
    key: 'fracture',
    title: 'Fracture / Road Accident',
    icon: 'bone',
    callFirst: 'Call 108. Under the Good Samaritan law you cannot be harassed for helping.',
    steps: [
      'Check for danger to yourself first — traffic, fire, live wires. Do not become a second casualty.',
      'Do not move the person if there is any chance of a neck or spine injury, unless they are in immediate danger.',
      'Support the injured limb in the position you found it, using rolled cloth on both sides.',
      'Control any bleeding with firm pressure.',
      'Keep them warm, talking and still until the ambulance arrives.',
    ],
    never: [
      'Do not try to straighten a deformed limb.',
      'Do not give anything to eat or drink — surgery may be needed.',
    ],
  },
  {
    key: 'heart-attack',
    title: 'Heart Attack',
    icon: 'heart',
    callFirst: 'Call 112 immediately. Do not wait to "see if it passes".',
    steps: [
      'Sit them down, leaning back with knees bent. Loosen tight clothing.',
      'Keep them calm and still — exertion increases the damage.',
      'If they are conscious, not allergic and not bleeding, one 300 mg aspirin chewed slowly can help. Ask the 112 operator.',
      'If they have prescribed nitroglycerin, help them take it.',
      'If they stop responding and are not breathing normally, start CPR.',
    ],
    never: [
      'Do not let them drive themselves to a hospital.',
      'Do not give aspirin if they are allergic, bleeding, or under 16.',
    ],
  },
]

export const FIRST_AID_BY_KEY: Record<string, FirstAidGuide> = Object.fromEntries(
  FIRST_AID.map((g) => [g.key, g]),
)
