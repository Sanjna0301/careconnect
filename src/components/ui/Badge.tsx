import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'blue' | 'good' | 'warn' | 'alert'

const TONES: Record<Tone, string> = {
  neutral: 'bg-mist-100 text-ink-700 ring-mist-300',
  blue: 'bg-med-50 text-med-800 ring-med-200',
  good: 'bg-good-50 text-good-700 ring-good-100',
  warn: 'bg-warn-50 text-warn-700 ring-warn-100',
  alert: 'bg-alert-50 text-alert-700 ring-alert-200',
}

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: Tone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.78rem] font-semibold ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
