# CareConnect

Emergency medical assistance for India: nearest hospital that can actually
treat you, what it costs there, an ambulance on the way, and a community
reward system for people who stop to help.

**Prototype build. Not for clinical use.** Hospital names, costs and bed
counts are seed data. The national emergency numbers are real.

## Run it

```bash
bun install
bun run dev          # http://localhost:5173
```

## Verify it

```bash
bun run verify       # typecheck → 41 unit tests → 14-route smoke test → build
```

Individually: `bun run typecheck` · `bun test` · `bun run smoke` · `bun run build`

The smoke test server-renders every route and fails on any throw — it catches
the class of crash that a type-check cannot.

## What is here

| Feature | Route | State |
|---|---|---|
| Emergency SOS — 112/108, share GPS, all helplines | global overlay | Working |
| Hospital locator — geolocation, radius, budget, rating, speciality, scheme filters | `/hospitals` | Working on seed data |
| Condition search — symptoms, diseases and Hindi transliterations | `/hospitals`, `/` | Working |
| Cost bands — national band × price tier × city index | `/hospitals?t=…` | Derived, explainable |
| "Best in India" national ranking per speciality | `/hospitals?t=…` | Working |
| AI assistant — red-flag symptom triage | `/assistant` | Rule-based, offline |
| Lab report reader — 11 analytes against reference ranges | `/assistant` | Real parsing, text files |
| Crowdfunding with document verification and a disbursement trail | `/fundraisers` | Working, payments stubbed |
| CareConnect Hero — rescue claims with hospital verification | `/hero` | Working, approval stubbed |
| CareCoins wallet — ledger, expiry, 20% redemption cap | `/wallet` | Working, `localStorage` |
| First aid — 8 guides, read-aloud, offline | `/first-aid` | Working |
| Emergency contacts — helplines + personal contacts | `/contacts` | Working |

## Docs

- [Site map](docs/SITEMAP.md) — every route, global chrome, navigation depth
- [Technology stack](docs/TECH-STACK.md) — what is built, what production still needs
- [Wireframes](docs/WIREFRAMES.md) — homepage and wallet, mobile and desktop

## Structure

```
src/
├── App.tsx                 routes; Home eager, everything else split
├── styles/index.css        design tokens, elevation, motion prefs — one file
├── components/
│   ├── ui/                 Button, Card, Badge, Field, Sheet, Progress,
│   │                       Skeleton, Announcer (toast + live region in one)
│   ├── layout/             Header, BottomNav, SosSheet, Hero3D, QuickActions
│   └── hospital/           HospitalCard, TreatmentSearch, Filters
├── pages/                  ten route components
├── data/                   hospitals, treatments, campaigns, firstAid,
│                           emergency helplines, city centres
├── store/                  location + wallet contexts, CareCoins ledger
└── lib/                    geo, format, triage, reportParser, speech, storage
```

## Design system — "Calm Depth"

Depth communicates hierarchy; it is never decoration. One light source,
top-centre, drives every shadow. Cards get a 1 px inset top highlight so they
read as having thickness. Buttons have a darker bottom edge that compresses on
`:active`, like a physical key. Interactive lift and the hero's 3D parallax run
**only** on fine pointers, and everything stops under
`prefers-reduced-motion`.

Alert red is reserved for emergency actions, warnings, and critical lab values.
It appears nowhere else.

## Accessibility

17 px base type · 48 px minimum tap targets · visible 3 px focus rings (white
on red surfaces) · skip link · focus-trapped dialogs with Escape and restore ·
combobox keyboard support · one announcer driving both toasts and ARIA live
regions · voice search where supported, hidden where not · read-aloud first aid
· `prefers-reduced-motion` and `prefers-contrast` honoured.
