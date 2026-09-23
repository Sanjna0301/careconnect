import { Phone } from 'lucide-react'
import { LinkButton, RouterButton } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-[4rem] leading-none font-extrabold text-med-200">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">This page does not exist</h1>
      <p className="mt-2 text-[1rem] text-ink-500">
        If you got here looking for help, the two things below always work.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <LinkButton href="tel:112" variant="emergency" size="xl" block icon={<Phone size={24} aria-hidden="true" />}>
          Call 112 — emergency
        </LinkButton>
        <RouterButton to="/hospitals" variant="secondary" size="xl" block>
          Find a hospital near me
        </RouterButton>
        <RouterButton to="/" variant="ghost" size="lg" block>
          Back to home
        </RouterButton>
      </div>
    </div>
  )
}
