/**
 * End-to-end test of the search → "I cannot afford this" → campaign flow.
 *
 * This drives the real components through a real DOM: typing, clicking,
 * attaching files, navigating between routes. It is the closest thing to
 * opening the app in a browser that can run in CI.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AnnouncerProvider } from '@/components/ui/Announcer'
import { LocationProvider } from '@/store/location'
import { WalletProvider } from '@/store/walletContext'
import { CampaignsProvider } from '@/store/campaignsContext'
import { CampaignCreate } from '@/pages/CampaignCreate'
import { FundraiserDetail } from '@/pages/FundraiserDetail'
import { Fundraisers } from '@/pages/Fundraisers'
import { Hospitals } from '@/pages/Hospitals'

function App({ at }: { at: string }) {
  return (
    <MemoryRouter initialEntries={[at]}>
      <AnnouncerProvider>
        <LocationProvider>
          <WalletProvider>
            <CampaignsProvider>
              <Routes>
                <Route path="/hospitals" element={<Hospitals />} />
                <Route path="/fundraisers" element={<Fundraisers />} />
                <Route path="/fundraisers/start" element={<CampaignCreate />} />
                <Route path="/fundraisers/:id" element={<FundraiserDetail />} />
              </Routes>
            </CampaignsProvider>
          </WalletProvider>
        </LocationProvider>
      </AnnouncerProvider>
    </MemoryRouter>
  )
}

const STORY =
  'My mother was diagnosed with severe mitral stenosis in August after she collapsed at home. ' +
  'The cardiologist has said she needs a valve replacement within the next two months. ' +
  'We have already sold her jewellery and borrowed from relatives to pay for the angiography ' +
  'and the hospital stay so far, and we simply do not have the rest. She is the only person ' +
  'who looks after my younger brother while I work.'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

/** Walks the four-step wizard with valid input. */
async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
  // --- Step 1: treatment ---
  await user.type(screen.getByLabelText(/patient's full name/i), 'Lakshmi Ammal')
  await user.type(screen.getByLabelText(/^age/i), '61')
  await user.click(screen.getByRole('button', { name: /continue/i }))

  // --- Step 2: story ---
  await screen.findByRole('heading', { name: /tell people what happened/i })
  await user.type(screen.getByLabelText(/headline/i), 'Help my mother get her heart valve replaced')
  await user.type(screen.getByLabelText(/^your story/i), STORY)
  await user.click(screen.getByRole('button', { name: /continue/i }))

  // --- Step 3: documents ---
  await screen.findByRole('heading', { name: /attach the paperwork/i })
  const fileInput = screen.getByLabelText(/attach documents/i) as HTMLInputElement

  await user.upload(fileInput, new File(['estimate'], 'hospital-estimate.pdf', { type: 'application/pdf' }))

  await user.selectOptions(screen.getByLabelText(/what are you attaching next/i), 'identity')
  await user.upload(fileInput, new File(['id'], 'aadhaar.pdf', { type: 'application/pdf' }))

  await user.click(screen.getByRole('button', { name: /continue/i }))

  // --- Step 4: review ---
  await screen.findByRole('heading', { name: /check and confirm/i })
  const checkboxes = screen.getAllByRole('checkbox')
  for (const box of checkboxes) await user.click(box)
  await user.click(screen.getByRole('button', { name: /create campaign/i }))
}

describe('hospital search → fundraiser handoff', () => {
  test('the cost panel offers a fundraiser when a treatment is searched', async () => {
    render(<App at="/hospitals?t=valve-replacement" />)

    const links = await screen.findAllByRole('link', { name: /can't afford this/i })
    expect(links.length).toBeGreaterThan(0)

    // The link must carry both the hospital and the treatment, or the
    // campaign form cannot prefill the estimate.
    const href = links[0].getAttribute('href') ?? ''
    expect(href).toContain('/fundraisers/start')
    expect(href).toContain('hospital=')
    expect(href).toContain('t=valve-replacement')
  })

  test('no fundraiser link is shown when no treatment is being searched', async () => {
    render(<App at="/hospitals" />)
    await screen.findByRole('heading', { name: /find a hospital/i })
    expect(screen.queryByRole('link', { name: /can't afford this/i })).toBeNull()
  })
})

describe('campaign creation', () => {
  test('prefills patient city, condition and a goal from the hospital estimate', async () => {
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await screen.findByRole('heading', { name: /ask for help with treatment costs/i })

    expect(screen.getByText(/carried over from your search/i)).toBeTruthy()
    expect((screen.getByLabelText(/^city where treatment/i) as HTMLInputElement).value)
      .toBe('Chandigarh')
    expect((screen.getByLabelText(/diagnosis \/ condition/i) as HTMLInputElement).value)
      .toContain('Valve Replacement')

    const goal = Number((screen.getByLabelText(/how much do you need/i) as HTMLInputElement).value)
    expect(goal).toBeGreaterThan(0)
  })

  test('an unknown hospital or treatment in the URL does not crash the form', async () => {
    render(<App at="/fundraisers/start?hospital=nope&t=nope" />)
    await screen.findByRole('heading', { name: /ask for help with treatment costs/i })
    expect(screen.queryByText(/carried over from your search/i)).toBeNull()
  })

  test('blocks the first step until required fields are filled', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await screen.findByRole('heading', { name: /who needs treatment/i })
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/enter the patient's name/i)).toBeTruthy()
    // Still on step 1.
    expect(screen.getByRole('heading', { name: /who needs treatment/i })).toBeTruthy()
  })

  test('rejects a story that is too short to be credible', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await user.type(screen.getByLabelText(/patient's full name/i), 'Lakshmi Ammal')
    await user.type(screen.getByLabelText(/^age/i), '61')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await screen.findByRole('heading', { name: /tell people what happened/i })
    await user.type(screen.getByLabelText(/headline/i), 'Help my mother get treated')
    await user.type(screen.getByLabelText(/^your story/i), 'Please help us.')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/tell the full story/i)).toBeTruthy()
  })

  test('requires both an estimate and an identity document', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await user.type(screen.getByLabelText(/patient's full name/i), 'Lakshmi Ammal')
    await user.type(screen.getByLabelText(/^age/i), '61')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('heading', { name: /tell people what happened/i })
    await user.type(screen.getByLabelText(/headline/i), 'Help my mother get her heart valve replaced')
    await user.type(screen.getByLabelText(/^your story/i), STORY)
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await screen.findByRole('heading', { name: /attach the paperwork/i })
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByText(/attach the hospital estimate or a bill/i)).toBeTruthy()

    // An estimate alone is still not enough — identity is also required.
    const fileInput = screen.getByLabelText(/attach documents/i) as HTMLInputElement
    await user.upload(fileInput, new File(['x'], 'estimate.pdf', { type: 'application/pdf' }))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByText(/attach an identity document/i)).toBeTruthy()
  })

  test('creates the campaign and lands on its page with donations closed', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await screen.findByRole('heading', { name: /who needs treatment/i })
    await completeWizard(user)

    // Navigated to the new campaign's detail page.
    const heading = await screen.findByRole('heading', {
      name: /help my mother get her heart valve replaced/i,
    })
    expect(heading).toBeTruthy()

    expect(screen.getByText(/awaiting hospital verification/i)).toBeTruthy()
    expect(screen.getByText(/donations are closed/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^donate$/i })).toBeNull()

    // Persisted, so a reload keeps it.
    const stored = JSON.parse(window.localStorage.getItem('careconnect.campaigns.v1') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].status).toBe('unverified')
    expect(stored[0].raised).toBe(0)
    expect(stored[0].hospitalId).toBe('h-chd-01')
  })

  test('verification opens donations and marks the documents checked', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await screen.findByRole('heading', { name: /who needs treatment/i })
    await completeWizard(user)
    await screen.findByText(/donations are closed/i)

    await user.click(screen.getByRole('button', { name: /simulate hospital verification/i }))

    await waitFor(() => {
      expect(screen.queryByText(/donations are closed/i)).toBeNull()
    })
    expect(screen.getByRole('button', { name: /^donate$/i })).toBeTruthy()
    expect(screen.getByText(/2 of 2 verified/i)).toBeTruthy()
  })

  test('the new campaign appears in the index under "Mine"', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)
    await screen.findByRole('heading', { name: /who needs treatment/i })
    await completeWizard(user)
    await screen.findByText(/awaiting hospital verification/i)
    unmount()

    render(<App at="/fundraisers" />)
    const mineTab = await screen.findByRole('tab', { name: /mine \(1\)/i })
    await user.click(mineTab)

    expect(await screen.findByText(/help my mother get her heart valve replaced/i)).toBeTruthy()
    expect(screen.getByText(/not yet verified — donations closed/i)).toBeTruthy()
  })
})

describe('donation sheet', () => {
  test('a verified seed campaign can open the donation sheet', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/c-003" />)

    const donate = await screen.findByRole('button', { name: /^donate$/i })
    await user.click(donate)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/donate to lakshmi ammal/i)).toBeTruthy()
    expect(within(dialog).getByText(/not to the family/i)).toBeTruthy()
  })
})

describe('interaction edge cases', () => {
  test('a goal the user typed survives changing the hospital', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    const goal = await screen.findByLabelText(/how much do you need/i) as HTMLInputElement
    await user.clear(goal)
    await user.type(goal, '750000')

    await user.selectOptions(screen.getByLabelText(/treating hospital/i), 'h-chn-01')

    expect((screen.getByLabelText(/how much do you need/i) as HTMLInputElement).value)
      .toBe('750000')
  })

  test('an untouched suggested goal updates when the hospital changes', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    const before = (await screen.findByLabelText(/how much do you need/i) as HTMLInputElement).value
    await user.selectOptions(screen.getByLabelText(/treating hospital/i), 'h-chn-01')
    const after = (screen.getByLabelText(/how much do you need/i) as HTMLInputElement).value

    expect(after).not.toBe(before)
    expect(Number(after)).toBeGreaterThan(0)
  })

  test('double-clicking "Create campaign" creates exactly one campaign', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await screen.findByRole('heading', { name: /who needs treatment/i })

    // Walk to the final step without submitting.
    await user.type(screen.getByLabelText(/patient's full name/i), 'Lakshmi Ammal')
    await user.type(screen.getByLabelText(/^age/i), '61')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('heading', { name: /tell people what happened/i })
    await user.type(screen.getByLabelText(/headline/i), 'Help my mother get her heart valve replaced')
    await user.type(screen.getByLabelText(/^your story/i), STORY)
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('heading', { name: /attach the paperwork/i })
    const fileInput = screen.getByLabelText(/attach documents/i) as HTMLInputElement
    await user.upload(fileInput, new File(['x'], 'estimate.pdf', { type: 'application/pdf' }))
    await user.selectOptions(screen.getByLabelText(/what are you attaching next/i), 'identity')
    await user.upload(fileInput, new File(['x'], 'aadhaar.pdf', { type: 'application/pdf' }))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('heading', { name: /check and confirm/i })
    for (const box of screen.getAllByRole('checkbox')) await user.click(box)

    const submit = screen.getByRole('button', { name: /create campaign/i })
    await user.dblClick(submit)

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('careconnect.campaigns.v1') ?? '[]')
      expect(stored).toHaveLength(1)
    })
  })

  test('a goal beyond the hard cap blocks submission with an explanation', async () => {
    const user = userEvent.setup()
    render(<App at="/fundraisers/start?hospital=h-chd-01&t=valve-replacement" />)

    await user.type(screen.getByLabelText(/patient's full name/i), 'Lakshmi Ammal')
    await user.type(screen.getByLabelText(/^age/i), '61')
    const goal = screen.getByLabelText(/how much do you need/i)
    await user.clear(goal)
    await user.type(goal, '4000000')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/top estimate/i)).toBeTruthy()
    expect(screen.getByRole('heading', { name: /who needs treatment/i })).toBeTruthy()
  })
})
