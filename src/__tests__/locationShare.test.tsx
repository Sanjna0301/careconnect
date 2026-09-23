/**
 * Regression test for the "share my location" path.
 *
 * The bug this guards: `request()` used to return void, so callers did
 *   await request(); point = coords
 * and read `coords` from the stale render closure — which is still null.
 * The result was that the FIRST tap on "Share Location" always failed with
 * "turn on location", even when the browser had just granted permission.
 * That is the emergency path, so it matters more than most.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AnnouncerProvider } from '@/components/ui/Announcer'
import { LocationProvider } from '@/store/location'
import { QuickActions } from '@/components/layout/QuickActions'

const COORDS = { latitude: 12.9716, longitude: 77.5946 }

function mountGeolocation(behaviour: 'grant' | 'deny') {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (ok: (p: unknown) => void, fail: (e: unknown) => void) => {
        if (behaviour === 'grant') ok({ coords: COORDS })
        else fail({ code: 1, message: 'denied' })
      },
    },
  })
}

let written: string[] = []

/**
 * MUST be called AFTER userEvent.setup(), which installs its own
 * navigator.clipboard stub and would otherwise clobber this one.
 */
function mountClipboard() {
  written = []
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: mock(async (text: string) => { written.push(text) }) },
  })
  // Force the clipboard branch rather than the native share sheet.
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
}

function Harness() {
  return (
    <MemoryRouter>
      <AnnouncerProvider>
        <LocationProvider>
          <QuickActions />
        </LocationProvider>
      </AnnouncerProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('share location', () => {
  test('the FIRST tap shares, without needing a second one', async () => {
    mountGeolocation('grant')
    const user = userEvent.setup()
    mountClipboard()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /share location/i }))

    await waitFor(() => {
      expect(written).toHaveLength(1)
    })
    expect(written[0]).toContain('12.9716')
    expect(written[0]).toContain('77.5946')
    expect(screen.queryAllByText(/turn on location/i)).toHaveLength(0)
  })

  test('a denied permission explains itself instead of failing silently', async () => {
    mountGeolocation('deny')
    const user = userEvent.setup()
    mountClipboard()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /share location/i }))

    // The announcer renders each message twice on purpose: once in the
    // visible toast and once in an ARIA live region for screen readers.
    const notices = await screen.findAllByText(/turn on location/i)
    expect(notices.length).toBeGreaterThan(0)
    expect(written).toHaveLength(0)
  })

  test('the shared message carries a usable maps link', async () => {
    mountGeolocation('grant')
    const user = userEvent.setup()
    mountClipboard()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /share location/i }))
    await waitFor(() => expect(written).toHaveLength(1))
    expect(written[0]).toContain('https://maps.google.com/?q=')
  })
})
