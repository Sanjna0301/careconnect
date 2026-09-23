import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Phone, Wallet, X } from 'lucide-react'
import { Logo } from './Logo'
import { cn } from '@/lib/cn'
import { useWallet } from '@/store/walletContext'
import { balanceOf } from '@/store/wallet'
import { formatCoins } from '@/lib/format'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/assistant', label: 'AI Assistant' },
  { to: '/fundraisers', label: 'Fundraisers' },
  { to: '/hero', label: 'Be a Hero' },
  { to: '/first-aid', label: 'First Aid' },
]

export function Header({ onSos }: { onSos: () => void }) {
  const [open, setOpen] = useState(false)
  const { wallet } = useWallet()
  const balance = balanceOf(wallet)

  // A route change should never leave the menu hanging open.
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [open])

  return (
    <header className="glass sticky top-0 z-50 border-b border-mist-200/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="CareConnect home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-[0.92rem] font-semibold transition-colors',
                  isActive ? 'bg-med-50 text-med-700' : 'text-ink-700 hover:bg-mist-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wallet"
            data-tap
            className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-[0.9rem] font-bold text-med-700 ring-1 ring-mist-300 hover:ring-med-300 sm:inline-flex"
          >
            <Wallet size={18} aria-hidden="true" />
            {formatCoins(balance)}
            <span className="sr-only">CareCoins in your wallet</span>
            <span aria-hidden="true" className="text-ink-400">coins</span>
          </Link>

          {/* The emergency action is in the header on every page, at every
              breakpoint. It never scrolls away and never collapses into a menu. */}
          <button
            onClick={onSos}
            className={cn(
              'focus-on-red inline-flex h-12 items-center gap-2 rounded-xl bg-alert-600 px-3.5 sm:px-4',
              'font-extrabold tracking-tight text-white',
              'shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_2px_0_var(--color-alert-800),var(--shadow-alert)]',
              'transition-[background-color,transform] hover:bg-alert-700 active:translate-y-[2px]',
            )}
          >
            <Phone size={20} aria-hidden="true" />
            <span className="hidden xs:inline">EMERGENCY</span>
            <span className="xs:hidden">SOS</span>
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid size-12 place-items-center rounded-xl text-ink-700 hover:bg-mist-100 lg:hidden"
          >
            {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-mist-200 bg-white lg:hidden">
          <nav aria-label="All pages" className="mx-auto grid max-w-7xl gap-1 px-4 py-3">
            {[...NAV, { to: '/wallet', label: 'My Wallet', end: false }].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : undefined}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center rounded-xl px-4 text-[1.02rem] font-semibold',
                    isActive ? 'bg-med-50 text-med-700' : 'text-ink-900 hover:bg-mist-100',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
