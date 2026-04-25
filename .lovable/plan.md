# UNMAPPED — Build Plan

A high-performance, low-bandwidth React app for surfacing informal-economy skills, built frontend-only with seeded JSON shaped to match a future FastAPI backend.

## Visual System
- **Light mode only**, pure white (#FFFFFF) backgrounds
- Primary text: `#111827` (gray-900) · Muted: `#6B7280`
- Accents: **Electric green `#10B981`** (durable skills, positive signals) · **Alert amber `#F59E0B`** (at-risk skills, warnings)
- System font stack (Inter/Roboto fallback) — no web font downloads
- Data-dense, tight spacing, sharp corners, monospaced numerics for econometric figures
- No hero images; SVG-only icons and lightweight charts (recharts)

## Global Configuration Layer
- React Context `LocaleContext` swaps **language strings, currency (GHS/PKR), wage floors, education taxonomy, region labels** via a single toggle
- Two seeded locale packs: `locales/ghana.json`, `locales/pakistan.json`
- **Dev Settings drawer** (gear icon, top-right) with:
  - Country toggle: Ghana 🇬🇭 / Pakistan 🇵🇰
  - View toggle: **User (Amara)** / **Policymaker (Admin)**
  - Reset onboarding state

## Routing (TanStack Start, separate routes for SSR/SEO)
- `/` — Landing → CTA into onboarding
- `/onboarding` — Wizard (Screen 1)
- `/profile` — Portable Skills Profile (Screen 2)
- `/readiness` — AI Readiness & Displacement Lens (Screen 3)
- `/opportunities` — Honest Opportunity Matching (Screen 4)
- `/skills-card` — Exportable Skills Card (Screen 5)
- `/admin` — Policymaker Dashboard

State (current user profile, locale, view mode) persisted to `localStorage` so the 2G flow survives reloads.

## Screen 1 — Onboarding Wizard
- Conversational, one question per step, large tap targets
- Steps: Name → Age → Region → **Informal work history textarea with mic icon** (voice-to-text mocked: clicking mic shows "Listening…" then auto-fills a sample narrative)
- Progress dots, swipe-friendly, all client-side
- Submission feeds a **mock Skills Signal Engine** (`lib/skillsEngine.ts`) that parses keywords → returns ESCO/ISCO-08 tagged skills

## Screen 2 — Portable Skills Profile
- Card list: each skill shows plain-language label ("Business Ops") with metadata badge expanding to ISCO-08 + ESCO codes
- **Durable** (green pill) vs **At Risk** (amber pill) classification
- Source line: "Extracted from: 'I've run a phone repair business…'"

## Screen 3 — AI Readiness & Displacement Lens
- Big circular gauge: **Automation Risk Score** (e.g., 38% LOW), color-graded
- Note: "Calibrated for LMIC context · Frey-Osborne adjusted"
- **Wittgenstein Demand Trend** line chart 2025–2035 for user's region
- **Resilience Suggestion** card: "Learn IoT Repair → +42% resilience" with CTA

## Screen 4 — Honest Opportunity Matching
- 3–5 match cards (e.g., Electronics Tech, Solar Installer)
- Every card surfaces **two econometric signals visibly**:
  - 💵 ILO Wage Floor (GHS 1,850/mo or PKR equivalent)
  - 📈 Sector Growth arrow (+/-% with direction)
- **Search bar** "Find local training providers" — mocked Tavily results (seeded provider list per region) with realistic latency
- Match-strength bar per card

## Screen 5 — Skills Card Export
- Digital ID-card layout: name, region, validated skills, QR placeholder, issue date
- Buttons:
  - **Download PDF** — generates client-side via `jspdf`
  - **Share via QR** — modal with generated QR (qrcode lib) encoding a profile JSON
  - **Send SMS Summary** — modal with phone input + preview of plaintext SMS (mocked send confirmation)

## Admin View — Policymaker Dashboard
- Switched on via dev settings toggle (no auth)
- Top stat cards: **Youth NEET rate (ILO)**, **HCI Score (World Bank)**, **Enrollment (UNESCO)** — all from seeded JSON, locale-aware
- **Skill Gap Heatmap by district** — SVG grid heatmap (no map tiles → 2G friendly), districts seeded per country
- **Claude AI Insights panel** — static rotating policy recommendations from seeded JSON, styled as AI output

## Performance & API-Readiness
- **PWA**: manifest + service worker caching shell + JSON fixtures for offline-first
- All data fetched via a single `lib/api.ts` adapter — currently reads `/data/*.json`, swap to FastAPI base URL via env var later
- JSON shapes documented in `types/api.ts` to mirror future FastAPI response models
- No images >5KB; SVG icons only; route-level code splitting via TanStack file routes
- Lighthouse target: small initial JS, works on throttled Slow 3G

## Out of Scope (this build)
- Real auth, real database, real Tavily/Claude calls, real PDF/SMS backend delivery
- All clearly stubbed behind the `lib/api.ts` adapter for easy swap-in later