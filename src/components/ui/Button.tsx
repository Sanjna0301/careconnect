import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'emergency' | 'secondary' | 'ghost' | 'outline'
type Size = 'md' | 'lg' | 'xl'

const VARIANTS: Record<Variant, string> = {
  // Depth on buttons comes from a darker bottom edge — the same trick a
  // physical key uses. It compresses on :active, so the press feels real.
  primary:
    'bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_0_var(--color-med-800),var(--shadow-e2)] ' +
    'hover:bg-med-700 active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]',
  emergency:
    'bg-alert-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_3px_0_var(--color-alert-800),var(--shadow-alert)] ' +
    'hover:bg-alert-700 active:translate-y-[3px] active:shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] focus-on-red',
  secondary:
    'bg-white text-med-700 ring-1 ring-mist-300 shadow-[var(--shadow-e1)] hover:bg-mist-50 hover:ring-med-300 active:translate-y-[1px]',
  outline:
    'bg-transparent text-ink-700 ring-1 ring-mist-300 hover:bg-white hover:ring-med-300 active:translate-y-[1px]',
  ghost:
    'bg-transparent text-ink-700 hover:bg-mist-200 active:translate-y-[1px]',
}

const SIZES: Record<Size, string> = {
  md: 'h-12 px-4 text-[0.95rem] gap-2 rounded-xl',
  lg: 'h-14 px-5 text-base gap-2.5 rounded-xl',
  xl: 'h-16 px-6 text-lg gap-3 rounded-2xl',
}

/**
 * Shared style computation, so a <button>, an <a> and a router <Link> can
 * look identical without any of them being nested inside another.
 */
export function buttonClasses(opts: {
  variant?: Variant
  size?: Size
  block?: boolean
  className?: string
} = {}): string {
  const { variant = 'primary', size = 'md', block, className } = opts
  return cn(
    'inline-flex items-center justify-center font-semibold tracking-tight no-underline',
    'transition-[background-color,transform,box-shadow] duration-150 select-none',
    'disabled:opacity-50 disabled:pointer-events-none',
    SIZES[size],
    VARIANTS[variant],
    block && 'w-full',
    className,
  )
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: ReactNode
  trailing?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, icon, trailing, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, block, className })}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </button>
  )
})

/** Anchor styled as a button — used for tel:, mailto: and map deep links. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  trailing,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <a
      data-tap
      className={buttonClasses({ variant, size, block, className })}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </a>
  )
}

/**
 * Client-side navigation styled as a button. Use this for in-app routes —
 * an <a href> would reload the whole application, which costs seconds the
 * user may not have.
 */
export function RouterButton({
  to, variant = 'primary', size = 'md', block, icon, trailing, className, children, onClick, ...rest
}: {
  to: string
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: ReactNode
  trailing?: ReactNode
  className?: string
  children?: ReactNode
  onClick?: () => void
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className' | 'children' | 'onClick'>) {
  return (
    <Link
      to={to}
      data-tap
      onClick={onClick}
      className={buttonClasses({ variant, size, block, className })}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </Link>
  )
}
