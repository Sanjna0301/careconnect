import { useEffect, useRef, useState } from 'react'
import { Activity, BedDouble, HeartPulse, ShieldCheck } from 'lucide-react'

/**
 * The hero's depth composition.
 *
 * Three cards on three z-planes rotate together against a fixed light
 * source when the pointer moves. It only runs on a fine pointer, never on
 * touch, and never under prefers-reduced-motion — the effect is a nicety
 * for someone browsing, and browsing is not what this site is for.
 */
export function Hero3D() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled(fine.matches && !still.matches)
    update()
    fine.addEventListener('change', update)
    still.addEventListener('change', update)
    return () => {
      fine.removeEventListener('change', update)
      still.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = stageRef.current
    if (!el) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        // ±7° is enough to read as depth without distorting the text.
        setTilt({ x: -py * 7, y: px * 7 })
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(frame)
      setTilt({ x: 0, y: 0 })
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  const transform = `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`

  return (
    <div ref={stageRef} className="stage relative mx-auto w-full max-w-md" aria-hidden="true">
      {/* Ground shadow anchors the stack to the page. */}
      <div className="absolute inset-x-10 bottom-2 h-10 rounded-[50%] bg-med-950/20 blur-2xl" />

      <div className="tilt relative" style={{ transform }}>
        {/* Back plane — the map/route layer. */}
        <div
          className="absolute inset-x-6 top-2 h-44 rounded-3xl bg-med-700 shadow-[var(--shadow-e3)]"
          style={{ transform: 'translateZ(-40px)' }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-40">
            <svg viewBox="0 0 320 180" className="size-full">
              <g stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5">
                <path d="M-10 40 H330 M-10 90 H330 M-10 140 H330" />
                <path d="M60 -10 V190 M150 -10 V190 M240 -10 V190" />
              </g>
              <path
                d="M40 160 L90 120 L150 128 L200 70 L280 40"
                stroke="#fff" strokeWidth="5" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="280" cy="40" r="9" fill="#fff" />
            </svg>
          </div>
        </div>

        {/* Middle plane — the primary hospital card. */}
        <div
          className="relative mt-16 rounded-3xl bg-white p-5 shadow-[var(--shadow-e4)] ring-1 ring-ink-900/5"
          style={{ transform: 'translateZ(24px)' }}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
              <HeartPulse size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.95rem] font-bold text-ink-900">
                Cauvery Advanced Medical Centre
              </p>
              <p className="text-[0.8rem] text-ink-500">Koramangala · 2.4 km · ~7 min</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-good-50 px-2 py-1 text-[0.75rem] font-bold text-good-700 ring-1 ring-good-100">
              <ShieldCheck size={13} /> ER open
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-med-50 px-2 py-1 text-[0.75rem] font-bold text-med-800 ring-1 ring-med-200">
              <BedDouble size={13} /> 31 ICU beds
            </span>
            <span className="rounded-lg bg-mist-100 px-2 py-1 text-[0.75rem] font-bold text-ink-700 ring-1 ring-mist-300">
              NABH
            </span>
          </div>

          <div className="mt-3 h-11 rounded-xl bg-med-600 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_0_var(--color-med-800)]">
            <span className="flex h-full items-center justify-center text-[0.9rem] font-bold text-white">
              Call now
            </span>
          </div>
        </div>

        {/* Front plane — the live vitals chip, closest to the viewer. */}
        <div
          className="absolute -right-2 -bottom-6 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-e4)] ring-1 ring-ink-900/5 sm:-right-6"
          style={{ transform: 'translateZ(64px)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-alert-600 text-white">
              <Activity size={18} />
            </span>
            <div>
              <p className="text-[0.7rem] font-semibold tracking-wide text-ink-500 uppercase">
                Ambulance ETA
              </p>
              <p className="text-[1.05rem] leading-none font-extrabold text-ink-900">6 min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
