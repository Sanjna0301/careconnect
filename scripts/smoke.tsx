/**
 * Route smoke test.
 *
 * Renders every route to a string and fails on any thrown error. This does
 * not replace a browser — effects and event handlers never run here — but it
 * catches the large class of crashes that a type-check cannot: bad lookups,
 * undefined destructuring, missing providers, broken route params.
 */

// --- Minimal browser shims, installed before any app module is imported. ---
const store = new Map<string, string>()

const shim = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
  matchMedia: () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
  location: { href: 'http://localhost/' },
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  requestAnimationFrame: (cb: FrameRequestCallback) => globalThis.setTimeout(() => cb(0), 0),
  cancelAnimationFrame: (id: number) => globalThis.clearTimeout(id),
  speechSynthesis: undefined,
}

Object.assign(globalThis, {
  window: shim,
  localStorage: shim.localStorage,
  navigator: { share: undefined, clipboard: undefined, geolocation: undefined, userAgent: 'smoke' },
  document: {
    getElementById: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { style: {} },
    activeElement: null,
  },
})

const { renderToString } = await import('react-dom/server')
const { StaticRouter } = await import('react-router')
const React = (await import('react')).default

const { AnnouncerProvider } = await import('../src/components/ui/Announcer')
const { LocationProvider } = await import('../src/store/location')
const { WalletProvider } = await import('../src/store/walletContext')
const { CampaignsProvider } = await import('../src/store/campaignsContext')
const { AppShell } = await import('../src/components/layout/AppShell')
const { Routes, Route } = await import('react-router')

const { Home } = await import('../src/pages/Home')
const { Hospitals } = await import('../src/pages/Hospitals')
const { Assistant } = await import('../src/pages/Assistant')
const { Fundraisers } = await import('../src/pages/Fundraisers')
const { FundraiserDetail } = await import('../src/pages/FundraiserDetail')
const { CampaignCreate } = await import('../src/pages/CampaignCreate')
const { HeroPortal } = await import('../src/pages/HeroPortal')
const { WalletPage } = await import('../src/pages/WalletPage')
const { FirstAid } = await import('../src/pages/FirstAid')
const { Contacts } = await import('../src/pages/Contacts')
const { NotFound } = await import('../src/pages/NotFound')

const ROUTES = [
  '/',
  '/hospitals',
  '/hospitals?t=heart-attack',
  '/hospitals?emergency=1',
  '/assistant',
  '/fundraisers',
  '/fundraisers/start',
  '/fundraisers/start?hospital=h-blr-01&t=bypass',
  '/fundraisers/start?hospital=nope&t=nope',
  '/fundraisers/c-001',
  '/fundraisers/c-005',
  '/fundraisers/does-not-exist',
  '/hero',
  '/wallet',
  '/first-aid',
  '/contacts',
  '/totally-unknown-path',
]

const h = React.createElement

function tree(path: string) {
  return h(
    StaticRouter as never,
    { location: path },
    h(
      AnnouncerProvider as never,
      null,
      h(
        LocationProvider as never,
        null,
        h(
          WalletProvider as never,
          null,
          h(
          CampaignsProvider as never,
          null,
          h(
            Routes as never,
            null,
            h(Route as never, { element: h(AppShell as never, null) }, [
              h(Route as never, { key: 'i', index: true, element: h(Home as never, null) }),
              h(Route as never, { key: 'h', path: 'hospitals', element: h(Hospitals as never, null) }),
              h(Route as never, { key: 'a', path: 'assistant', element: h(Assistant as never, null) }),
              h(Route as never, { key: 'f', path: 'fundraisers', element: h(Fundraisers as never, null) }),
              h(Route as never, { key: 'fs', path: 'fundraisers/start', element: h(CampaignCreate as never, null) }),
              h(Route as never, { key: 'fd', path: 'fundraisers/:id', element: h(FundraiserDetail as never, null) }),
              h(Route as never, { key: 'hp', path: 'hero', element: h(HeroPortal as never, null) }),
              h(Route as never, { key: 'w', path: 'wallet', element: h(WalletPage as never, null) }),
              h(Route as never, { key: 'fa', path: 'first-aid', element: h(FirstAid as never, null) }),
              h(Route as never, { key: 'c', path: 'contacts', element: h(Contacts as never, null) }),
              h(Route as never, { key: 'nf', path: '*', element: h(NotFound as never, null) }),
            ]),
          ),
          ),
        ),
      ),
    ),
  )
}

let failures = 0

for (const route of ROUTES) {
  try {
    const html = renderToString(tree(route))
    if (html.length < 500) {
      console.log(`  ✗ ${route.padEnd(32)} rendered only ${html.length} chars`)
      failures++
    } else {
      console.log(`  ✓ ${route.padEnd(32)} ${html.length.toLocaleString()} chars`)
    }
  } catch (err) {
    console.log(`  ✗ ${route.padEnd(32)} ${(err as Error).message}`)
    failures++
  }
}

console.log(
  failures === 0
    ? `\nAll ${ROUTES.length} routes rendered without error.`
    : `\n${failures} of ${ROUTES.length} routes FAILED.`,
)

process.exit(failures === 0 ? 0 : 1)
