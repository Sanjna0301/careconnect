# CareConnect — Technology stack

## What is actually built here

| Layer | Choice | Why this one |
|---|---|---|
| Runtime / package manager | **Bun 1.3** | Installs and builds in about a second; no Node install was present on this machine. |
| Build tool | **Vite 6** | Sub-second production builds, native code-splitting, zero config for the split points we need. |
| Framework | **React 19** + TypeScript 5.9 (strict) | `noUnusedLocals`/`noUnusedParameters` on — the compiler has caught real dead code twice already. |
| Routing | **React Router 7** | Client-side navigation. A full page reload between "SOS" and "nearest ER" would cost seconds. |
| Styling | **Tailwind CSS 4** | Design tokens live in `@theme` in one file; the whole stylesheet ships at **9.2 kB gzipped**. |
| Icons | **lucide-react** | Tree-shaken — only the ~60 icons actually used are bundled. |
| Offline | Hand-written **service worker** (`public/sw.js`) | Cache-first for hashed assets, network-first with a 3 s timeout for navigations. First aid and helplines survive a dead network. |
| Tests | **bun:test** (41 assertions-heavy tests) + an SSR route smoke test | See *Verification* below. |

**Bundle at rest:** 95 kB gzipped JS for the entry chunk, 18 kB router,
9.2 kB CSS. Each secondary page adds 2–12 kB.

## Why a Vite SPA rather than Next.js

The emergency path benefits more from a **service-worker-cached shell** than
from server rendering: the worst-case user is on one bar of signal, and an app
that already lives on their device beats an app that has to be fetched.

**Migrate to Next.js when** you need SEO on individual hospital pages, or
server-side rendering for fundraiser pages so they preview correctly when
shared to WhatsApp. That day is real, and the component layer ports unchanged —
only `src/App.tsx` and the data-fetch boundary would be rewritten.

## What production needs that this build does not have

These are named explicitly so they do not get mistaken for finished work.

| Area | Status here | What production requires |
|---|---|---|
| **Hospital directory** | 35 fictional hospitals, `src/data/hospitals.ts` | Google Places / **Ayushman Bharat HFR** / partner-hospital APIs. Real names are deliberately avoided — see below. |
| **Bed & ICU availability** | Static `occupancy` field | A live feed from each hospital's HIS. This is the hardest integration in the product and the most valuable. |
| **Treatment costs** | Derived: national band × price tier × city index | Negotiated partner rate cards. The current derivation is at least *explainable*, which a hand-authored number would not be. |
| **AI assistant** | Local rule-based triage + a real client-side lab-value parser | A server-side Claude call. Keep the red-flag rules client-side as a floor — they must work offline and must not depend on a model choosing to comply. |
| **PDF / image reports** | Text files only | Server-side OCR + PDF extraction. The UI already says so rather than pretending. |
| **Payments** | Stops at the gateway boundary | Razorpay/PayU with settlement into a hospital **escrow** account. |
| **Auth** | None | Phone OTP, and only at the wallet/claims boundary — never in front of the emergency path. |
| **Claim verification** | Demo button on `/hero` | A hospital-staff portal with per-hospital accounts and an immutable audit log. |
| **Wallet ledger** | `localStorage` | Server-side append-only ledger. Coins are a financial liability; they cannot live in a browser. |

## Deliberate data decision

Hospital names in `src/data/hospitals.ts` are **fictional**. Attaching invented
costs, ratings and bed counts to a real, named institution would misinform
patients and misrepresent that hospital. The national emergency numbers in
`src/data/emergency.ts` (112, 108, 102, 1098, 14416, 1091, 104, 1075) **are
genuine** — those are the ones that must work.

## Suggested backend, when you build it

```
Next.js (web)  ·  React Native / Expo (mobile)
        │
        ▼
API — NestJS or FastAPI
 ├── PostgreSQL + PostGIS      hospitals, geo queries, campaigns, claims
 ├── Redis                     bed-availability cache, rate limits
 ├── Ledger service            append-only CareCoins double-entry
 ├── Claude API                triage + report summarisation (server-side only)
 ├── Object storage (S3)       claim evidence, redacted bills
 └── Payment gateway           escrow settlement to hospital accounts
```

**PostGIS matters specifically.** Haversine over 35 in-memory rows is fine;
over 50,000 hospitals with a radius filter it is not.

## Verification

`bun run verify` runs all four gates and is the command to trust:

```
bun run typecheck   # tsc -b across app, node and test projects
bun test            # 41 unit tests over geo, costs, triage, parser, wallet
bun run smoke       # server-renders all 14 routes, fails on any throw
bun run build       # production build
```

The unit tests found three real bugs during development: a regex that never
matched the word "haemoglobin", a cost rounding step that collapsed a
subsidised dialysis session to ₹0, and an ETA that rendered "1 h 0 min".
