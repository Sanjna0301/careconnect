import { useId } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

const CONTROL =
  'w-full rounded-xl bg-white px-4 text-[1rem] text-ink-900 placeholder:text-ink-400 ' +
  'ring-1 ring-mist-300 shadow-[inset_0_1px_2px_rgb(10_22_40/0.05)] ' +
  'focus:ring-2 focus:ring-med-600 focus:outline-none transition-shadow'

function Wrapper({
  label, hint, error, id, required, children,
}: { label: string; hint?: string; error?: string; id: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.9rem] font-semibold text-ink-700">
        {label}
        {required && <span className="ml-1 text-alert-600" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.85rem] text-ink-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[0.85rem] font-medium text-alert-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextField({
  label, hint, error, required, className, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId()
  return (
    <Wrapper label={label} hint={hint} error={error} id={id} required={required}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(CONTROL, 'h-13 py-3', error && 'ring-2 ring-alert-600', className)}
        {...rest}
      />
    </Wrapper>
  )
}

export function TextArea({
  label, hint, error, required, className, ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const id = useId()
  return (
    <Wrapper label={label} hint={hint} error={error} id={id} required={required}>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(CONTROL, 'min-h-32 py-3 leading-relaxed resize-y', error && 'ring-2 ring-alert-600', className)}
        {...rest}
      />
    </Wrapper>
  )
}

export function SelectField({
  label, hint, error, required, className, children, ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; error?: string }) {
  const id = useId()
  return (
    <Wrapper label={label} hint={hint} error={error} id={id} required={required}>
      <select
        id={id}
        required={required}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(CONTROL, 'h-13 py-3 appearance-none bg-[length:1.1rem] bg-[right_0.9rem_center] bg-no-repeat pr-11', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b6076' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </Wrapper>
  )
}
