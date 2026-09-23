import { NavLink } from 'react-router-dom'
import { Ambulance, Bot, Building2, Heart, House, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Fixed bottom navigation — thumb-reachable, five destinations, always
 * labelled. The SOS action sits in the centre well, raised above the bar
 * so it is the first thing a hand lands on.
 */

const LEFT = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/hospitals', label: 'Hospitals', icon: Building2, end: false },
]

const RIGHT = [
  { to: '/assistant', label: 'Assistant', icon: Bot, end: false },
  { to: '/wallet', label: 'Wallet', icon: Wallet, end: false },
]

function Item({
  to, label, icon: Icon, end,
}: { to: string; label: string; icon: typeof House; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5',
          'text-[0.7rem] font-semibold transition-colors',
          isActive ? 'text-med-700' : 'text-ink-500',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={23}
            aria-hidden="true"
            strokeWidth={isActive ? 2.4 : 2}
            className={cn('transition-transform', isActive && 'scale-110')}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav({ onSos }: { onSos: () => void }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-mist-200 bg-white/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 pt-1 pb-1">
        {LEFT.map((i) => <Item key={i.to} {...i} />)}

        <div className="relative w-18 shrink-0">
          <button
            onClick={onSos}
            aria-label="Emergency — call for help"
            className={cn(
              'sos-halo focus-on-red absolute -top-6 left-1/2 z-10 grid size-16 -translate-x-1/2 place-items-center',
              'rounded-full bg-alert-600 text-white',
              'shadow-[inset_0_2px_0_rgb(255_255_255/0.32),0_4px_0_var(--color-alert-800),var(--shadow-alert)]',
              'transition-transform active:translate-y-[3px]',
            )}
          >
            <Ambulance size={28} aria-hidden="true" />
          </button>
          <span className="absolute inset-x-0 bottom-2 text-center text-[0.7rem] font-extrabold text-alert-700">
            SOS
          </span>
        </div>

        {RIGHT.map((i) => <Item key={i.to} {...i} />)}
      </div>
    </nav>
  )
}

export function HeroNavHint() {
  return (
    <NavLink to="/hero" className="sr-only-focusable">
      <Heart size={16} aria-hidden="true" /> Be a CareConnect Hero
    </NavLink>
  )
}
