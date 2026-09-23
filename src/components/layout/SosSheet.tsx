import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ambulance, Building2, Copy, MapPin, Phone, Share2, ShieldAlert,
} from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { LinkButton, Button, RouterButton } from '@/components/ui/Button'
import { useAnnounce } from '@/components/ui/Announcer'
import { useLocation } from '@/store/location'
import { HELPLINES } from '@/data/emergency'
import { locationShareText } from '@/lib/geo'

/**
 * The SOS panel. Everything here is one tap from an outcome — no forms,
 * no confirmation dialogs, no explanatory copy above the actions.
 */
export function SosSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { coords, status, request } = useLocation()
  const announce = useAnnounce()
  const [sharing, setSharing] = useState(false)

  async function shareLocation() {
    setSharing(true)
    try {
      const point = coords ?? (await request())
      if (!point) {
        announce('Could not get your location. Turn on GPS and try again.', 'error')
        return
      }
      const text = locationShareText(point)
      if (navigator.share) {
        await navigator.share({ title: 'My location — I need help', text })
        announce('Location shared.', 'success')
      } else {
        await navigator.clipboard.writeText(text)
        announce('Location copied. Paste it to whoever can help.', 'success')
      }
    } catch {
      announce('Sharing was cancelled.', 'info')
    } finally {
      setSharing(false)
    }
  }

  const primary = HELPLINES.filter((h) => h.primary)
  const others = HELPLINES.filter((h) => !h.primary)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tone="emergency"
      title="Emergency help"
      description="Tap once. Nothing here asks you to fill a form."
    >
      <div className="space-y-3">
        {primary.map((h) => (
          <LinkButton
            key={h.number}
            href={`tel:${h.number}`}
            variant="emergency"
            size="xl"
            block
            icon={h.number === '108' ? <Ambulance size={26} aria-hidden="true" /> : <Phone size={24} aria-hidden="true" />}
            className="justify-start"
          >
            <span className="flex flex-col items-start leading-tight">
              <span className="text-lg font-extrabold">Call {h.number} — {h.label}</span>
              <span className="text-[0.8rem] font-medium text-white/85">{h.detail}</span>
            </span>
          </LinkButton>
        ))}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant="secondary"
            size="lg"
            onClick={shareLocation}
            disabled={sharing}
            icon={<Share2 size={20} aria-hidden="true" />}
          >
            {sharing ? 'Sharing…' : 'Share location'}
          </Button>
          <RouterButton
            to="/hospitals?emergency=1"
            variant="secondary"
            size="lg"
            onClick={onClose}
            icon={<Building2 size={20} aria-hidden="true" />}
          >
            Nearest ER
          </RouterButton>
        </div>

        {coords && (
          <div className="flex items-center gap-2 rounded-xl bg-mist-100 px-3.5 py-3 text-[0.85rem] text-ink-700">
            <MapPin size={18} className="shrink-0 text-med-600" aria-hidden="true" />
            <code className="flex-1 truncate font-mono text-[0.8rem]">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${coords.lat},${coords.lng}`)
                announce('Coordinates copied.', 'success')
              }}
              className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-white"
              aria-label="Copy coordinates"
            >
              <Copy size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {status === 'denied' && (
          <p className="rounded-xl bg-warn-50 px-3.5 py-3 text-[0.85rem] text-warn-700">
            Location is blocked in your browser settings. You can still call — the
            operator will ask for a landmark.
          </p>
        )}

        <div className="pt-2">
          <h3 className="mb-2 text-[0.85rem] font-bold tracking-wide text-ink-500 uppercase">
            Other helplines
          </h3>
          <ul className="divide-y divide-mist-200 overflow-hidden rounded-xl ring-1 ring-mist-200">
            {others.map((h) => (
              <li key={h.number}>
                <a
                  href={`tel:${h.number}`}
                  data-tap
                  className="flex items-center gap-3 bg-white px-4 py-3 hover:bg-mist-50"
                >
                  <span className="w-16 shrink-0 font-mono text-[1.05rem] font-bold text-med-700">
                    {h.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">{h.label}</span>
                    <span className="block truncate text-[0.82rem] text-ink-500">{h.detail}</span>
                  </span>
                  <Phone size={18} className="shrink-0 text-ink-400" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/first-aid"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl bg-med-50 px-4 py-3.5 text-med-800 ring-1 ring-med-200 hover:bg-med-100"
        >
          <ShieldAlert size={22} className="shrink-0" aria-hidden="true" />
          <span className="text-[0.95rem] font-semibold">
            While you wait — open first aid steps
          </span>
        </Link>
      </div>
    </Sheet>
  )
}
