import { useEffect, useRef, useState } from 'react'
import {
  Bot, CircleAlert, FileText, Paperclip, Phone, Send, Sparkles,
  Stethoscope, TriangleAlert, Upload, User,
} from 'lucide-react'
import { Button, LinkButton, RouterButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAnnounce } from '@/components/ui/Announcer'
import { runTriage, type TriageResult } from '@/lib/triage'
import { extractText, parseReport, type ReportSummary } from '@/lib/reportParser'
import { cn } from '@/lib/cn'

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; triage: TriageResult }
  | { id: number; role: 'report'; fileName: string; summary: ReportSummary; covered: boolean }

const STARTERS = [
  'I have chest pain and I am sweating',
  'Fever for 4 days, feeling very weak',
  'My father is confused and his speech is slurred',
  'Severe pain on the right side of my stomach',
]

const SEVERITY_STYLE = {
  red: { ring: 'ring-alert-200', bg: 'bg-alert-50', text: 'text-alert-700', label: 'Emergency' },
  amber: { ring: 'ring-warn-100', bg: 'bg-warn-50', text: 'text-warn-700', label: 'See a doctor today' },
  green: { ring: 'ring-mist-300', bg: 'bg-white', text: 'text-ink-700', label: 'General guidance' },
} as const

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const nextId = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const announce = useAnnounce()

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: trimmed }])
    setInput('')
    setThinking(true)

    // A short delay makes the answer feel considered rather than canned.
    // Red flags skip it — those must appear immediately.
    const triage = runTriage(trimmed)
    const delay = triage.severity === 'red' ? 0 : 420

    window.setTimeout(() => {
      setThinking(false)
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', triage }])
      if (triage.severity === 'red') {
        announce(`Emergency guidance: ${triage.headline}`, 'error')
      }
    }, delay)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      announce('That file is over 5 MB. Please upload a smaller one.', 'error')
      return
    }

    const { text, extracted } = await extractText(file)
    const summary = parseReport(text)

    setMessages((m) => [
      ...m,
      { id: nextId.current++, role: 'report', fileName: file.name, summary, covered: extracted },
    ])
    announce(
      extracted
        ? `Read ${file.name}. Found ${summary.findings.length} recognised values.`
        : `${file.name} attached. Text could not be read in the browser.`,
      extracted ? 'success' : 'info',
    )
    e.target.value = ''
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-med-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),var(--shadow-e2)]">
            <Bot size={26} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">AI Health Assistant</h1>
            <p className="text-[0.95rem] text-ink-500">
              Describe what is happening, or upload a lab report to have it explained.
            </p>
          </div>
        </div>
      </header>

      {/* The disclaimer is above the chat, not buried under it. */}
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-warn-50 p-4 ring-1 ring-warn-100">
        <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warn-700" aria-hidden="true" />
        <p className="text-[0.9rem] leading-relaxed text-warn-700">
          <strong className="font-bold">This is not a doctor and not a diagnosis.</strong>{' '}
          It helps you decide how urgently to get real medical care, and explains
          what your report says in plain words. It cannot examine you, and it can
          be wrong. If something feels serious, call{' '}
          <a href="tel:112" className="font-bold underline">112</a>.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="max-h-[32rem] min-h-[22rem] overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 ? (
            <EmptyState onPick={send} onUpload={() => fileRef.current?.click()} />
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => (
                <li key={m.id}>
                  {m.role === 'user' && <UserBubble text={m.text} />}
                  {m.role === 'assistant' && <TriageBubble triage={m.triage} />}
                  {m.role === 'report' && (
                    <ReportBubble fileName={m.fileName} summary={m.summary} covered={m.covered} />
                  )}
                </li>
              ))}
              {thinking && (
                <li className="flex items-center gap-2 text-[0.9rem] text-ink-500">
                  <Sparkles size={18} className="animate-pulse text-med-600" aria-hidden="true" />
                  Checking your symptoms…
                </li>
              )}
            </ul>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input) }}
          className="border-t border-mist-200 bg-mist-50 p-3"
        >
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-med-700 ring-1 ring-mist-300 hover:ring-med-300"
              aria-label="Upload a medical report"
            >
              <Paperclip size={20} aria-hidden="true" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.json,.md,.pdf,image/*"
              onChange={onFile}
              className="hidden"
            />

            <label className="flex-1">
              <span className="sr-only">Describe your symptoms</span>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="What is happening? e.g. chest pain since morning"
                className="max-h-32 min-h-12 w-full resize-none rounded-xl bg-white px-4 py-3 text-[1rem] ring-1 ring-mist-300 focus:ring-2 focus:ring-med-600 focus:outline-none"
              />
            </label>

            <Button type="submit" size="md" disabled={!input.trim()} className="size-12 shrink-0 px-0" aria-label="Send">
              <Send size={20} aria-hidden="true" />
            </Button>
          </div>
        </form>
      </Card>

      <p className="mt-4 text-center text-[0.82rem] text-ink-400">
        Nothing you type here is stored on a server in this build. Report parsing
        happens entirely in your browser.
      </p>
    </div>
  )
}

function EmptyState({ onPick, onUpload }: { onPick: (t: string) => void; onUpload: () => void }) {
  return (
    <div className="py-4">
      <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
        <Stethoscope size={20} className="text-med-600" aria-hidden="true" />
        Start with one of these
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <li key={s}>
            <button
              onClick={() => onPick(s)}
              className="w-full rounded-xl bg-mist-50 px-4 py-3 text-left text-[0.95rem] font-medium text-ink-700 ring-1 ring-mist-200 hover:bg-white hover:ring-med-300"
            >
              “{s}”
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border-2 border-dashed border-mist-300 p-5 text-center">
        <Upload size={28} className="mx-auto text-med-600" aria-hidden="true" />
        <h3 className="mt-2 font-bold">Or upload a lab report</h3>
        <p className="mx-auto mt-1 max-w-sm text-[0.88rem] text-ink-500">
          A text file or exported report. Every value is read and explained in
          your browser — nothing is uploaded anywhere.
        </p>
        <Button variant="secondary" size="md" className="mt-3" onClick={onUpload}>
          Choose a file
        </Button>
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end gap-2.5">
      <p className="max-w-[80%] rounded-2xl rounded-br-md bg-med-600 px-4 py-2.5 text-[0.98rem] leading-relaxed text-white shadow-[var(--shadow-e1)]">
        {text}
      </p>
      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-mist-200 text-ink-500">
        <User size={16} aria-hidden="true" />
      </span>
    </div>
  )
}

function TriageBubble({ triage }: { triage: TriageResult }) {
  const s = SEVERITY_STYLE[triage.severity]
  return (
    <div className="flex gap-2.5">
      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-med-600 text-white">
        <Bot size={16} aria-hidden="true" />
      </span>

      <div className={cn('min-w-0 flex-1 rounded-2xl rounded-tl-md p-4 ring-1', s.bg, s.ring)}>
        <Badge tone={triage.severity === 'red' ? 'alert' : triage.severity === 'amber' ? 'warn' : 'neutral'}>
          {s.label}
        </Badge>

        <h3 className={cn('mt-2.5 text-[1.05rem] leading-snug font-bold', s.text)}>
          {triage.headline}
        </h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">{triage.reasoning}</p>

        <h4 className="mt-4 text-[0.82rem] font-bold tracking-wide text-ink-500 uppercase">
          What to do now
        </h4>
        <ol className="mt-2 space-y-2">
          {triage.actions.map((a, i) => (
            <li key={a} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-ink-900">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-[0.78rem] font-bold text-med-700 ring-1 ring-mist-300">
                {i + 1}
              </span>
              {a}
            </li>
          ))}
        </ol>

        {triage.askYourself.length > 0 && (
          <>
            <h4 className="mt-4 text-[0.82rem] font-bold tracking-wide text-ink-500 uppercase">
              The doctor will ask you
            </h4>
            <ul className="mt-2 space-y-1.5">
              {triage.askYourself.map((q) => (
                <li key={q} className="flex gap-2 text-[0.92rem] text-ink-700">
                  <span className="text-ink-400" aria-hidden="true">•</span>{q}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-2.5">
          {triage.severity === 'red' && (
            <LinkButton href="tel:112" variant="emergency" size="lg" icon={<Phone size={20} aria-hidden="true" />}>
              Call 112 now
            </LinkButton>
          )}
          <RouterButton
            to={triage.treatmentKey ? `/hospitals?t=${triage.treatmentKey}` : '/hospitals'}
            variant={triage.severity === 'red' ? 'secondary' : 'primary'}
            size="lg"
          >
            Find hospitals for this
          </RouterButton>
        </div>
      </div>
    </div>
  )
}

function ReportBubble({
  fileName, summary, covered,
}: { fileName: string; summary: ReportSummary; covered: boolean }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-med-600 text-white">
        <FileText size={16} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white p-4 ring-1 ring-mist-300">
        <p className="truncate text-[0.88rem] font-semibold text-ink-500">{fileName}</p>

        {!covered ? (
          <>
            <h3 className="mt-2 text-[1.05rem] font-bold">I could not read this file in the browser.</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">
              PDFs and photographs need OCR, which runs on the server rather than
              in your phone. For now, open the report, copy the text, and paste it
              into the message box — every value will be read the same way.
            </p>
          </>
        ) : summary.findings.length === 0 ? (
          <>
            <h3 className="mt-2 text-[1.05rem] font-bold">I read the file but recognised no lab values.</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">
              I look for named analytes such as haemoglobin, platelets, creatinine,
              HbA1c, TSH and liver enzymes. If your report uses different labels,
              paste the line in and I will take another look.
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-2 text-[1.05rem] font-bold">
              {summary.findings.length} values read
              {summary.urgent.length > 0 && ' — some need attention today'}
            </h3>

            {summary.urgent.length > 0 && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-alert-50 p-3 ring-1 ring-alert-200">
                <CircleAlert size={20} className="mt-0.5 shrink-0 text-alert-700" aria-hidden="true" />
                <p className="text-[0.92rem] leading-relaxed text-alert-700">
                  <strong className="font-bold">
                    {summary.urgent.map((f) => f.analyte.label).join(', ')}
                  </strong>{' '}
                  {summary.urgent.length === 1 ? 'is' : 'are'} far outside the usual
                  range. Show this report to a doctor today rather than waiting for
                  your next appointment.
                </p>
              </div>
            )}

            <ul className="mt-3 divide-y divide-mist-200 overflow-hidden rounded-xl ring-1 ring-mist-200">
              {summary.findings.map((f) => (
                <li key={f.analyte.key} className="p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-ink-900">{f.analyte.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[1.02rem] font-bold text-ink-900">
                        {f.value.toLocaleString('en-IN')}
                        <span className="ml-1 text-[0.8rem] font-normal text-ink-500">
                          {f.analyte.unit}
                        </span>
                      </span>
                      <Badge tone={f.critical ? 'alert' : f.status === 'normal' ? 'good' : 'warn'}>
                        {f.critical ? 'Critical' : f.status === 'normal' ? 'Normal' : f.status === 'high' ? 'High' : 'Low'}
                      </Badge>
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.8rem] text-ink-400">
                    Usual range {f.analyte.low.toLocaleString('en-IN')}–
                    {f.analyte.high.toLocaleString('en-IN')} {f.analyte.unit}
                  </p>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-ink-700">
                    {f.explanation}
                  </p>
                </li>
              ))}
            </ul>

            {summary.unrecognisedLines > 0 && (
              <p className="mt-3 text-[0.85rem] text-ink-500">
                About {summary.unrecognisedLines} other line
                {summary.unrecognisedLines === 1 ? '' : 's'} in this report contained
                numbers I do not recognise. Do not treat this summary as complete —
                your doctor reads the whole report.
              </p>
            )}

            <p className="mt-3 rounded-lg bg-mist-100 p-3 text-[0.85rem] leading-relaxed text-ink-700">
              Reference ranges vary between laboratories and do not apply to children
              or pregnancy. The range printed on your own report is the one that counts.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
