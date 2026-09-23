/**
 * Lab-report reader.
 *
 * Pulls recognised analytes out of pasted or uploaded report text, compares
 * them against adult reference ranges, and explains each one in plain words.
 * This is real parsing on real numbers — it is not a simulated summary.
 *
 * Reference ranges are the widely-used adult ranges Indian labs print on
 * their own reports. They are NOT universal: paediatric, pregnancy and
 * lab-specific ranges differ, which is why every output repeats that the
 * printed range on the user's own report is the one that counts.
 */

export type Analyte = {
  key: string
  label: string
  unit: string
  low: number
  high: number
  /** Regexes that find the value on a report line. */
  patterns: RegExp[]
  meansLow: string
  meansHigh: string
  meansNormal: string
  /** Value beyond which this needs same-day attention. */
  criticalLow?: number
  criticalHigh?: number
}

export const ANALYTES: Analyte[] = [
  {
    key: 'hb', label: 'Haemoglobin', unit: 'g/dL', low: 12, high: 17,
    patterns: [/\b(?:ha?emoglobin|hb|hgb)\b[^0-9\-]{0,24}(\d{1,2}(?:\.\d{1,2})?)/i],
    meansLow: 'Low haemoglobin means anaemia — fewer red cells carrying oxygen. It explains tiredness, breathlessness on stairs and pale skin. The important question is why: iron deficiency, blood loss or a chronic illness.',
    meansHigh: 'Higher than usual. Often just dehydration, but sometimes smoking, living at altitude, or a lung or bone-marrow condition.',
    meansNormal: 'In the normal range — your blood is carrying oxygen as it should.',
    criticalLow: 7,
  },
  {
    key: 'wbc', label: 'White Blood Cells (WBC / TLC)', unit: 'cells/µL', low: 4000, high: 11000,
    patterns: [/\b(?:wbc|tlc|total leu[ck]ocyte count|leu[ck]ocyte count)\b[^0-9\-]{0,28}(\d{3,6}(?:\.\d+)?)/i],
    meansLow: 'A low white count means fewer infection-fighting cells. It can follow a viral illness or certain medicines, but it does make infections more likely.',
    meansHigh: 'A raised white count usually means your body is fighting an infection. It also rises with stress, steroids and inflammation.',
    meansNormal: 'Normal — no sign here of an active infection or a marrow problem.',
    criticalHigh: 30000,
    criticalLow: 2000,
  },
  {
    key: 'platelets', label: 'Platelets', unit: '/µL', low: 150000, high: 450000,
    patterns: [/\b(?:platelet(?:s)?(?: count)?|plt)\b[^0-9\-]{0,28}(\d{4,7}(?:\.\d+)?)/i],
    meansLow: 'Platelets help blood clot. A falling count matters most in dengue, where it is tracked daily. Below 20,000 there is a real bleeding risk.',
    meansHigh: 'Raised platelets follow infection, inflammation or iron deficiency, and occasionally a marrow condition.',
    meansNormal: 'Normal — your blood is clotting as expected.',
    criticalLow: 50000,
  },
  {
    key: 'creatinine', label: 'Serum Creatinine', unit: 'mg/dL', low: 0.6, high: 1.3,
    patterns: [/\b(?:s\.?\s*)?creatinine\b[^0-9\-]{0,24}(\d{1,2}(?:\.\d{1,2})?)/i],
    meansLow: 'Below range, which is usually unremarkable — it tracks muscle mass as much as kidney function.',
    meansHigh: 'Raised creatinine means the kidneys are clearing waste less efficiently. Dehydration and some painkillers raise it temporarily; a persistent rise needs a nephrologist.',
    meansNormal: 'Normal — your kidneys are filtering as expected.',
    criticalHigh: 2.5,
  },
  {
    key: 'hba1c', label: 'HbA1c', unit: '%', low: 4, high: 5.6,
    patterns: [/\bhba1c\b[^0-9\-]{0,28}(\d{1,2}(?:\.\d{1,2})?)/i, /glycated ha?emoglobin[^0-9\-]{0,24}(\d{1,2}(?:\.\d{1,2})?)/i],
    meansLow: 'Below the usual range. Worth mentioning if you take diabetes medication, as it can mean doses are too high.',
    meansHigh: '5.7–6.4% is prediabetes; 6.5% and above meets the threshold for diabetes. This number reflects your average sugar over about three months, so it cannot be fixed by fasting the day before.',
    meansNormal: 'Normal — your average blood sugar over the last three months is in the healthy range.',
    criticalHigh: 9,
  },
  {
    key: 'glucose', label: 'Fasting Blood Sugar', unit: 'mg/dL', low: 70, high: 100,
    patterns: [/\b(?:fasting (?:blood )?(?:sugar|glucose)|fbs|glucose fasting)\b[^0-9\-]{0,28}(\d{2,3}(?:\.\d+)?)/i],
    meansLow: 'Below 70 mg/dL is hypoglycaemia. If you felt shaky, sweaty or confused, treat it with fast sugar and tell your doctor.',
    meansHigh: '100–125 mg/dL is prediabetes; 126 mg/dL and above on two occasions meets the threshold for diabetes.',
    meansNormal: 'Normal fasting sugar.',
    criticalHigh: 250,
    criticalLow: 55,
  },
  {
    key: 'tsh', label: 'TSH (Thyroid)', unit: 'µIU/mL', low: 0.4, high: 4.5,
    patterns: [/\btsh\b[^0-9\-]{0,28}(\d{1,3}(?:\.\d{1,3})?)/i],
    meansLow: 'A low TSH points towards an overactive thyroid — weight loss, palpitations, heat intolerance, anxiety.',
    meansHigh: 'A high TSH points towards an underactive thyroid — fatigue, weight gain, cold intolerance, dry skin. Very common and very treatable.',
    meansNormal: 'Normal thyroid function on this test.',
  },
  {
    key: 'bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', low: 0.1, high: 1.2,
    patterns: [/\b(?:total )?bilirubin\b[^0-9\-]{0,28}(\d{1,2}(?:\.\d{1,2})?)/i],
    meansLow: 'Normal-to-low, which is not a concern.',
    meansHigh: 'Raised bilirubin is what causes yellowing of the eyes and skin. Causes range from harmless (Gilbert syndrome) to liver or gallbladder disease.',
    meansNormal: 'Normal — no sign of jaundice on this value.',
    criticalHigh: 5,
  },
  {
    key: 'sgpt', label: 'SGPT / ALT (Liver)', unit: 'U/L', low: 7, high: 56,
    patterns: [/\b(?:sgpt|alt)\b[^0-9\-]{0,28}(\d{1,4}(?:\.\d+)?)/i],
    meansLow: 'Within or below range — no sign of liver cell injury.',
    meansHigh: 'Raised ALT means liver cells are inflamed. Fatty liver is the commonest cause in India; alcohol, viral hepatitis and some medicines also do it.',
    meansNormal: 'Normal — no sign of liver inflammation.',
    criticalHigh: 300,
  },
  {
    key: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', low: 100, high: 200,
    patterns: [/\btotal cholesterol\b[^0-9\-]{0,28}(\d{2,3}(?:\.\d+)?)/i],
    meansLow: 'Below the usual range, which is generally not a concern by itself.',
    meansHigh: 'Above 200 mg/dL raises long-term heart risk. What matters more is the LDL number and your overall risk, not this figure alone.',
    meansNormal: 'Normal total cholesterol.',
  },
  {
    key: 'vitd', label: 'Vitamin D', unit: 'ng/mL', low: 30, high: 100,
    patterns: [/\bvitamin\s*d3?\b[^0-9\-]{0,32}(\d{1,3}(?:\.\d{1,2})?)/i, /\b25[\s-]?oh[\s-]?vitamin\s*d\b[^0-9\-]{0,28}(\d{1,3}(?:\.\d{1,2})?)/i],
    meansLow: 'Deficiency is extremely common in India, even in sunny cities. It causes bone and muscle aches and tiredness, and is corrected with supplements.',
    meansHigh: 'Above the usual range, typically from high-dose supplements. Worth reviewing the dose with your doctor.',
    meansNormal: 'Sufficient vitamin D.',
  },
]

export type Finding = {
  analyte: Analyte
  value: number
  status: 'low' | 'normal' | 'high'
  critical: boolean
  explanation: string
}

export type ReportSummary = {
  findings: Finding[]
  /** Values the parser saw but could not identify. */
  unrecognisedLines: number
  urgent: Finding[]
  abnormal: Finding[]
}

export function parseReport(text: string): ReportSummary {
  const findings: Finding[] = []
  const seen = new Set<string>()

  for (const analyte of ANALYTES) {
    if (seen.has(analyte.key)) continue
    for (const pattern of analyte.patterns) {
      const match = text.match(pattern)
      if (!match) continue
      const value = Number.parseFloat(match[1])
      if (!Number.isFinite(value)) continue

      const status = value < analyte.low ? 'low' : value > analyte.high ? 'high' : 'normal'
      const critical =
        (analyte.criticalLow !== undefined && value <= analyte.criticalLow) ||
        (analyte.criticalHigh !== undefined && value >= analyte.criticalHigh)

      findings.push({
        analyte,
        value,
        status,
        critical,
        explanation:
          status === 'low' ? analyte.meansLow
          : status === 'high' ? analyte.meansHigh
          : analyte.meansNormal,
      })
      seen.add(analyte.key)
      break
    }
  }

  // Count numeric lines we did not claim, so the UI can be honest about coverage.
  const numericLines = text
    .split(/\r?\n/)
    .filter((l) => /\d/.test(l) && /[a-z]{3,}/i.test(l)).length

  return {
    findings,
    unrecognisedLines: Math.max(0, numericLines - findings.length),
    urgent: findings.filter((f) => f.critical),
    abnormal: findings.filter((f) => f.status !== 'normal' && !f.critical),
  }
}

/** Text extraction that works client-side without a PDF library. */
export async function extractText(file: File): Promise<{ text: string; extracted: boolean }> {
  const isTextual =
    file.type.startsWith('text/') ||
    /\.(txt|csv|tsv|json|md|log)$/i.test(file.name)

  if (isTextual) {
    return { text: await file.text(), extracted: true }
  }

  // PDFs and images need OCR or a PDF parser, which belong server-side.
  return { text: '', extracted: false }
}
