import { useState } from 'react'
import {
  Activity, Ban, Bone, Brain, Droplet, Flame, Heart, HeartPulse,
  Phone, Volume2, Wind, WifiOff,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button, LinkButton } from '@/components/ui/Button'
import { FIRST_AID, type FirstAidGuide } from '@/data/firstAid'
import { speak } from '@/lib/speech'
import { cn } from '@/lib/cn'

const ICONS: Record<string, typeof Heart> = {
  'heart-pulse': HeartPulse, droplet: Droplet, wind: Wind, flame: Flame,
  brain: Brain, activity: Activity, bone: Bone, heart: Heart,
}

export function FirstAid() {
  const [openKey, setOpenKey] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">First aid</h1>
        <p className="mt-1.5 text-[1rem] text-ink-500">
          Short steps you can follow one-handed while the ambulance is coming.
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <LinkButton
          href="tel:112"
          variant="emergency"
          size="xl"
          className="flex-1"
          icon={<Phone size={24} aria-hidden="true" />}
        >
          Call 112 first
        </LinkButton>
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-white px-4 py-3 ring-1 ring-mist-300">
          <WifiOff size={20} className="shrink-0 text-med-600" aria-hidden="true" />
          <p className="text-[0.88rem] leading-snug text-ink-700">
            Once you have opened this page, it stays on your device and works with no network.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {FIRST_AID.map((guide) => (
          <GuideCard
            key={guide.key}
            guide={guide}
            open={openKey === guide.key}
            onToggle={() => setOpenKey(openKey === guide.key ? null : guide.key)}
          />
        ))}
      </ul>

      <p className="mt-8 rounded-xl bg-mist-100 p-4 text-[0.88rem] leading-relaxed text-ink-700">
        This guidance follows widely published basic-life-support advice and is
        written for untrained bystanders. It is not a substitute for a certified
        first-aid course — and taking one is the single most useful thing you can
        do before you ever need this page.
      </p>
    </div>
  )
}

function GuideCard({
  guide, open, onToggle,
}: { guide: FirstAidGuide; open: boolean; onToggle: () => void }) {
  const Icon = ICONS[guide.icon] ?? Heart

  function readAloud() {
    speak(
      `${guide.title}. ${guide.callFirst}. ` +
        guide.steps.map((s, i) => `Step ${i + 1}. ${s}`).join(' '),
    )
  }

  return (
    <li>
      <Card className="overflow-hidden">
        <h2>
          <button
            onClick={onToggle}
            aria-expanded={open}
            className="flex w-full items-center gap-3.5 p-4 text-left hover:bg-mist-50"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.28),var(--shadow-e1)]">
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.08rem] font-bold text-ink-900">{guide.title}</span>
              <span className="block text-[0.88rem] text-ink-500">
                {guide.steps.length} steps · {open ? 'tap to close' : 'tap to open'}
              </span>
            </span>
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-lg bg-mist-100 text-ink-500 transition-transform',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
        </h2>

        {open && (
          <div className="border-t border-mist-200 px-4 pt-4 pb-5">
            <div className="flex items-start gap-3 rounded-xl bg-alert-50 p-3.5 ring-1 ring-alert-200">
              <Phone size={20} className="mt-0.5 shrink-0 text-alert-700" aria-hidden="true" />
              <p className="text-[0.95rem] leading-relaxed font-semibold text-alert-700">
                {guide.callFirst}
              </p>
            </div>

            <ol className="mt-4 space-y-3">
              {guide.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-med-600 text-[0.88rem] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-[1rem] leading-relaxed text-ink-900">{s}</p>
                </li>
              ))}
            </ol>

            <div className="mt-4 rounded-xl bg-mist-50 p-4 ring-1 ring-mist-200">
              <h3 className="flex items-center gap-2 text-[0.88rem] font-bold tracking-wide text-ink-700 uppercase">
                <Ban size={16} className="text-alert-600" aria-hidden="true" /> Do not
              </h3>
              <ul className="mt-2 space-y-1.5">
                {guide.never.map((n) => (
                  <li key={n} className="flex gap-2 text-[0.95rem] leading-relaxed text-ink-700">
                    <span className="text-alert-600" aria-hidden="true">✕</span>{n}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="lg"
                onClick={readAloud}
                icon={<Volume2 size={20} aria-hidden="true" />}
              >
                Read aloud
              </Button>
              <LinkButton
                href="tel:108"
                variant="emergency"
                size="lg"
                icon={<Phone size={20} aria-hidden="true" />}
              >
                Call ambulance
              </LinkButton>
            </div>
          </div>
        )}
      </Card>
    </li>
  )
}
