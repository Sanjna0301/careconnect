# CareConnect — Wireframes

Mobile is drawn first because it is the primary case: someone standing at a
roadside, one-handed, on a bad connection. Desktop is the adaptation.

---

## 1. Homepage — mobile (360–430 px)

```
┌──────────────────────────────────────────┐
│ ▣ CareConnect          [1,300] [🔴 SOS]  │ ← sticky glass header, 64 px
├──────────────────────────────────────────┤
│                                          │
│  ◆ 35 verified hospitals · 20 cities     │   trust pill
│                                          │
│  Get emergency medical                   │   h1, 2.1rem, 800 wt
│  help quickly.                           │
│                                          │
│  The nearest hospital that can actually  │   1.05rem, ink-700
│  treat you, what it will cost, and an    │
│  ambulance on the way — in under a       │
│  minute, on any phone.                   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 📞  EMERGENCY — CALL NOW           │  │ ← 64 px, alert-600
│  │     112 · free from any phone      │  │   3 px bottom edge = key press
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ 🏥  Find Nearby Hospital           │  │ ← 64 px, white + ring
│  └────────────────────────────────────┘  │
│                                          │
│  ⚠ More options — ambulance, share       │   text link
│    location, all helplines               │
├──────────────────────────────────────────┤
│  What is the problem?                    │
│  Type or say the injury, symptom or      │
│  treatment.                              │
│  ┌────────────────────────────────────┐  │
│  │ 🔍 Chest pain, dengue, dialysis… 🎤│  │ ← 64 px combobox + voice
│  └────────────────────────────────────┘  │
│     ┌──────────────────────────────┐     │
│     │ Heart Attack (Angioplasty)   │     │   listbox, opens on type
│     │ Heart (Cardiology)   [URGENT]│     │   ↑↓ / Enter / Esc
│     └──────────────────────────────┘     │
├──────────────────────────────────────────┤
│  Quick actions                           │
│  ┌───────┐ ┌───────┐ ┌───────┐           │
│  │  🚑   │ │  🏥   │ │  📍   │           │ ← 3 cols on phone
│  │Ambul. │ │Hospit.│ │Share  │           │   5 cols ≥640 px
│  │Call108│ │Nearby │ │ GPS   │           │
│  └───────┘ └───────┘ └───────┘           │
│  ┌───────┐ ┌───────┐                     │
│  │  🩹   │ │  📞   │                     │
│  │First  │ │Contact│                     │
│  │ Aid   │ │Helplin│                     │
│  └───────┘ └───────┘                     │
├──────────────────────────────────────────┤
│  Nearby emergency hospitals      See all→│
│  Based on your current location           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ┌──┐ Cauvery Advanced Medical      │  │
│  │ │🚑│ Koramangala, Bengaluru ·      │  │
│  │ └──┘ Private                       │  │
│  │      ★4.7 (7,120) · 2.4 km ~7 min  │  │
│  │                                    │  │
│  │ [ER open 24×7][31 ICU free]        │  │ ← status chips
│  │ [Level-1 Trauma][Blood bank][NABH] │  │
│  │                                    │  │
│  │ 💰 Cashless under Ayushman Bharat  │  │
│  │    · CareCoins accepted            │  │
│  ├────────────────────────────────────┤  │
│  │  [ 📞 Call ]    [ 🧭 Directions ]  │  │ ← tinted action tray
│  └────────────────────────────────────┘  │
│  … 2 more cards …                        │
├──────────────────────────────────────────┤
│  Beyond the emergency                    │
│  [AI Assistant] [Fundraisers] [Be a Hero]│ ← stacked on phone
├──────────────────────────────────────────┤
│  < 60 sec │ 112 · 108 │ Offline          │ ← reassurance band
├──────────────────────────────────────────┤
│  Footer · links · ⚠ medical disclaimer   │
└──────────────────────────────────────────┘
      ┌────┬────┬─────┬────┬────┐
      │ 🏠 │ 🏥 │ (🚑)│ 🤖 │ 💰 │  ← fixed bottom nav
      │Home│Hosp│ SOS │Asst│Wall│     SOS raised 24 px into
      └────┴────┴─────┴────┴────┘     its own centre well
```

### Homepage — desktop (≥1024 px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ ▣ CareConnect  Home Hospitals Assistant Fundraisers Hero First Aid    │
│                                        [💰 1,300 coins] [🔴 EMERGENCY]│
├───────────────────────────────────────────────────────────────────────┤
│                                    ░░ radial light wash, top-right ░░ │
│  ◆ 35 verified hospitals              ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐        │
│                                        │  back plane  z −40px │        │
│  Get emergency medical                 │  route map, med-700  │        │
│  help quickly.                        └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘        │
│                                       ┌──────────────────────┐        │
│  The nearest hospital that can        │ mid plane   z +24px  │        │
│  actually treat you, what it will     │ hospital card, white │        │
│  cost, and an ambulance on the way.   │ [ER open][31 ICU]    │        │
│                                       │ [ Call now ]         │        │
│  ┌──────────────────┐ ┌─────────────┐ └──────────────────────┘        │
│  │📞 EMERGENCY—CALL │ │🏥 Find      │        ┌────────────────┐       │
│  │   112 free       │ │  Hospital   │        │ front  z +64px │       │
│  └──────────────────┘ └─────────────┘        │ 🔴 ETA  6 min  │       │
│                                              └────────────────┘       │
│  ⚠ More options                         ╲___ ground shadow ___╱       │
├───────────────────────────────────────────────────────────────────────┤
│  Search (full width) · Quick actions (5 across)                       │
│  Nearby hospitals — 3-up grid                                         │
└───────────────────────────────────────────────────────────────────────┘

  The three hero planes share one rotateX/rotateY driven by pointer
  position (±7°) on a 1200 px perspective stage. Disabled entirely on
  touch and under prefers-reduced-motion.
```

---

## 2. Wallet / Profile — mobile

```
┌──────────────────────────────────────────┐
│ ▣ CareConnect          [1,300] [🔴 SOS]  │
├──────────────────────────────────────────┤
│  My wallet                 ↺ Reset demo  │
│  CareCoins you have earned by helping.   │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ░ radial light catch, top-left ░     │ │  ← the one card that
│ │                                      │ │    uses a gradient:
│ │ ◆ CARECOINS BALANCE                  │ │    med-700 → med-950
│ │                                      │ │    at 160°, inset top
│ │   1,300 coins                        │ │    highlight + e4 shadow
│ │   Worth up to ₹1,300 off bills       │ │
│ │ ─────────────────────────────────────│ │
│ │  1,100      300        2             │ │
│ │  earned     redeemed   verified      │ │
│ │                        rescues       │ │
│ │                                      │ │
│ │ [ Redeem on a bill ] [ Earn more ]   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ⚠ 500 coins expire on 12 Jul 2028.   │ │  ← only when within 60 d
│ │   Coins last 24 months.              │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ 🛡 1 claim waiting on hospital        │ │  ← only when pending > 0
│ │   verification — worth 500 coins.    │ │
│ │   Track them →                       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 📈 Lifetime earned    1,100 / 2,000  │ │
│ │ ████████████░░░░░░░░░░               │ │
│ │ 900 more coins to the next milestone │ │
│ └──────────────────────────────────────┘ │
│                                          │
│  Transaction history                     │
│  Every credit and debit, with its source │
│ ┌──────────────────────────────────────┐ │
│ │ ↙ Verified rescue — cardiac    +500  │ │  ← credits green,
│ │   17 d ago · ref rc-1188             │ │    debits blue
│ │   · expires 12 Aug 2028              │ │
│ ├──────────────────────────────────────┤ │
│ │ ↗ Redeemed against X-ray       −300  │ │
│ │   30 d ago · ref bill-CAM-77120      │ │
│ ├──────────────────────────────────────┤ │
│ │ ↙ First-aid certification      +100  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│  ── rail collapses below the ledger ──   │
│  ⓘ How CareCoins work                    │
│    • 1 coin = ₹1 off a hospital bill     │
│    • 500 coins per verified rescue       │
│    • Up to 20% of any single bill        │
│    • Expire after 24 months              │
│    • Non-transferable, non-cashable      │
│                                          │
│  🏢 Partner hospitals (28)               │
│  🏅 Other ways to earn                   │
├──────────────────────────────────────────┤
│  Footer                                  │
└──────────────────────────────────────────┘
      ┌────┬────┬─────┬────┬────┐
      │Home│Hosp│ SOS │Asst│●Wal│
      └────┴────┴─────┴────┴────┘
```

### Wallet — desktop (≥1024 px): two columns, `1fr 20rem`

```
┌────────────────────────────────────────┬─────────────────────┐
│ ╔════════════════════════════════════╗ │ ⓘ How CareCoins work│
│ ║ ◆ CARECOINS BALANCE                ║ │   • 1 coin = ₹1     │
│ ║   1,300 coins                      ║ │   • 500 / rescue    │
│ ║   Worth up to ₹1,300               ║ │   • 20% bill cap    │
│ ║  1,100 earned │ 300 spent │ 2 saved║ │   • 24-month expiry │
│ ║ [Redeem on a bill] [Earn more]     ║ │   ─────────────     │
│ ╚════════════════════════════════════╝ │   Why the 20% cap   │
│ ⚠ expiry warning                       │   exists            │
│ 🛡 pending claims                       ├─────────────────────┤
│ 📈 lifetime progress                    │ 🏢 Partners (28)    │
│                                        │   scrollable list   │
│ Transaction history                    ├─────────────────────┤
│ ┌────────────────────────────────────┐ │ 🏅 Other ways       │
│ │ ledger rows, full width            │ │   Rescue      +500  │
│ └────────────────────────────────────┘ │   BLS course  +100  │
│                                        │   Blood donat.+250  │
└────────────────────────────────────────┴─────────────────────┘
```

### Redemption sheet (bottom sheet on phone, centred dialog ≥640 px)

```
┌──────────────────────────────────────────┐
│               ───                     ✕  │ ← drag affordance
│  Redeem CareCoins                        │
│  See exactly what comes off before you   │
│  commit anything.                        │
│                                          │
│  Hospital bill amount                    │
│  ┌────────────────────────────────────┐  │
│  │ 12000                              │  │
│  └────────────────────────────────────┘  │
│  Partner hospital                        │
│  ┌────────────────────────────────────┐  │
│  │ Select a hospital…              ▾  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ Bill                      ₹12,000  │  │
│  │ Your balance            1,300 coins│  │
│  │ Cap (20% of bill)          ₹2,400  │  │
│  │ ───────────────────────────────────│  │
│  │ Coins applied             −₹1,300  │  │  ← green
│  │ You pay                   ₹10,700  │  │  ← 1.25rem, 800 wt
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │      Apply 1,300 coins             │  │
│  └────────────────────────────────────┘  │
│  In production this generates a one-time │
│  code the billing desk enters.           │
└──────────────────────────────────────────┘
```

---

## Layout rules applied throughout

| Rule | Value |
|---|---|
| Base font size | 17 px on mobile, 16 px ≥768 px |
| Minimum tap target | 48 × 48 px, enforced in the base layer |
| Side gutter | 16 px phone, 24 px ≥640 px |
| Content max width | 7xl (80rem) shell; 4xl on reading-heavy pages |
| Card radius | 16 px (`--radius-card`) |
| Elevation steps | e1 → e4, one light source, top-centre |
| Emergency red | Reserved for 112/108, SOS, and critical lab values. Nothing else. |
| Grid | 1 col phone · 2 col ≥768 px · 3 col ≥1280 px |
| Motion | All transitions ≤ 260 ms; everything disabled under `prefers-reduced-motion` |
