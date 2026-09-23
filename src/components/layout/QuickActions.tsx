import { Link } from 'react-router-dom'
import { Ambulance, Bandage, Building2, Phone, Share2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAnnounce } from '@/components/ui/Announcer'
import { useLocation } from '@/store/location'
import { locationShareText } from '@/lib/geo'

/**
 * Five actions, one row, no scrolling on any phone. Each is a real
 * destination — none of them open a menu or a chooser first.
 */
export function QuickActions() {
  const announce = useAnnounce()
  const { coords, request } = useLocation()

  async function share() {
    const point = coords ?? (await request())
    if (!point) {
      announce('Turn on location to share where you are.', 'error')
      return
    }
    const text = locationShareText(point)
    try {
      if (navigator.share) await navigator.share({ title: 'My location', text })
      else {
        await navigator.clipboard.writeText(text)
        announce('Location copied to clipboard.', 'success')
      }
    } catch {
      /* User dismissed the share sheet. */
    }
  }

  const tiles = [
    { label: 'Ambulance', sub: 'Call 108', icon: Ambulance, href: 'tel:108', tone: 'alert' as const },
    { label: 'Hospitals', sub: 'Nearby', icon: Building2, to: '/hospitals', tone: 'blue' as const },
    { label: 'Share Location', sub: 'Send GPS', icon: Share2, onClick: share, tone: 'blue' as const },
    { label: 'First Aid', sub: 'Step by step', icon: Bandage, to: '/first-aid', tone: 'blue' as const },
    { label: 'Contacts', sub: 'Helplines', icon: Phone, to: '/contacts', tone: 'blue' as const },
  ]

  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-4">
      {tiles.map((t) => {
        const Icon = t.icon
        const inner = (
          <>
            <span
              className={cn(
                'grid size-12 place-items-center rounded-xl text-white sm:size-14',
                'shadow-[inset_0_1px_0_rgb(255_255_255/0.32),var(--shadow-e2)]',
                t.tone === 'alert' ? 'bg-alert-600' : 'bg-med-600',
              )}
            >
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className="mt-2 block text-[0.85rem] leading-tight font-bold text-ink-900 sm:text-[0.95rem]">
              {t.label}
            </span>
            <span className="mt-0.5 block text-[0.75rem] text-ink-500">{t.sub}</span>
          </>
        )

        const classes =
          'surface lift flex h-full w-full flex-col items-center justify-center px-2 py-4 text-center'

        return (
          <li key={t.label}>
            {t.to ? (
              <Link to={t.to} data-tap className={classes}>{inner}</Link>
            ) : t.href ? (
              <a href={t.href} data-tap className={classes}>{inner}</a>
            ) : (
              <button onClick={t.onClick} className={classes}>{inner}</button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
