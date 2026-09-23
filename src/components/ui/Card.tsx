import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({
  raised,
  interactive,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { raised?: boolean; interactive?: boolean }) {
  return (
    <div
      className={cn(
        raised ? 'surface-raised' : 'surface',
        interactive && 'lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  action,
  sub,
  id,
  className,
}: {
  title: string
  sub?: string
  action?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-xl font-bold sm:text-2xl">
          {title}
        </h2>
        {sub && <p className="mt-1 text-[0.95rem] text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
