import { cn } from '@/lib/cn'

export function Progress({
  value,
  label,
  tone = 'blue',
  className,
}: {
  value: number
  label: string
  tone?: 'blue' | 'good'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-mist-200 shadow-[inset_0_1px_2px_rgb(10_22_40/0.10)]',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          tone === 'good' ? 'bg-good-600' : 'bg-med-600',
        )}
        style={{
          width: `${pct}%`,
          boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.35)',
        }}
      />
    </div>
  )
}
