# UNMAPPED — Skill Bridge Protocol

> **Open infrastructure for the informal economy.**
> An AI-powered platform that extracts, standardises, and certifies the hidden skills of informal workers — grounded entirely in institutional data from the World Bank, ILO, and Oxford research.

Built for the **World Bank Innovation Challenge 2026**.

---

## The Problem

**1.2 billion people** work in the global informal economy with no recognised credentials. A phone repair technician in Karachi, a tailor in Accra, a market vendor in Lagos — all carry real, valuable skills that are invisible to the formal labour market. They cannot access jobs, training subsidies, or loans because their skills are *unmapped*.

---

## What UNMAPPED Does

UNMAPPED is a **five-minute voice-to-credential pipeline**:

1. A worker narrates their work history in plain language (or speaks it)
2. The AI extracts and formally classifies their skills to the **ISCO-08 international standard**
3. Every skill is scored against the **Frey-Osborne (2013) Oxford automation risk table**
4. Tavily searches the live web for **city-specific labour market evidence**
5. The worker receives a portable **"Bridge Pass" PDF** — machine-readable, citable, printable

---

## Full Feature List

### Voice-to-JSON Narrative Intake

- Microphone button with ripple/pulse animation powered by the Web Speech API (`window.SpeechRecognition`)
- Continuous listening mode (`rec.continuous = true`) — does not cut off mid-sentence
- Streams interim transcription in real time to the textarea
- Graceful fallback with disabled mic icon if the browser does not support speech recognition
- Specific user-facing errors for `not-allowed`, `no-speech`, and `network` mic failures
- Narrative auto-saved to `localStorage` on every keystroke — zero data loss on timeout

### Deterministic Onboarding State Machine

- Four-step chat-style flow: name → age → region (city) → narrative
- `Phase` union type enforces: `idle → extracting → querying → standardizing → finalizing → done | error`
- Navigation to `/profile` only fires after the backend payload is fully validated (`skills.length > 0`)
- User's entered city is passed explicitly to the backend — never inferred from narrative text alone

### AI Skill Extraction Engine (Google Gemini)

- Primary model: `gemini-2.5-flash` (thinking model) with thinking budget capped at 512 tokens
- Fallback chain: `gemini-2.0-flash-lite` → `gemini-2.0-flash` on quota exhaustion (429/403)
- Robust JSON extraction with brace-counting parser — handles markdown fences and partial truncation
- Text extracted from both `response.text` and `candidates.content.parts` (required for thinking models)
- 8,192 max output tokens to prevent JSON truncation on long narratives

**Gemini's role is strictly limited to:**

- Parsing the narrative and identifying real demonstrated skills
- Mapping each skill to the correct **4-digit ISCO-08 occupation code**
- Classifying the ILO task-content type (cognitive / manual / routine)
- Extracting the user's city from the narrative text

**Gemini does NOT guess automation scores** — those come from the peer-reviewed Oxford lookup table.

### Frey-Osborne Automation Scoring (Oxford 2013)

- `backend/services/frey_osborne.py` — ~200 specific ISCO-08 4-digit codes mapped to their exact published probability from Frey & Osborne (2013) "The Future of Employment", Oxford Martin Programme
- Full ISCO sub-major group (2-digit) fallback for every occupation group
- ILO LMIC calibration applied: 20% discount for capital-labour cost dynamics in developing economies (ILO working paper 2019)
- ITU internet penetration (live from World Bank WDI) further adjusts scores — low penetration = automation delayed by ~1–2 years vs OECD baseline
- Example scores: Electronics repair ISCO 7421 → **0.29** (Durable); Data entry ISCO 4132 → **0.78** (At Risk)
- `status` field re-derived from the actual table score — never from AI output

### Post-Extraction Tavily Skill Enrichment

- `backend/services/skill_enricher.py` — runs after Gemini, in parallel for all skills
- One Tavily live web search per skill: `"[skill name]" jobs demand employment "[user city]" 2025 2026 informal economy`
- Resilience notes built from actual Tavily snippet + source URL — not fabricated
- If Tavily returns no results: note clearly states it is based on the Oxford 2013 paper only
- Parallel execution via `ThreadPoolExecutor` with 60-second per-skill timeout
- Graceful fallback per skill if Tavily fails — unenriched skill returned instead of crashing

### Live Institutional Data Layer (No API Keys Required)

- `backend/services/econometrics.py` — canonical open-API fetcher
- `backend/services/institutional_data.py` — 24-hour file cache layer

**World Bank WDI (unauthenticated, CC BY 4.0) — fetched live via `wbgapi`:**


| Indicator                  | WDI Code          | Source                                |
| -------------------------- | ----------------- | ------------------------------------- |
| Human Capital Index        | SP.HCI.OVRL       | World Bank Human Capital Project      |
| Gross secondary enrollment | SE.SEC.ENRR       | UNESCO Institute for Statistics       |
| Internet penetration (ITU) | IT.NET.USER.ZS    | International Telecommunication Union |
| Youth NEET rate            | SL.UEM.NEET.ZS    | ILO modelled estimates                |
| Vulnerable employment      | SL.EMP.VULN.ZS    | ILO modelled estimates                |
| GDP per capita PPP         | NY.GDP.PCAP.PP.CD | International Comparison Programme    |
| Output per worker          | SL.GDP.PCAP.EM.KD | ILO                                   |


**ILO ILOSTAT SDMX REST API (unauthenticated, CC BY 4.0):**

- Mean nominal monthly earnings: `EAR_INEE_SEX_ECO_NB_MON`
- Falls back to ILOSTAT published baseline from `locales.json` if endpoint unavailable

**Published baselines in `backend/config/locales.json`:**

- ILO Global Wage Report 2024 wage floors
- World Bank HCI 2024 published report
- Wittgenstein Centre SSP2 projections 2025–2035
- World Bank STEP Skills Measurement Programme returns to vocational training
- Frey-Osborne LMIC calibration notes

### AI Transparency Tooltips

Every skill badge is clickable and shows a full institutional explanation:

```
Classified as DURABLE: Non-routine manual/technical demand
(ILO Future of Work 2020) and 29% LMIC-adjusted automation
probability (Frey & Osborne 2013, Oxford Martin Programme).
LMIC calibration applied per ILO (2019) — capital-labour
cost ratios in this region delay automation adoption.
```

- Frey-Osborne progress bar (colour-coded: green / amber / red)
- ILO task-content index label with full description and risk tier
- Live Tavily evidence section labelled as city-specific web search
- Sources cited inline for every data point

### Policymaker Dashboard (`/admin`)

- `GET /api/policymaker/{locale_code}` — live `PolicymakerLiveStats` payload
- Every KPI wrapped in `IndicatorValue` with `source`, `year`, `live` boolean
- "Live" (Wifi icon, green chip) vs "Published" (Database icon, grey chip) badges
- Displays 6 KPI cards: HCI, NEET rate, secondary enrollment, internet penetration, ILO wage floor, automation delay
- Sector growth bar chart (ILOSTAT + Wittgenstein SSP2)
- District skill-gap heatmap (World Bank HCI subnational estimates)
- ITU automation delay callout
- Frey-Osborne LMIC calibration panel
- Wittgenstein 2025–2035 projection panel
- RPL & TVET infrastructure grid
- Evidence-based policy signals

### Parallel Live Labour Market Agent

- `POST /api/market-signals` — three simultaneous Tavily searches:
  1. Current job openings and high-growth companies for the skill in the user's city
  2. Physical vocational centres and NGO-led training hubs
  3. Average day-rate or monthly wage in the informal economy
- Results displayed in `LiveMarketSignals.tsx` with skeleton loading states and "Live" badges
- No mock data — if a search fails, the error is shown explicitly

### Returns to Education Metric

- "+X% Earning Potential" column on every opportunity card
- Source: World Bank STEP Skills Measurement Programme 2023
- Ghana: **+12.4%**, Pakistan: **+10.6%** wage premium from vocational training
- Displayed with `Source: World Bank WDI 2023` chip

### Bridge Pass PDF Export

- `jsPDF` + `html2canvas` — captures the visual skills card as an image
- Professional A4 layout with:
  - Dark header banner with worker name, country, and issue date
  - Visual card image (what the UI looks like)
  - **ISCO-08 credentials table** — code · label · classification · Frey-Osborne %
  - **ILO wage floor box** — citing ILOSTAT 2024
  - Footer citing all institutional sources
- File name: `unmapped-bridge-pass-[name].pdf`

### 2G-Resilient Error Handling

- `postWithTimeout<T>()` — all API calls use `AbortController` with configurable timeout
- Extract endpoint timeout: **90 seconds** (Gemini + Tavily enrichment)
- Backend error `detail` messages are surfaced verbatim — no silent failures
- `ErrorBoundary` React class component wraps the entire app
- "Save Offline" button in `ErrorBoundary` downloads all `localStorage` data (narrative, profile) as `.txt`
- Narrative auto-saved to `localStorage` on every change — survives timeout, back button, crash

### Progressive Loading UI

- `ProcessingOverlay.tsx` — four animated pipeline steps shown during extraction:
  1. Extracting Hidden Skills (Gemini)
  2. Querying Live Labor Agent (Tavily)
  3. Standardising to ISCO-08 (Frey-Osborne lookup)
  4. Finalising Bridge Pass

### Country-Agnostic Config-as-Infrastructure

- `backend/config/locales.json` — single JSON file controls all country parameters
- Currently includes **Ghana (gh)** and **Pakistan (pk)** with full institutional data
- Adding a new country requires only a new JSON block — zero Python code changes
- See `README_INFRASTRUCTURE.md` for the Ministry of Labour deployment guide

---

## Technical Stack

### Backend


| Component          | Technology                           |
| ------------------ | ------------------------------------ |
| API framework      | FastAPI (Python 3.12)                |
| Data validation    | Pydantic v2                          |
| AI engine          | Google Gemini 2.5 Flash              |
| Live web search    | Tavily API                           |
| World Bank data    | `wbgapi` (open, no key)              |
| ILO data           | ILOSTAT SDMX REST API (open, no key) |
| Parallel execution | `ThreadPoolExecutor`                 |
| Environment        | `python-dotenv`                      |
| Server             | `uvicorn` with `--reload`            |


### Frontend


| Component   | Technology                                  |
| ----------- | ------------------------------------------- |
| Framework   | React 18 + TypeScript                       |
| Routing     | TanStack Router (file-based)                |
| Build tool  | Vite                                        |
| Styling     | Tailwind CSS                                |
| Icons       | Lucide React                                |
| PDF export  | `jsPDF` + `html2canvas`                     |
| Voice input | Web Speech API (`window.SpeechRecognition`) |


---

## Project Structure

```
Skill-Bridge/
├── backend/
│   ├── main.py                        # FastAPI app, dotenv loading
│   ├── requirements.txt               # Python deps (wbgapi, google-genai, tavily-python, ...)
│   ├── .env                           # API keys (gitignored)
│   ├── .env.example                   # Template
│   ├── config/
│   │   ├── locales.json               # Country baseline data (Ghana, Pakistan)
│   │   └── loader.py                  # Config-as-Infrastructure loader
│   ├── models/
│   │   └── schemas.py                 # Pydantic request/response models
│   ├── routers/
│   │   └── api.py                     # All FastAPI endpoints
│   ├── services/
│   │   ├── ai_engine.py               # Gemini extraction pipeline
│   │   ├── econometrics.py            # Canonical open-API fetcher (WB + ILO)
│   │   ├── frey_osborne.py            # Oxford 2013 ISCO-08 automation table
│   │   ├── institutional_data.py      # 24h cached live indicators
│   │   ├── skill_enricher.py          # Post-extraction Tavily enrichment
│   │   └── search_engine.py           # Market signals parallel search
│   └── utils/
│       └── mock_data.py               # Deprecated stub (all mock data removed)
└── src/
    ├── components/
    │   ├── AppShell.tsx               # Navigation + layout
    │   ├── ErrorBoundary.tsx          # Global error handler + offline save
    │   ├── LiveMarketSignals.tsx      # Parallel Tavily labour market signals
    │   ├── NarrativeInput.tsx         # Voice-to-text mic component
    │   ├── ProcessingOverlay.tsx      # Step-by-step AI progress loader
    │   ├── SkillBadge.tsx             # Skill chip + AI transparency tooltip
    │   └── SourceBadge.tsx            # Provenance badge (live/published) + LiveKpi
    ├── context/
    │   └── AppContext.tsx             # Locale + profile state
    ├── lib/
    │   ├── api.ts                     # Backend adapter (all real fetch() calls)
    │   └── locales.ts                 # Country locale packs (GH, PK)
    ├── routes/
    │   ├── __root.tsx                 # Root layout + ErrorBoundary
    │   ├── index.tsx                  # Landing page
    │   ├── onboarding.tsx             # 4-step intake + state machine
    │   ├── profile.tsx                # Extracted skills card
    │   ├── opportunities.tsx          # Job matches + training providers
    │   ├── skills-card.tsx            # Bridge Pass + PDF export
    │   └── admin.tsx                  # Policymaker dashboard
    └── types/
        └── api.ts                     # TypeScript interfaces
```

---

## API Endpoints


| Method | Path                        | Description                                         |
| ------ | --------------------------- | --------------------------------------------------- |
| `POST` | `/api/extract`              | Gemini extraction → F-O scoring → Tavily enrichment |
| `POST` | `/api/opportunities/search` | Tavily training provider search                     |
| `POST` | `/api/market-signals`       | Parallel Tavily hiring/training/wage search         |
| `GET`  | `/api/policymaker/{locale}` | Live WB/ILO policymaker stats                       |
| `GET`  | `/health`                   | Health check                                        |


---

## Data Sources & Attribution


| Data                          | Institution                                    | Licence          |
| ----------------------------- | ---------------------------------------------- | ---------------- |
| Automation probability scores | Frey & Osborne (2013), Oxford Martin Programme | Academic — cited |
| ILO task-content indices      | ILO World Employment and Social Outlook 2020   | CC BY 4.0        |
| LMIC calibration              | ILO working paper (2019)                       | CC BY 4.0        |
| Human Capital Index           | World Bank Human Capital Project 2024          | CC BY 4.0        |
| WDI indicators (all)          | World Bank Open Data                           | CC BY 4.0        |
| Wage floors                   | ILO Global Wage Report 2024 / ILOSTAT          | CC BY 4.0        |
| Returns to education          | World Bank STEP Programme 2023                 | CC BY 4.0        |
| Education projections         | Wittgenstein Centre SSP2 2025–2035             | Academic — cited |
| Live job/training data        | Tavily web search                              | Cited per result |
| ISCO-08 taxonomy              | International Labour Organization              | Public domain    |
| ESCO taxonomy                 | European Commission                            | CC BY 4.0        |


---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
# Create backend/.env with:
#   GEMINI_API_KEY=your_key
#   TAVILY_API_KEY=your_key
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
npm install
npm run dev
# → http://localhost:5173
```

---

## Security

- API keys stored in `backend/.env` — never committed (`.gitignore` covers `.env`, `backend/.env`, `.venv/`)
- World Bank and ILO APIs require no keys — public open data
- CORS restricted to localhost ports during development
- No user data stored on the server — all profile state lives in browser `localStorage`

---

*UNMAPPED Protocol — Open Infrastructure for the Informal Economy*
*World Bank Innovation Challenge 2026*