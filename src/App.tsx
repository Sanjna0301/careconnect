import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AnnouncerProvider } from '@/components/ui/Announcer'
import { LocationProvider } from '@/store/location'
import { WalletProvider } from '@/store/walletContext'
import { HospitalCardSkeleton } from '@/components/ui/Skeleton'
import { Home } from '@/pages/Home'

/**
 * Home ships in the main bundle because it is the page someone lands on
 * mid-emergency. Everything else is split, so the first paint stays small
 * on a 3G connection.
 */
const Hospitals = lazy(() => import('@/pages/Hospitals').then((m) => ({ default: m.Hospitals })))
const Assistant = lazy(() => import('@/pages/Assistant').then((m) => ({ default: m.Assistant })))
const Fundraisers = lazy(() => import('@/pages/Fundraisers').then((m) => ({ default: m.Fundraisers })))
const FundraiserDetail = lazy(() => import('@/pages/FundraiserDetail').then((m) => ({ default: m.FundraiserDetail })))
const HeroPortal = lazy(() => import('@/pages/HeroPortal').then((m) => ({ default: m.HeroPortal })))
const WalletPage = lazy(() => import('@/pages/WalletPage').then((m) => ({ default: m.WalletPage })))
const FirstAid = lazy(() => import('@/pages/FirstAid').then((m) => ({ default: m.FirstAid })))
const Contacts = lazy(() => import('@/pages/Contacts').then((m) => ({ default: m.Contacts })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

function PageFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <div className="shimmer h-8 w-56 rounded-lg" />
      <HospitalCardSkeleton />
      <HospitalCardSkeleton />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AnnouncerProvider>
        <LocationProvider>
          <WalletProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Home />} />
                <Route
                  path="hospitals"
                  element={<Suspense fallback={<PageFallback />}><Hospitals /></Suspense>}
                />
                <Route
                  path="assistant"
                  element={<Suspense fallback={<PageFallback />}><Assistant /></Suspense>}
                />
                <Route
                  path="fundraisers"
                  element={<Suspense fallback={<PageFallback />}><Fundraisers /></Suspense>}
                />
                <Route
                  path="fundraisers/:id"
                  element={<Suspense fallback={<PageFallback />}><FundraiserDetail /></Suspense>}
                />
                <Route
                  path="hero"
                  element={<Suspense fallback={<PageFallback />}><HeroPortal /></Suspense>}
                />
                <Route
                  path="wallet"
                  element={<Suspense fallback={<PageFallback />}><WalletPage /></Suspense>}
                />
                <Route
                  path="first-aid"
                  element={<Suspense fallback={<PageFallback />}><FirstAid /></Suspense>}
                />
                <Route
                  path="contacts"
                  element={<Suspense fallback={<PageFallback />}><Contacts /></Suspense>}
                />
                <Route
                  path="*"
                  element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>}
                />
              </Route>
            </Routes>
          </WalletProvider>
        </LocationProvider>
      </AnnouncerProvider>
    </BrowserRouter>
  )
}
