# CareConnect

Emergency medical assistance for India — the nearest hospital that can actually
treat you, what it costs there, an ambulance on the way, and a reward system
for people who stop to help a stranger.

> **Prototype build. Not for clinical use.**
> Hospital names, costs, ratings and bed counts are seed data.
> The national emergency numbers (112, 108, 102, 1098, 14416) are real.

---

## Contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start-your-computer)
- [Run it on your phone](#run-it-on-your-phone)
- [Install it as an app (PWA)](#install-it-as-an-app-pwa)
- [Test it offline](#test-it-offline)
- [All commands](#all-commands)
- [Deploy it](#deploy-it)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)

---

## Prerequisites

**Bun 1.2 or newer.** That is the only requirement — no Node.js needed.

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Already have Homebrew
brew install oven-sh/bun/bun
```

Check it worked:

```bash
bun --version      # should print 1.2.x or higher
```

---

## Quick start (your computer)

```bash
cd careconnect
bun install
bun run dev
```

Open **http://localhost:5173**.

Everything works on `localhost`, including geolocation, voice search and the
service worker — browsers treat `localhost` as a secure origin.

---

## Run it on your phone

This is the case the app is actually designed for, so it is worth doing.

### Step 1 — put both devices on the same Wi-Fi

Your laptop and your phone must be on the same network. A guest network or a
VPN on either device will usually block this.

### Step 2 — start the dev server with HTTPS

```bash
bun run dev:https
```

**Use `dev:https`, not `dev`.** Geolocation, the microphone and the service
worker only run in a *secure context*. `localhost` counts as one;
`http://192.168.x.x` does not. Without TLS, the phone will load the app but
"Use my location" and voice search will silently fail.

### Step 3 — find your address

```bash
bun run ip
```

```
Open one of these on your phone (same Wi-Fi network):

  https://192.168.31.195:5173      (en1)
```

Vite also prints it on startup as the `Network:` line.

### Step 4 — open it and accept the certificate

Type the `https://…:5173` address into your phone's browser.

The certificate is **self-signed**, so you will get a warning once:

| Browser | What to tap |
|---|---|
| Chrome / Android | **Advanced** → **Proceed to 192.168.x.x (unsafe)** |
| Safari / iOS | **Show Details** → **visit this website** → **Visit Website** |

This is expected. It is your own laptop, on your own Wi-Fi.

### If the certificate warning blocks you

iOS Safari is occasionally strict about self-signed certificates. A tunnel
gives you a real, trusted certificate and also works over mobile data:

```bash
# Terminal 1
bun run dev

# Terminal 2 — install with: brew install cloudflared
cloudflared tunnel --url http://localhost:5173
```

Cloudflare prints a public `https://something.trycloudflare.com` URL. Open that
on your phone. Every browser feature works, from anywhere.

### What to try once it is open

| Feature | How to check it |
|---|---|
| **Emergency SOS** | Tap the red 🚑 in the centre of the bottom bar. |
| **Real phone dialling** | Tap **Call 112** — your dialler should open with 112 pre-filled. *(It will not place the call until you press the call button.)* |
| **Geolocation** | Home → **Use my location**. Allow the prompt; distances and drive times appear on the hospital cards. |
| **Voice search** | Tap the 🎤 in the search bar, say *"chest pain"*. Chrome and Safari 16+ only. |
| **Share location** | Quick actions → **Share Location**. The native share sheet opens with a maps link. |
| **Read aloud** | First Aid → CPR → **Read aloud**. |
| **Report reader** | Assistant → 📎 → upload a `.txt` file containing a line like `Haemoglobin 9.2 g/dL`. |

---

## Install it as an app (PWA)

Once the page is open on your phone:

- **Android / Chrome** — ⋮ menu → **Add to Home screen**
- **iOS / Safari** — Share button → **Add to Home Screen**

It launches full-screen with no browser chrome. Long-pressing the icon on
Android exposes shortcuts straight to **Call an ambulance**, **Nearest
hospital** and **First aid**.

> The service worker only registers in production builds. To test the installed
> app properly, use `bun run build && bun run preview:https` rather than the
> dev server.

---

## Test it offline

Offline support is a real feature, not a claim — first aid and the emergency
numbers must work with no signal.

```bash
bun run build
bun run preview:https
```

Then on your phone:

1. Open the app and visit **First Aid** once.
2. Turn on **aeroplane mode**.
3. Reload the page.

The app shell, first-aid guides and helplines still load. Anything needing the
network degrades with a message instead of a blank screen.

---

## All commands

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on `http://localhost:5173`, also exposed on your LAN |
| `bun run dev:https` | Same, over HTTPS — **use this for phone testing** |
| `bun run ip` | Prints the LAN addresses to open on your phone |
| `bun run build` | Production build into `dist/` |
| `bun run preview` | Serves the built app on `http://localhost:4173` |
| `bun run preview:https` | Serves the built app over HTTPS — use this to test the PWA |
| `bun run typecheck` | `tsc -b` across the app, node and test projects |
| `bun test` | 41 unit tests — geo, cost maths, triage, report parser, wallet |
| `bun run smoke` | Server-renders all 14 routes, fails on any throw |
| `bun run verify` | **typecheck → test → smoke → build.** Run this before you commit. |

```bash
bun run verify
```

```
41 pass  0 fail
All 14 routes rendered without error.
✓ built in 823ms
```

---

## Deploy it

Full guide: **[docs/DEPLOY.md](docs/DEPLOY.md)**

### Vercel (recommended)

```bash
bunx vercel --prod
```

Or import the repo at **vercel.com/new** and accept the detected settings —
[`vercel.json`](vercel.json) supplies the build command, the SPA rewrite, cache
headers and security headers.

**Commit the staged cleanup first.** This repo previously tracked
`node_modules/` and `dist/`; they are now untracked but the change is not yet
committed:

```bash
git add -A
git commit -m "Add deployment config; stop tracking build artifacts"
git push origin main
```

### Docker (self-hosting only)

**Vercel does not use the Dockerfile** — it builds the repo directly. The image
is for container hosts: Fly.io, Railway, Cloud Run, Kubernetes, a VPS.

```bash
docker build -t careconnect .
docker run --rm -p 8080:80 careconnect     # → http://localhost:8080
```

Two stages: Bun builds, `nginx:alpine` serves. No Bun or Node at runtime,
roughly 55 MB. TLS is expected to terminate in front of it.

### Any other static host

The output is plain static files in `dist/`. Whatever you use, it **must**
rewrite unknown paths to `/index.html`, or refreshing on `/wallet` will 404.
Netlify, Cloudflare Pages and Nginx recipes are in
[docs/DEPLOY.md](docs/DEPLOY.md).

HTTPS is **mandatory in production** — geolocation, the microphone and the
service worker refuse to run on an insecure origin.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `bun: command not found` | Bun is not on your `PATH`. Restart your terminal, or run `source ~/.zshrc`. |
| Phone cannot reach the address at all | Different Wi-Fi networks, a VPN on either device, or your firewall. On macOS: System Settings → Network → Firewall → allow incoming connections. |
| Page loads but **"Use my location" does nothing** | You are on `http://`. Restart with `bun run dev:https` and use the `https://` address. |
| Microphone button is missing | The Web Speech API is unavailable in that browser. The button hides itself rather than offering a dead control. Try Chrome or Safari 16+. |
| Certificate warning will not go away on iOS | Use the `cloudflared` tunnel above — it serves a genuinely trusted certificate. |
| Offline mode does not work | The service worker only runs in production. Use `bun run build && bun run preview:https`. |
| Refresh on `/wallet` gives a 404 in production | Your host is not rewriting to `index.html`. See [Deploy it](#deploy-it). |
| Wallet shows unexpected coins | Balances persist in `localStorage`. Use **Reset demo data** on `/wallet`, or clear site data. |
| Port 5173 already in use | `bun run dev -- --port 5174`, or `lsof -ti:5173 \| xargs kill`. |

---

## What is built

| Feature | Route | State |
|---|---|---|
| Emergency SOS — 112/108, share GPS, all helplines | global overlay | Working |
| Hospital locator — radius, budget, rating, speciality, scheme filters | `/hospitals` | Working on seed data |
| Condition search — symptoms, diseases, Hindi transliterations, voice | `/hospitals`, `/` | Working |
| Cost bands — national band × price tier × city index | `/hospitals?t=…` | Derived, explainable |
| "Best in India" national ranking per speciality | `/hospitals?t=…` | Working |
| AI assistant — red-flag symptom triage | `/assistant` | Rule-based, works offline |
| Lab report reader — 11 analytes against reference ranges | `/assistant` | Real parsing, text files |
| Crowdfunding — verified documents and a disbursement trail | `/fundraisers` | Working, payments stubbed |
| CareConnect Hero — rescue claims, hospital verification | `/hero` | Working, approval stubbed |
| CareCoins wallet — ledger, expiry, 20% redemption cap | `/wallet` | Working, `localStorage` |
| First aid — 8 guides, read-aloud, offline | `/first-aid` | Working |
| Emergency contacts — helplines plus your own people | `/contacts` | Working |

Full detail on what production still needs is in
[docs/TECH-STACK.md](docs/TECH-STACK.md).

---

## Docs

- **[Site map](docs/SITEMAP.md)** — every route, global chrome, navigation depth
- **[Technology stack](docs/TECH-STACK.md)** — what is built, what production still needs
- **[Wireframes](docs/WIREFRAMES.md)** — homepage and wallet, mobile and desktop
- **[Deployment](docs/DEPLOY.md)** — Vercel, Docker, other hosts, and what to check after shipping

---

## Project structure

```
careconnect/
├── index.html              app entry, fonts, noscript fallback with 112
├── vite.config.ts          build config, optional HTTPS, LAN host
├── vercel.json             Vercel build, SPA rewrite, cache + security headers
├── Dockerfile              self-hosting only — Vercel ignores this
├── docker-compose.yml      convenience wrapper for the image
├── docker/                 nginx config + shared security headers
├── public/
│   ├── sw.js               service worker — offline shell
│   ├── manifest.webmanifest PWA manifest with emergency shortcuts
│   └── favicon.svg
├── scripts/
│   ├── smoke.tsx           renders all 14 routes, fails on any throw
│   └── ip.ts               prints LAN addresses for phone testing
├── docs/                   site map, tech stack, wireframes
└── src/
    ├── App.tsx             routes — Home eager, everything else split
    ├── styles/index.css    design tokens, elevation, motion prefs — one file
    ├── components/
    │   ├── ui/             Button, Card, Badge, Field, Sheet, Progress,
    │   │                   Skeleton, Announcer (toast + ARIA live in one)
    │   ├── layout/         Header, BottomNav, SosSheet, Hero3D, QuickActions
    │   └── hospital/       HospitalCard, TreatmentSearch, Filters
    ├── pages/              ten route components
    ├── data/               hospitals, treatments, campaigns, first aid,
    │                       helplines, city centres
    ├── store/              location + wallet contexts, CareCoins ledger
    ├── lib/                geo, format, triage, reportParser, speech, storage
    └── __tests__/          41 unit tests
```

---

## Design system — "Calm Depth"

Depth communicates hierarchy; it is never decoration. One light source,
top-centre, drives every shadow. Cards carry a 1 px inset top highlight so they
read as having thickness. Buttons have a darker bottom edge that compresses on
`:active`, like a physical key. The hero's 3D parallax and card lift run **only**
on fine pointers, and everything stops under `prefers-reduced-motion`.

Alert red is reserved for emergency actions, warnings and critical lab values.
It appears nowhere else.

**Accessibility:** 17 px base type · 48 px minimum tap targets · 3 px focus
rings, white on red surfaces · skip link · focus-trapped dialogs with Escape and
focus restore · full combobox keyboard support · one announcer driving both
toasts and ARIA live regions · voice search where supported and hidden where not
· read-aloud first aid · `prefers-reduced-motion` and `prefers-contrast`
honoured.
