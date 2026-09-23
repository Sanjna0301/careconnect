import type { Coords } from '@/lib/geo'

/** Approximate city centres, used when GPS is unavailable or denied. */
export const CITY_CENTRES: Record<string, Coords> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
  Gurugram: { lat: 28.4595, lng: 77.0266 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
}
