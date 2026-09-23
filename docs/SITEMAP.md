# CareConnect — Site map

Routes are defined in [`src/App.tsx`](../src/App.tsx). Home ships in the main
bundle; every other route is code-split, so a user landing mid-emergency
downloads the smallest possible amount before the SOS button works.

```
/                                 Home — emergency CTA, search, quick actions, nearby ER
├── /hospitals                    Locator: search, filters, sort, results
│     ?t=<treatment-key>            …scoped to one condition (adds cost bands + national ranking)
│     ?emergency=1                   …pre-filtered to 24×7 emergency departments
├── /assistant                    AI Health Assistant — symptom triage + report reader
├── /fundraisers                  Campaign index (All / Urgent / Closing soon / Mine)
│   ├── /fundraisers/start        Create a campaign — 4-step wizard
│   │     ?hospital=<id>&t=<key>    …prefilled from the hospital search, with that
│   │                               hospital's own cost estimate as the goal anchor
│   └── /fundraisers/:id          Campaign detail — story, documents, money trail, donate
├── /hero                         CareConnect Hero — submit a rescue, track claims
├── /wallet                       CareCoins wallet — balance, ledger, redemption, partners
├── /first-aid                    Eight offline-capable first-aid guides
├── /contacts                     National helplines + personal emergency contacts
└── /*                            Not found — still offers "Call 112" and "Find a hospital"
```

## Global chrome — present on every route

| Element | Where | Behaviour |
|---|---|---|
| **EMERGENCY button** | Header, all breakpoints | Opens the SOS sheet. Never scrolls away, never collapses into a menu. |
| **SOS sheet** | Overlay | One-tap 112 / 108, share location, nearest ER, all helplines, first aid. |
| **Bottom navigation** | Mobile/tablet only | Home · Hospitals · **SOS** · Assistant · Wallet. SOS is raised into a centre well. |
| **Top navigation** | Desktop only | Full six-item nav plus a live CareCoins balance chip. |
| **Skip link** | Keyboard focus | First tab stop on every page. |
| **Footer** | Bottom | Two link columns, a Call 112 block, and the medical disclaimer. |

## Navigation depth

Every primary task is reachable in **two taps or fewer** from a cold start:

| Task | Taps |
|---|---|
| Call an ambulance | 1 (Ambulance quick action) or 2 (SOS → 108) |
| Find the nearest open ER | 1 (bottom nav → Hospitals, pre-sorted by distance) |
| Share your GPS with someone | 2 (SOS → Share location) |
| CPR instructions | 2 (First Aid → CPR) |
| Check CareCoins balance | 1 (bottom nav → Wallet) |
| Start a fundraiser for a cost you just saw | 1 ("Can't afford this?" on the hospital card) |

## Deep links registered in the PWA manifest

`/?sos=1` · `/hospitals?emergency=1` · `/first-aid` — long-pressing the
installed app icon jumps straight to these.

## The search → fundraiser handoff

The flow the product is built around:

```
/hospitals?t=valve-replacement
        │  user sees "₹4.8L – ₹12L at Shivalik PGMI"
        │  and taps "Can't afford this? Start a fundraiser"
        ▼
/fundraisers/start?hospital=h-chd-01&t=valve-replacement
        │  city, condition and a suggested goal are already filled in,
        │  anchored to THAT hospital's quoted band
        ▼
4 steps → campaign created as `unverified`, donations CLOSED
        ▼
hospital billing office confirms the estimate
        ▼
/fundraisers/:id  — public, verified badge, donations open
```

The goal anchor is the anti-fraud mechanism: a request far above the treating
hospital's own estimate is warned about, and hard-capped at 3×.

## Routes intentionally *not* built

- **Auth / onboarding.** Nothing in the emergency path is gated behind a login.
  Accounts become necessary only for the wallet and claims, and that should be
  a lazy, post-hoc prompt, not a wall.
- **Hospital staff verification portal.** A separate product with different
  users, different auth, and an audit requirement. `/hero` stubs the approval
  step behind a clearly-labelled demo control.
- **Payment checkout.** Deliberately stops at the gateway boundary.
