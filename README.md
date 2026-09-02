# Period Mirror

A privacy-first personal menstrual health companion — built as a **mobile-first
Progressive Web App** that looks and behaves like a premium native app, and is
architected so the domain logic can move to a real iOS/Android app with minimal
rework.

> **Not a medical device.** Period Mirror summarises information you record and
> highlights changes compared with *your own* history. It does not diagnose,
> treat, or give medical advice.

**▶ Live demo:** https://jtroshani.github.io/period-mirror/ &nbsp;·&nbsp;
**Open offline:** download the repo and double-click [`docs/index.html`](docs/index.html)
(one self-contained file — no server, no build).

---

## Product concept

Period Mirror is **not** primarily a period-prediction app. Its purpose:

**Help a person understand what is normal for their own body, and recognise when
something meaningfully changes.**

The core idea is **"Me vs. Me"** — instead of comparing you to a generic
"average", the app gradually builds your **Personal Menstrual Profile** and
compares each new cycle against your own recent baseline. Language stays
non-diagnostic throughout ("different from your usual", "trend", "consider
discussing with a healthcare professional").

---

## Current prototype capabilities

- **Onboarding** — 4 short intro screens + a minimal "essentials" form.
- **Demo Mode** — one tap loads ~6 months of realistic, clearly-fictional data
  for a fictional profile ("Sam Rivera"): six broadly consistent cycles, a
  gradual increase in cycle length, a gradual decrease in period-night sleep,
  and a **current cycle with clearly higher Day 1–3 pain (8/9/7), lower energy
  and an extra heavy-bleeding day**.
- **Today** — greeting, current-cycle ring, "How do I feel today?" check-in,
  one-tap quick log, "Today's Mirror" insight, today's history, proportionate
  safety notice when warranted.
- **How do I feel today?** — free-text → structured items you confirm / edit /
  remove before saving. If pain severity is missing it asks for a 0–10 value.
  Runs as an **on-device heuristic extractor**; isolated behind an
  `AIExtractionService` interface so a real model can replace it.
- **Calendar** — month grid distinguishing **recorded** vs **predicted** days,
  pain / symptom markers, optional predicted fertile window, tap-a-day detail
  sheet with edit.
- **My Mirror** — "Your usual pattern", "This cycle vs. your usual" comparison
  cards, "Changes worth noticing" (NOTICE / TREND), a "Learning your pattern"
  progress state, and a **"Why am I seeing this?"** drawer that shows the exact
  recorded numbers behind every insight.
- **My Health Report** — 3 / 6 / 12-month or custom range; a clean one-page
  doctor-friendly summary (cycle summary, pain, bleeding, symptoms, energy,
  sleep, other signals, "patterns worth discussing", 6-month timeline);
  Preview, **Download PDF** (print-optimised), Share, Save.
- **Privacy Center** — per-purpose consent toggles, export (JSON), delete,
  connected-device permissions, revocable shared reports.
- **Connected devices** — mock Apple Health / Health Connect / Fitbit / Garmin /
  Oura / Apple Watch connectors that add clearly-labelled sample vitals.
- **Subscription** — Free / Premium / Professional tiers shown; no real
  payments; Demo Mode runs as Premium so premium features are visible.
- **Profile / Settings**, **About**, **Medical disclaimer**, **Demo reset**.
- **PWA** — installable, offline app shell via `vite-plugin-pwa`.
- **Light + dark** — full token swap; light is the primary design.

---

## Technology stack

| Concern | Choice | Why |
| --- | --- | --- |
| UI | **React 18 + TypeScript + Vite** | requested; fast, standard |
| Styling | **Tailwind CSS v3** + CSS-variable design tokens | one source of truth for theming, small CSS |
| State | **Zustand** | tiny, no boilerplate, easy to persist behind a service |
| Routing | **react-router-dom v6** | standard |
| Charts | **hand-built inline SVG** (`Sparkline`, `ComparisonBar`, `CycleRing`, `MiniBars`, `Timeline`) | avoids a heavy chart dependency; full control over the calm, legible visual language; print-friendly |
| PDF | **print-optimised layout + `window.print()`** | reliably produces a clean, professional document with no extra dependency (html-to-canvas libraries produce worse output) |
| PWA | **vite-plugin-pwa** (Workbox) | installable app shell |
| Tests | **Vitest** (+ jsdom for one flow test) | engine unit tests, route render smoke tests, a client journey test |

No analytics, no trackers, no third-party runtime services.

---

## Project structure

```
src/
  models/            # all domain types (User, Cycle, DailyHealthEntry, PersonalBaseline, …)
  utils/             # date, statistics, formatting, id, download
  services/          # side-effectful capabilities behind interfaces
    storage/         #   StorageService  → LocalStorageService (swap for native/encrypted)
    ai/              #   AIExtractionService → MockAIExtractionService (swap for real model)
    integrations/    #   DeviceIntegrationService → Mock… (swap for Apple Health etc.)
    report/          #   ReportService (pure report generation)
  engine/            # pure, testable domain logic — NO browser APIs
    cycles.ts        #   derive cycles + predictions + phases from entries
    baseline/        #   Personal Baseline Engine + current-cycle comparison
    insights/        #   NORMAL / NOTICE / TREND / INSUFFICIENT_DATA insight system
    safety/          #   configurable, non-diagnostic safety notices
  demo/              # seeded ~6-month fictional dataset
  store/             # Zustand store + derived-state hooks (selectors)
  components/        # ui primitives, charts, nav, layout
  screens/           # Welcome, Onboarding, Today, CheckIn, Log, Calendar, Mirror, Report, Profile/*
  branding/          # brand.ts (rename in one place) + Wordmark
  design-system/     # tokens.css
```

**Business logic is separated from presentation.** Screens read derived data
from `store/selectors.ts`; those call `engine/*`; `engine/*` is framework-free
and unit-tested.

---

## Install

```bash
npm install
```

Requires Node 18+ (developed on Node 22).

## Run locally

```bash
npm run dev        # http://localhost:5173  (open on a phone via --host)
npm run build      # typecheck + production build to dist/  (needs a static server / PWA host)
npm run preview    # serve the production build
npm run test       # vitest: engine unit tests + route smoke tests + client flow
npm run typecheck  # tsc --build, no emit
```

Open in a mobile viewport (375–430px) or install as a PWA for the intended
experience. On desktop the app is centred in a device-style frame.

### Just open it — no server

- **Live:** https://jtroshani.github.io/period-mirror/
- **Offline:** open [`docs/index.html`](docs/index.html) directly (it's in the repo).

`docs/` is produced by:

```bash
npm run build:standalone   # → dist-standalone/index.html   (open from disk)
npm run build:pages        # → docs/  (same, hash-routed for GitHub Pages + 404 fallback)
```

Everything (JS + CSS) is inlined into the one HTML file; it uses hash-based
routing so it runs from `file://` or any sub-path host with no config. These
builds have no service worker — use `npm run build` for the installable PWA.

### Environment variables

The prototype needs **none** — it runs fully on-device with mocked AI and
wearable data. `.env.example` documents placeholders for future integrations.
Only `VITE_`-prefixed vars reach the client; provider secrets must live on a
server, never in the bundle.

---

## How Demo Mode works

`src/demo/demoData.ts` deterministically generates an `AppSnapshot` (seeded PRNG,
so it's stable across reloads):

- 7 period starts → **6 completed cycles + 1 ongoing (Day 3 today)**.
- Cycle gaps `[28, 29, 30, 31, 32, 33]` → mean ≈ 30.5 days and a clear upward
  trend (baseline engine reports a `cycle_length` **TREND**).
- Per-cycle period-night sleep trends down (`6.8h → 6.1h`, current `6.0h`).
- Normal cycles: Day 1–3 pain ≈ `[4, 5, 3]`, one heavy day per period.
- **Current cycle**: Day 1–3 pain `[8, 9, 7]`, energy −1, two heavy days, added
  nausea/fatigue — meaningful but non-alarming deviations.
- ~20% of ordinary days are intentionally left unlogged (realistic partial
  logging); period + late-luteal days are always logged.
- Mock wearable vitals (resting HR, HRV, biphasic temperature, occasional
  weight) tagged `demo_wearable`.
- Consent: on-device processing + AI + wearable sync + report sharing on;
  analytics + crash diagnostics off. Subscription tier: `premium`.

"Reset demo" / "Exit demo" live on the Profile screen.

---

## How the baseline engine works

`engine/baseline/baselineEngine.ts` → `buildBaseline(entries, user)`:

1. Derive cycles from bleeding days (`engine/cycles.ts`).
2. Use up to the **last 6 completed cycles** as the analysis window.
3. Compute transparent summaries (`n / mean / median / SD / min / max`) for:
   cycle length, period duration, **Day 1–3 pain per cycle**, period-night
   sleep, overall energy, heavy days per cycle; plus pain-by-cycle-day,
   sleep-by-phase, symptom frequency, and bleeding-level distribution.
4. **Readiness**: `starting → learning → improving → ready` (ready at 4
   completed cycles) with a progress fraction and message.
5. **Trends**: least-squares slope over the last ≤4 cycles for cycle length,
   early-period pain, period sleep and energy; emitted only when the slope
   passes a per-metric threshold.

`engine/baseline/comparison.ts` → `compareCurrentCycle(...)` builds
`MetricComparison` rows: `currentValue`, `baselineValue`, absolute + percentage
difference, `direction`, `confidence` (from how many cycles of history exist),
`severity` (`none / slight / notable / marked` from point-thresholds), and a
plain-language `explanation` that always states the exact numbers used.

`engine/insights/insightEngine.ts` turns those into `PatternInsight`s with
category `NORMAL / NOTICE / TREND / INSUFFICIENT_DATA`, evidence rows, and — for
pain / heavy-bleeding / cycle-length changes — a neutral "consider discussing
with a healthcare professional" line. Nothing is escalated from a single data
point; insufficient history is labelled, not hidden.

There is **no risk score and no diagnosis anywhere in the engine.**

---

## Medical-safety approach

`engine/safety/safetyEngine.ts` holds a small, editable rule table matching only
**emergency-adjacent wording / values** (fainting, "can't stand", soaking
through, "worst pain", chest pain / trouble breathing, very high recorded pain,
heavy bleeding with clots). When matched it shows one calm, proportionate
`SafetyBanner`:

> "Some symptoms can need prompt medical attention. If you are experiencing
> severe symptoms, feel unsafe, or think this may be an emergency, contact a
> healthcare professional or your local emergency service."

It never interprets cause or severity. Ordinary symptoms produce nothing.

---

## Privacy considerations

- **On-device by default** — all app data is stored in `localStorage` behind a
  `StorageService` interface; nothing is sent anywhere.
- **Privacy Center** — granular consent for on-device processing, AI
  processing, wearable sync, report sharing, analytics, crash diagnostics.
  Analytics + diagnostics are **off** by default.
- **No ad-tech** — no advertising SDKs, no third-party trackers.
- **Export / delete** — full JSON export and one-tap delete-everything.
- **Shared reports** are represented as revocable link *records*; no file
  leaves the device in the prototype.
- **No secrets in the bundle** — env support is prepared; provider keys belong
  on a server.

---

## Current limitations

- On-device `localStorage` only — no accounts, no sync, no encryption at rest yet.
- AI extraction is a **regex/keyword heuristic**, not a language model. It
  covers common phrasings; unusual wording may be missed.
- Wearable/health-platform connectors are **mocked** and insert sample data.
- Predictions use a simple rolling average; irregular cycles will predict poorly.
- PDF export uses the browser print dialog ("Save as PDF"); there is no
  server-side renderer.
- Fonts load from Google Fonts (system-font fallback stack if offline).
- Not audited for clinical accuracy — it is an informational tracking tool.

---

## Future roadmap

- Authentication + **encrypted cloud sync** (opt-in, end-to-end).
- Real **Apple Health** / **Health Connect** adapters; **Apple Watch, Fitbit,
  Garmin, Oura** wearable APIs (interfaces already in place).
- Real **AI extraction** + summarisation behind the existing `AIExtractionService`
  (server-proxied so keys stay off-device).
- Local **push notifications** (gentle check-in reminders, predicted period,
  new insight) — off by default.
- **Native iOS/Android app** (React Native / Expo) reusing `models/`, `engine/`
  and `services/*` interfaces unchanged.
- **Clinician sharing** + a **professional dashboard** / pre-appointment
  report delivery.
- Richer baseline modelling (phase-aware, seasonality, wearable-informed) while
  keeping every insight explainable and non-diagnostic.
