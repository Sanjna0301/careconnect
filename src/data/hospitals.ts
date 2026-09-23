import type { Specialty, Treatment } from './treatments'

/**
 * SEED DATA — hospital names here are fictional.
 *
 * Attaching invented costs, bed counts and ratings to a real, named
 * institution would misinform patients, so the directory ships with
 * realistic placeholders. Swap `HOSPITALS` for a live source before
 * launch: Google Places / Ayushman Bharat HFR / a partner-hospital API.
 * The shape below is what the UI contracts against.
 */

export type PriceTier = 'budget' | 'standard' | 'premium'
export type OwnershipType = 'government' | 'trust' | 'private'

export type Hospital = {
  id: string
  name: string
  area: string
  city: string
  state: string
  lat: number
  lng: number
  tier: PriceTier
  ownership: OwnershipType
  /** 0–5, one decimal. */
  rating: number
  reviews: number
  beds: number
  icuBeds: number
  /** Live-ish ICU occupancy, 0–1. Drives the "beds free" chip. */
  occupancy: number
  emergency24x7: boolean
  ambulance: boolean
  bloodBank: boolean
  traumaCentre: boolean
  accreditation: Array<'NABH' | 'JCI' | 'NABL'>
  schemes: string[]
  insurers: string[]
  specialties: Specialty[]
  /** Treatment keys the hospital does NOT offer despite having the specialty. */
  notOffered?: string[]
  /** National reputation rank for a specialty — powers "Best in India". */
  nationalRank?: Partial<Record<Specialty, number>>
  /** Placeholder. Only the national emergency numbers in data/emergency.ts are real. */
  phone: string
  partner: boolean
}

/** City cost index relative to the national reference band. */
export const CITY_INDEX: Record<string, number> = {
  Mumbai: 1.25, Delhi: 1.18, Gurugram: 1.22, Bengaluru: 1.15, Chennai: 1.05,
  Hyderabad: 1.02, Pune: 1.05, Kolkata: 0.92, Ahmedabad: 0.9, Jaipur: 0.85,
  Lucknow: 0.82, Chandigarh: 0.88, Kochi: 0.9, Indore: 0.8, Bhopal: 0.78,
  Patna: 0.75, Guwahati: 0.8, Nagpur: 0.82, Visakhapatnam: 0.85, Coimbatore: 0.88,
}

const TIER_MULTIPLIER: Record<PriceTier, number> = {
  budget: 0.55,
  standard: 0.9,
  premium: 1.45,
}

/** Quoted band for a treatment at a given hospital, in INR. */
export function costFor(h: Hospital, t: Treatment): { min: number; max: number } {
  const factor = TIER_MULTIPLIER[h.tier] * (CITY_INDEX[h.city] ?? 1)
  // Government hospitals under national schemes cost the patient far less.
  const subsidy = h.ownership === 'government' ? 0.25 : h.ownership === 'trust' ? 0.7 : 1
  const round = (n: number) => {
    const value = n * factor * subsidy
    // Step scales with magnitude: a ₹1,500 dialysis session must not round
    // to zero the way a flat ₹500 step would.
    const step = value < 5000 ? 50 : value < 50_000 ? 500 : 1000
    return Math.max(step, Math.round(value / step) * step)
  }
  return { min: round(t.baseMin), max: round(t.baseMax) }
}

export function offersTreatment(h: Hospital, t: Treatment): boolean {
  if (h.notOffered?.includes(t.key)) return false
  return h.specialties.includes(t.specialty)
}

export function icuBedsFree(h: Hospital): number {
  return Math.max(0, Math.round(h.icuBeds * (1 - h.occupancy)))
}

export const HOSPITALS: Hospital[] = [
  // ---------------- Delhi NCR ----------------
  { id: 'h-del-01', name: 'Aarogya Institute of Medical Sciences', area: 'Saket', city: 'Delhi', state: 'Delhi',
    lat: 28.5245, lng: 77.2066, tier: 'premium', ownership: 'private', rating: 4.7, reviews: 8421,
    beds: 710, icuBeds: 128, occupancy: 0.78, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['CGHS', 'ECHS'], insurers: ['Star Health', 'HDFC Ergo', 'Niva Bupa', 'ICICI Lombard'],
    specialties: ['emergency', 'cardiology', 'neurology', 'oncology', 'orthopaedics', 'transplant', 'nephrology', 'pulmonology'],
    nationalRank: { cardiology: 2, transplant: 3 }, phone: '1800-000-1101', partner: true },

  { id: 'h-del-02', name: 'Rajdhani Government General Hospital', area: 'Karol Bagh', city: 'Delhi', state: 'Delhi',
    lat: 28.6519, lng: 77.1909, tier: 'budget', ownership: 'government', rating: 4.0, reviews: 12980,
    beds: 1450, icuBeds: 190, occupancy: 0.91, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'CGHS', 'State Scheme'], insurers: ['All government schemes'],
    specialties: ['emergency', 'orthopaedics', 'maternity', 'paediatrics', 'burns', 'pulmonology', 'gastroenterology', 'neurology'],
    nationalRank: { emergency: 4, burns: 2 }, phone: '1800-000-1102', partner: true },

  { id: 'h-del-03', name: 'Sanjeevani Heart & Vascular Institute', area: 'Dwarka', city: 'Delhi', state: 'Delhi',
    lat: 28.5921, lng: 77.0460, tier: 'standard', ownership: 'private', rating: 4.5, reviews: 3140,
    beds: 280, icuBeds: 64, occupancy: 0.62, emergency24x7: true, ambulance: true, bloodBank: false, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat', 'CGHS'], insurers: ['Star Health', 'Care Health', 'Niva Bupa'],
    specialties: ['cardiology', 'emergency', 'pulmonology'],
    nationalRank: { cardiology: 7 }, phone: '1800-000-1103', partner: true },

  { id: 'h-del-04', name: 'Shanti Seva Trust Hospital', area: 'Rohini', city: 'Delhi', state: 'Delhi',
    lat: 28.7365, lng: 77.1174, tier: 'budget', ownership: 'trust', rating: 4.2, reviews: 2210,
    beds: 320, icuBeds: 40, occupancy: 0.7, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat', 'State Scheme'], insurers: ['Star Health', 'New India Assurance'],
    specialties: ['emergency', 'maternity', 'paediatrics', 'ophthalmology', 'gastroenterology', 'orthopaedics'],
    phone: '1800-000-1104', partner: true },

  { id: 'h-ggn-01', name: 'Medanta Vista Superspeciality', area: 'Sector 44', city: 'Gurugram', state: 'Haryana',
    lat: 28.4482, lng: 77.0729, tier: 'premium', ownership: 'private', rating: 4.8, reviews: 6740,
    beds: 620, icuBeds: 140, occupancy: 0.74, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['CGHS'], insurers: ['HDFC Ergo', 'Niva Bupa', 'Tata AIG', 'Aditya Birla'],
    specialties: ['emergency', 'cardiology', 'neurology', 'oncology', 'transplant', 'orthopaedics', 'nephrology', 'burns'],
    nationalRank: { neurology: 1, oncology: 4 }, phone: '1800-000-1105', partner: false },

  // ---------------- Mumbai ----------------
  { id: 'h-mum-01', name: 'Sea Breeze Multispeciality Hospital', area: 'Andheri West', city: 'Mumbai', state: 'Maharashtra',
    lat: 19.1364, lng: 72.8296, tier: 'premium', ownership: 'private', rating: 4.6, reviews: 5320,
    beds: 480, icuBeds: 96, occupancy: 0.81, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['MJPJAY'], insurers: ['Star Health', 'ICICI Lombard', 'Bajaj Allianz'],
    specialties: ['emergency', 'cardiology', 'orthopaedics', 'maternity', 'paediatrics', 'neurology', 'gastroenterology'],
    nationalRank: { maternity: 3 }, phone: '1800-000-2101', partner: true },

  { id: 'h-mum-02', name: 'Mumbai Civic Trauma Centre', area: 'Parel', city: 'Mumbai', state: 'Maharashtra',
    lat: 19.0048, lng: 72.8410, tier: 'budget', ownership: 'government', rating: 4.1, reviews: 15600,
    beds: 1800, icuBeds: 220, occupancy: 0.94, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'MJPJAY'], insurers: ['All government schemes'],
    specialties: ['emergency', 'burns', 'orthopaedics', 'neurology', 'oncology', 'paediatrics', 'maternity', 'pulmonology'],
    nationalRank: { emergency: 1, oncology: 2 }, phone: '1800-000-2102', partner: true },

  { id: 'h-mum-03', name: 'Navjeevan Cancer Centre', area: 'Borivali', city: 'Mumbai', state: 'Maharashtra',
    lat: 19.2307, lng: 72.8567, tier: 'standard', ownership: 'trust', rating: 4.7, reviews: 4180,
    beds: 350, icuBeds: 52, occupancy: 0.68, emergency24x7: false, ambulance: true, bloodBank: true, traumaCentre: false,
    accreditation: ['NABH', 'NABL'], schemes: ['Ayushman Bharat', 'MJPJAY'], insurers: ['Star Health', 'Care Health'],
    specialties: ['oncology', 'nephrology', 'gastroenterology'],
    nationalRank: { oncology: 1 }, phone: '1800-000-2103', partner: true },

  { id: 'h-mum-04', name: 'Thane Lifeline Hospital', area: 'Thane West', city: 'Mumbai', state: 'Maharashtra',
    lat: 19.2183, lng: 72.9781, tier: 'standard', ownership: 'private', rating: 4.3, reviews: 2890,
    beds: 240, icuBeds: 44, occupancy: 0.59, emergency24x7: true, ambulance: true, bloodBank: false, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['MJPJAY'], insurers: ['Star Health', 'Niva Bupa', 'HDFC Ergo'],
    specialties: ['emergency', 'orthopaedics', 'maternity', 'paediatrics', 'pulmonology', 'psychiatry'],
    phone: '1800-000-2104', partner: false },

  // ---------------- Bengaluru ----------------
  { id: 'h-blr-01', name: 'Cauvery Advanced Medical Centre', area: 'Koramangala', city: 'Bengaluru', state: 'Karnataka',
    lat: 12.9352, lng: 77.6245, tier: 'premium', ownership: 'private', rating: 4.7, reviews: 7120,
    beds: 540, icuBeds: 110, occupancy: 0.72, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['Ayushman Bharat'], insurers: ['Star Health', 'Niva Bupa', 'Aditya Birla', 'Tata AIG'],
    specialties: ['emergency', 'cardiology', 'neurology', 'orthopaedics', 'transplant', 'oncology', 'nephrology'],
    nationalRank: { orthopaedics: 2 }, phone: '1800-000-3101', partner: true },

  { id: 'h-blr-02', name: 'Vidyaranya Neuro & Spine Institute', area: 'Jayanagar', city: 'Bengaluru', state: 'Karnataka',
    lat: 12.9250, lng: 77.5938, tier: 'standard', ownership: 'trust', rating: 4.8, reviews: 5010,
    beds: 400, icuBeds: 80, occupancy: 0.77, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: false,
    accreditation: ['NABH', 'NABL'], schemes: ['Ayushman Bharat', 'State Scheme'], insurers: ['Star Health', 'Care Health'],
    specialties: ['neurology', 'orthopaedics', 'emergency', 'psychiatry'],
    nationalRank: { neurology: 2, psychiatry: 1 }, phone: '1800-000-3102', partner: true },

  { id: 'h-blr-03', name: 'Whitefield Community Hospital', area: 'Whitefield', city: 'Bengaluru', state: 'Karnataka',
    lat: 12.9698, lng: 77.7500, tier: 'budget', ownership: 'trust', rating: 4.1, reviews: 1830,
    beds: 180, icuBeds: 28, occupancy: 0.64, emergency24x7: true, ambulance: true, bloodBank: false, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat', 'State Scheme'], insurers: ['Star Health'],
    specialties: ['emergency', 'maternity', 'paediatrics', 'gastroenterology', 'ophthalmology'],
    phone: '1800-000-3103', partner: true },

  // ---------------- Chennai ----------------
  { id: 'h-chn-01', name: 'Marina Superspeciality Hospital', area: 'Adyar', city: 'Chennai', state: 'Tamil Nadu',
    lat: 13.0067, lng: 80.2570, tier: 'premium', ownership: 'private', rating: 4.8, reviews: 9240,
    beds: 660, icuBeds: 130, occupancy: 0.7, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['CMCHIS'], insurers: ['Star Health', 'ICICI Lombard', 'HDFC Ergo'],
    specialties: ['emergency', 'cardiology', 'transplant', 'nephrology', 'oncology', 'neurology', 'orthopaedics'],
    nationalRank: { cardiology: 1, transplant: 1 }, phone: '1800-000-4101', partner: true },

  { id: 'h-chn-02', name: 'Kaveri Government Medical College Hospital', area: 'Egmore', city: 'Chennai', state: 'Tamil Nadu',
    lat: 13.0732, lng: 80.2609, tier: 'budget', ownership: 'government', rating: 4.2, reviews: 11200,
    beds: 1600, icuBeds: 200, occupancy: 0.88, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'CMCHIS'], insurers: ['All government schemes'],
    specialties: ['emergency', 'burns', 'maternity', 'paediatrics', 'orthopaedics', 'ophthalmology', 'pulmonology', 'psychiatry'],
    nationalRank: { burns: 1, maternity: 2 }, phone: '1800-000-4102', partner: true },

  { id: 'h-chn-03', name: 'Anna Nagar Child & Maternity Centre', area: 'Anna Nagar', city: 'Chennai', state: 'Tamil Nadu',
    lat: 13.0850, lng: 80.2101, tier: 'standard', ownership: 'private', rating: 4.5, reviews: 2470,
    beds: 160, icuBeds: 36, occupancy: 0.55, emergency24x7: true, ambulance: true, bloodBank: false, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['CMCHIS'], insurers: ['Star Health', 'Niva Bupa'],
    specialties: ['maternity', 'paediatrics', 'emergency'],
    nationalRank: { paediatrics: 4 }, phone: '1800-000-4103', partner: false },

  // ---------------- Hyderabad ----------------
  { id: 'h-hyd-01', name: 'Charminar Institute of Medical Sciences', area: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana',
    lat: 17.4126, lng: 78.4392, tier: 'premium', ownership: 'private', rating: 4.6, reviews: 6100,
    beds: 520, icuBeds: 104, occupancy: 0.73, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['Aarogyasri'], insurers: ['Star Health', 'Care Health', 'Bajaj Allianz'],
    specialties: ['emergency', 'cardiology', 'oncology', 'neurology', 'transplant', 'gastroenterology', 'orthopaedics'],
    nationalRank: { gastroenterology: 2 }, phone: '1800-000-5101', partner: true },

  { id: 'h-hyd-02', name: 'Deccan Kidney & Dialysis Centre', area: 'Kukatpally', city: 'Hyderabad', state: 'Telangana',
    lat: 17.4849, lng: 78.4138, tier: 'budget', ownership: 'trust', rating: 4.4, reviews: 1980,
    beds: 120, icuBeds: 24, occupancy: 0.6, emergency24x7: false, ambulance: false, bloodBank: false, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat', 'Aarogyasri'], insurers: ['Star Health'],
    specialties: ['nephrology', 'transplant'], notOffered: ['liver-transplant'],
    nationalRank: { nephrology: 3 }, phone: '1800-000-5102', partner: true },

  { id: 'h-hyd-03', name: 'Secunderabad General Hospital', area: 'Secunderabad', city: 'Hyderabad', state: 'Telangana',
    lat: 17.4399, lng: 78.4983, tier: 'budget', ownership: 'government', rating: 3.9, reviews: 8700,
    beds: 900, icuBeds: 110, occupancy: 0.9, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'Aarogyasri'], insurers: ['All government schemes'],
    specialties: ['emergency', 'orthopaedics', 'maternity', 'paediatrics', 'burns', 'pulmonology'],
    phone: '1800-000-5103', partner: true },

  // ---------------- Kolkata ----------------
  { id: 'h-kol-01', name: 'Hooghly Advanced Care Hospital', area: 'Salt Lake', city: 'Kolkata', state: 'West Bengal',
    lat: 22.5867, lng: 88.4173, tier: 'standard', ownership: 'private', rating: 4.4, reviews: 4320,
    beds: 380, icuBeds: 72, occupancy: 0.76, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH'], schemes: ['Swasthya Sathi'], insurers: ['Star Health', 'New India Assurance', 'Niva Bupa'],
    specialties: ['emergency', 'cardiology', 'neurology', 'orthopaedics', 'gastroenterology', 'nephrology'],
    phone: '1800-000-6101', partner: true },

  { id: 'h-kol-02', name: 'Bengal Presidency Medical College', area: 'College Street', city: 'Kolkata', state: 'West Bengal',
    lat: 22.5726, lng: 88.3639, tier: 'budget', ownership: 'government', rating: 4.0, reviews: 13400,
    beds: 1700, icuBeds: 180, occupancy: 0.92, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'Swasthya Sathi'], insurers: ['All government schemes'],
    specialties: ['emergency', 'burns', 'oncology', 'maternity', 'paediatrics', 'neurology', 'ophthalmology', 'psychiatry'],
    nationalRank: { emergency: 6 }, phone: '1800-000-6102', partner: true },

  // ---------------- Pune ----------------
  { id: 'h-pun-01', name: 'Sahyadri Crest Hospital', area: 'Kothrud', city: 'Pune', state: 'Maharashtra',
    lat: 18.5074, lng: 73.8077, tier: 'standard', ownership: 'private', rating: 4.5, reviews: 3610,
    beds: 300, icuBeds: 60, occupancy: 0.66, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH'], schemes: ['MJPJAY'], insurers: ['Star Health', 'HDFC Ergo', 'Tata AIG'],
    specialties: ['emergency', 'cardiology', 'orthopaedics', 'neurology', 'maternity', 'pulmonology'],
    phone: '1800-000-7101', partner: true },

  { id: 'h-pun-02', name: 'Pimpri Seva Sadan Trust Hospital', area: 'Pimpri', city: 'Pune', state: 'Maharashtra',
    lat: 18.6298, lng: 73.7997, tier: 'budget', ownership: 'trust', rating: 4.2, reviews: 2140,
    beds: 220, icuBeds: 32, occupancy: 0.71, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat', 'MJPJAY'], insurers: ['Star Health'],
    specialties: ['emergency', 'maternity', 'paediatrics', 'orthopaedics', 'ophthalmology', 'gastroenterology'],
    phone: '1800-000-7102', partner: true },

  // ---------------- Ahmedabad ----------------
  { id: 'h-amd-01', name: 'Sabarmati Institute of Cardiac Care', area: 'Navrangpura', city: 'Ahmedabad', state: 'Gujarat',
    lat: 23.0395, lng: 72.5609, tier: 'standard', ownership: 'trust', rating: 4.6, reviews: 5240,
    beds: 420, icuBeds: 90, occupancy: 0.74, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: false,
    accreditation: ['NABH', 'NABL'], schemes: ['Ayushman Bharat', 'MA Yojana'], insurers: ['Star Health', 'Care Health'],
    specialties: ['cardiology', 'emergency', 'pulmonology', 'nephrology'],
    nationalRank: { cardiology: 3 }, phone: '1800-000-8101', partner: true },

  { id: 'h-amd-02', name: 'Gujarat Civil Multispeciality Hospital', area: 'Asarwa', city: 'Ahmedabad', state: 'Gujarat',
    lat: 23.0545, lng: 72.6062, tier: 'budget', ownership: 'government', rating: 4.1, reviews: 9800,
    beds: 1900, icuBeds: 210, occupancy: 0.89, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'MA Yojana'], insurers: ['All government schemes'],
    specialties: ['emergency', 'burns', 'orthopaedics', 'maternity', 'paediatrics', 'oncology', 'neurology', 'transplant'],
    nationalRank: { emergency: 3 }, phone: '1800-000-8102', partner: true },

  // ---------------- Jaipur / Lucknow / Chandigarh ----------------
  { id: 'h-jai-01', name: 'Pink City Multispeciality Hospital', area: 'Malviya Nagar', city: 'Jaipur', state: 'Rajasthan',
    lat: 26.8535, lng: 75.8064, tier: 'standard', ownership: 'private', rating: 4.4, reviews: 2960,
    beds: 280, icuBeds: 54, occupancy: 0.68, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH'], schemes: ['Chiranjeevi', 'Ayushman Bharat'], insurers: ['Star Health', 'Niva Bupa'],
    specialties: ['emergency', 'cardiology', 'orthopaedics', 'maternity', 'paediatrics', 'gastroenterology'],
    phone: '1800-000-9101', partner: true },

  { id: 'h-luc-01', name: 'Awadh Institute of Medical Sciences', area: 'Gomti Nagar', city: 'Lucknow', state: 'Uttar Pradesh',
    lat: 26.8467, lng: 81.0060, tier: 'standard', ownership: 'government', rating: 4.3, reviews: 7420,
    beds: 1100, icuBeds: 160, occupancy: 0.85, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'NABL'], schemes: ['Ayushman Bharat', 'State Scheme'], insurers: ['All government schemes'],
    specialties: ['emergency', 'cardiology', 'neurology', 'oncology', 'transplant', 'nephrology', 'paediatrics', 'burns'],
    nationalRank: { nephrology: 1, oncology: 5 }, phone: '1800-000-9102', partner: true },

  { id: 'h-chd-01', name: 'Shivalik Postgraduate Medical Institute', area: 'Sector 12', city: 'Chandigarh', state: 'Chandigarh',
    lat: 30.7649, lng: 76.7752, tier: 'budget', ownership: 'government', rating: 4.6, reviews: 14200,
    beds: 2000, icuBeds: 240, occupancy: 0.9, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'NABL'], schemes: ['Ayushman Bharat', 'CGHS'], insurers: ['All government schemes'],
    specialties: ['emergency', 'cardiology', 'neurology', 'oncology', 'transplant', 'nephrology', 'burns', 'orthopaedics', 'paediatrics'],
    nationalRank: { emergency: 2, neurology: 3, transplant: 2 }, phone: '1800-000-9103', partner: true },

  // ---------------- South & East tier-2 ----------------
  { id: 'h-koc-01', name: 'Backwater Medical Centre', area: 'Kadavanthra', city: 'Kochi', state: 'Kerala',
    lat: 9.9673, lng: 76.2986, tier: 'standard', ownership: 'private', rating: 4.7, reviews: 3880,
    beds: 340, icuBeds: 66, occupancy: 0.63, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH', 'JCI'], schemes: ['KASP', 'Ayushman Bharat'], insurers: ['Star Health', 'Care Health', 'HDFC Ergo'],
    specialties: ['emergency', 'cardiology', 'neurology', 'orthopaedics', 'gastroenterology', 'transplant', 'ophthalmology'],
    nationalRank: { ophthalmology: 1 }, phone: '1800-000-1201', partner: true },

  { id: 'h-cbe-01', name: 'Kongu Speciality Hospital', area: 'RS Puram', city: 'Coimbatore', state: 'Tamil Nadu',
    lat: 11.0045, lng: 76.9497, tier: 'budget', ownership: 'trust', rating: 4.3, reviews: 2110,
    beds: 200, icuBeds: 36, occupancy: 0.61, emergency24x7: true, ambulance: true, bloodBank: false, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['CMCHIS', 'Ayushman Bharat'], insurers: ['Star Health'],
    specialties: ['emergency', 'orthopaedics', 'maternity', 'paediatrics', 'ophthalmology'],
    phone: '1800-000-1202', partner: true },

  { id: 'h-vtz-01', name: 'Bay City General Hospital', area: 'MVP Colony', city: 'Visakhapatnam', state: 'Andhra Pradesh',
    lat: 17.7400, lng: 83.3200, tier: 'budget', ownership: 'government', rating: 4.0, reviews: 5600,
    beds: 850, icuBeds: 96, occupancy: 0.87, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'Aarogyasri'], insurers: ['All government schemes'],
    specialties: ['emergency', 'orthopaedics', 'burns', 'maternity', 'paediatrics', 'pulmonology'],
    phone: '1800-000-1203', partner: false },

  { id: 'h-ngp-01', name: 'Orange City Superspeciality', area: 'Dharampeth', city: 'Nagpur', state: 'Maharashtra',
    lat: 21.1401, lng: 79.0680, tier: 'standard', ownership: 'private', rating: 4.4, reviews: 2380,
    beds: 260, icuBeds: 48, occupancy: 0.69, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH'], schemes: ['MJPJAY', 'Ayushman Bharat'], insurers: ['Star Health', 'Niva Bupa'],
    specialties: ['emergency', 'cardiology', 'neurology', 'orthopaedics', 'nephrology', 'gastroenterology'],
    phone: '1800-000-1204', partner: true },

  { id: 'h-idr-01', name: 'Malwa Care Hospital', area: 'Vijay Nagar', city: 'Indore', state: 'Madhya Pradesh',
    lat: 22.7533, lng: 75.8937, tier: 'budget', ownership: 'trust', rating: 4.2, reviews: 1740,
    beds: 190, icuBeds: 30, occupancy: 0.66, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: false,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat'], insurers: ['Star Health'],
    specialties: ['emergency', 'maternity', 'paediatrics', 'orthopaedics', 'gastroenterology', 'psychiatry'],
    phone: '1800-000-1205', partner: true },

  { id: 'h-pat-01', name: 'Magadh Medical College Hospital', area: 'Kankarbagh', city: 'Patna', state: 'Bihar',
    lat: 25.5941, lng: 85.1376, tier: 'budget', ownership: 'government', rating: 3.8, reviews: 9100,
    beds: 1300, icuBeds: 130, occupancy: 0.93, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat', 'State Scheme'], insurers: ['All government schemes'],
    specialties: ['emergency', 'orthopaedics', 'maternity', 'paediatrics', 'burns', 'pulmonology', 'gastroenterology'],
    phone: '1800-000-1206', partner: true },

  { id: 'h-ghy-01', name: 'Brahmaputra Regional Hospital', area: 'Six Mile', city: 'Guwahati', state: 'Assam',
    lat: 26.1330, lng: 91.8000, tier: 'standard', ownership: 'private', rating: 4.3, reviews: 1620,
    beds: 210, icuBeds: 38, occupancy: 0.72, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABH'], schemes: ['Ayushman Bharat', 'Atal Amrit'], insurers: ['Star Health', 'New India Assurance'],
    specialties: ['emergency', 'cardiology', 'orthopaedics', 'maternity', 'paediatrics', 'oncology'],
    phone: '1800-000-1207', partner: true },

  { id: 'h-bho-01', name: 'Bhojpal Institute of Health Sciences', area: 'MP Nagar', city: 'Bhopal', state: 'Madhya Pradesh',
    lat: 23.2333, lng: 77.4344, tier: 'budget', ownership: 'government', rating: 4.1, reviews: 6300,
    beds: 980, icuBeds: 120, occupancy: 0.86, emergency24x7: true, ambulance: true, bloodBank: true, traumaCentre: true,
    accreditation: ['NABL'], schemes: ['Ayushman Bharat'], insurers: ['All government schemes'],
    specialties: ['emergency', 'burns', 'orthopaedics', 'neurology', 'maternity', 'paediatrics', 'psychiatry'],
    nationalRank: { psychiatry: 3 }, phone: '1800-000-1208', partner: true },
]

export const CITIES = [...new Set(HOSPITALS.map((h) => h.city))].sort()

/** Hospitals with a national reputation rank for a specialty, best first. */
export function bestInIndia(specialty: Specialty, limit = 6): Hospital[] {
  return HOSPITALS.filter((h) => h.nationalRank?.[specialty] !== undefined)
    .sort((a, b) => (a.nationalRank![specialty]! - b.nationalRank![specialty]!))
    .slice(0, limit)
}
