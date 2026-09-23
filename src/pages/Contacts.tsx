import { useEffect, useState } from 'react'
import { Phone, Plus, Share2, Trash2, UserRound } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { TextField } from '@/components/ui/Field'
import { useAnnounce } from '@/components/ui/Announcer'
import { useLocation } from '@/store/location'
import { HELPLINES } from '@/data/emergency'
import { locationShareText } from '@/lib/geo'
import { readJSON, writeJSON } from '@/lib/storage'

type Contact = { id: string; name: string; phone: string; relation: string }

const KEY = 'careconnect.contacts.v1'

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => readJSON<Contact[]>(KEY, []))
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('')
  const [error, setError] = useState<string | undefined>()
  const announce = useAnnounce()
  const { coords, request } = useLocation()

  useEffect(() => { writeJSON(KEY, contacts) }, [contacts])

  function add(e: React.FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (!name.trim()) { setError('Enter a name.'); return }
    if (digits.length < 10) { setError('Enter a valid phone number with at least 10 digits.'); return }

    setContacts((c) => [
      ...c,
      { id: `${Date.now()}`, name: name.trim(), phone: phone.trim(), relation: relation.trim() || 'Contact' },
    ])
    setName(''); setPhone(''); setRelation(''); setError(undefined)
    announce('Contact saved on this device.', 'success')
  }

  async function alertAll() {
    let point = coords
    if (!point) { await request(); point = coords }
    const text = point
      ? locationShareText(point)
      : 'I need help. I could not share my location — please call me.'
    try {
      if (navigator.share) await navigator.share({ title: 'I need help', text })
      else {
        await navigator.clipboard.writeText(text)
        announce('Message copied — paste it into your group chat.', 'success')
      }
    } catch { /* dismissed */ }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Emergency contacts</h1>
        <p className="mt-1.5 text-[1rem] text-ink-500">
          National helplines, and the people you would want called.
        </p>
      </header>

      <SectionHeading title="National helplines" sub="Free from any phone, anywhere in India." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {HELPLINES.map((h) => (
          <li key={h.number}>
            <a
              href={`tel:${h.number}`}
              data-tap
              className="surface lift flex items-center gap-3.5 p-4"
            >
              <span
                className={`grid size-13 shrink-0 place-items-center rounded-xl font-mono text-[1.05rem] font-extrabold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.28),var(--shadow-e1)] ${
                  h.primary ? 'bg-alert-600' : 'bg-med-600'
                }`}
              >
                {h.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink-900">{h.label}</span>
                <span className="block text-[0.87rem] text-ink-500">{h.detail}</span>
              </span>
              <Phone size={20} className="shrink-0 text-ink-400" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <SectionHeading
        className="mt-10"
        title="Your people"
        sub="Stored only on this device — never uploaded."
        action={
          contacts.length > 0 ? (
            <Button
              size="md"
              variant="emergency"
              onClick={alertAll}
              icon={<Share2 size={18} aria-hidden="true" />}
            >
              Alert with location
            </Button>
          ) : undefined
        }
      />

      {contacts.length > 0 && (
        <ul className="mb-5 grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <li key={c.id}>
              <Card className="flex items-center gap-3.5 p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-med-50 text-med-700">
                  <UserRound size={22} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink-900">{c.name}</p>
                  <p className="text-[0.87rem] text-ink-500">{c.relation} · {c.phone}</p>
                </div>
                <LinkButton
                  href={`tel:${c.phone}`}
                  size="md"
                  className="size-12 shrink-0 px-0"
                  aria-label={`Call ${c.name}`}
                >
                  <Phone size={20} aria-hidden="true" />
                </LinkButton>
                <button
                  onClick={() => {
                    setContacts((list) => list.filter((x) => x.id !== c.id))
                    announce(`${c.name} removed.`, 'info')
                  }}
                  aria-label={`Remove ${c.name}`}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-mist-100 hover:text-alert-700"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="p-5">
        <h3 className="text-[1.05rem] font-bold">Add a contact</h3>
        <form onSubmit={add} className="mt-4 grid gap-4 sm:grid-cols-3">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amma" />
          <TextField
            label="Phone"
            type="tel"
            inputMode="tel"
            value={phone}
            error={error}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98XXXXXXXX"
          />
          <TextField
            label="Relationship"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="Mother"
          />
          <div className="sm:col-span-3">
            <Button type="submit" size="lg" icon={<Plus size={20} aria-hidden="true" />}>
              Save contact
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
