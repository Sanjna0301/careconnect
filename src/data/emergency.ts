/**
 * Real Indian national helplines. These are verified public numbers and are
 * the only phone numbers in the app that dial a genuine service.
 */
export type Helpline = {
  number: string
  label: string
  detail: string
  /** Primary numbers get the red treatment. */
  primary?: boolean
}

export const HELPLINES: Helpline[] = [
  { number: '112', label: 'All-in-one Emergency', detail: 'Police, fire, ambulance — one number, works nationwide', primary: true },
  { number: '108', label: 'Ambulance', detail: 'Free emergency ambulance in most states', primary: true },
  { number: '102', label: 'Ambulance (Maternity & Child)', detail: 'Pregnancy, newborn and child transport' },
  { number: '1098', label: 'Child Helpline', detail: 'Children in distress or danger' },
  { number: '14416', label: 'Tele-MANAS', detail: 'Free 24×7 mental health support' },
  { number: '1091', label: "Women's Helpline", detail: 'Women in distress' },
  { number: '104', label: 'Health Advice', detail: 'Free medical advice from a doctor on call' },
  { number: '1075', label: 'National Health Helpline', detail: 'Public health information and guidance' },
]

export const PRIMARY_HELPLINE = HELPLINES[0]
export const AMBULANCE_HELPLINE = HELPLINES[1]
