import { useCallback, useState } from 'react'
import { Outlet, useLocation as useRouteLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { SosSheet } from './SosSheet'
import { Footer } from './Footer'

export function AppShell() {
  const [sosOpen, setSosOpen] = useState(false)
  const { pathname } = useRouteLocation()

  const openSos = useCallback(() => setSosOpen(true), [])
  const closeSos = useCallback(() => setSosOpen(false), [])

  // Client-side navigation does not reset scroll or move focus on its own.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-xl focus:bg-med-700 focus:px-4 focus:py-3 focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      <Header onSos={openSos} />

      {/* pb-28 reserves the bottom-nav strip so nothing hides behind it. */}
      <main id="main" tabIndex={-1} className="min-h-[60vh] pb-28 outline-none lg:pb-0">
        <Outlet context={{ openSos }} />
      </main>

      <Footer />
      <BottomNav onSos={openSos} />
      <SosSheet open={sosOpen} onClose={closeSos} />
    </>
  )
}
