import { Link } from 'react-router-dom'
import { Phone, TriangleAlert } from 'lucide-react'
import { Logo } from './Logo'

const COLUMNS = [
  {
    title: 'Get help',
    links: [
      { to: '/hospitals', label: 'Find a hospital' },
      { to: '/first-aid', label: 'First aid guides' },
      { to: '/contacts', label: 'Emergency contacts' },
      { to: '/assistant', label: 'AI health assistant' },
    ],
  },
  {
    title: 'Give help',
    links: [
      { to: '/fundraisers', label: 'Medical fundraisers' },
      { to: '/hero', label: 'Report a rescue' },
      { to: '/wallet', label: 'My CareCoins' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-mist-200 bg-white pb-28 lg:mt-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-10">
          <div className="min-w-64 flex-1">
            <Logo />
            <p className="mt-3 max-w-sm text-[0.92rem] leading-relaxed text-ink-500">
              Emergency care, hospital costs and community help in one place.
              Built for the worst ten minutes of someone's day.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="min-w-40">
              <h2 className="mb-3 text-[0.8rem] font-bold tracking-wider text-ink-500 uppercase">
                {col.title}
              </h2>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      data-tap
                      className="flex items-center text-[0.95rem] font-medium text-ink-700 hover:text-med-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="min-w-56">
            <h2 className="mb-3 text-[0.8rem] font-bold tracking-wider text-ink-500 uppercase">
              In an emergency
            </h2>
            <a
              href="tel:112"
              data-tap
              className="inline-flex items-center gap-2 rounded-xl bg-alert-50 px-4 text-[1.1rem] font-extrabold text-alert-700 ring-1 ring-alert-200"
            >
              <Phone size={20} aria-hidden="true" /> Call 112
            </a>
            <p className="mt-2 text-[0.85rem] text-ink-500">
              Free from any phone, anywhere in India.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-xl bg-warn-50 p-4 ring-1 ring-warn-100">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warn-700" aria-hidden="true" />
          <p className="text-[0.88rem] leading-relaxed text-warn-700">
            <strong className="font-bold">CareConnect is not a medical provider.</strong>{' '}
            Nothing here is a diagnosis or a prescription. Hospital listings, costs
            and availability are demonstration data and must be confirmed with the
            hospital directly. In an emergency, call 112 or 108 first.
          </p>
        </div>

        <p className="mt-6 text-[0.82rem] text-ink-400">
          © {new Date().getFullYear()} CareConnect. Prototype build — not for clinical use.
        </p>
      </div>
    </footer>
  )
}
