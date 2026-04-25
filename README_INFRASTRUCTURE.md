# UNMAPPED Protocol — Infrastructure Deployment Guide

> **For Ministries of Labour, National TVET Authorities, and Development Finance Institutions**
>
> This guide explains how to add a new country to the UNMAPPED Protocol
> without touching any Python application code. The entire country
> configuration lives in a single JSON file.

---

## Architecture Overview

```
backend/
├── config/
│   ├── locales.json          ← Add your country here (one JSON block)
│   └── loader.py             ← Reads locales.json — do not edit
├── services/
│   ├── econometrics.py       ← Fetches live data: World Bank WDI + ILO SDMX (no API keys)
│   ├── institutional_data.py ← 24-hour cache layer for live indicators
│   ├── skill_enricher.py     ← Frey-Osborne LMIC scoring + Tavily evidence per skill
│   └── frey_osborne.py       ← Oxford 2013 lookup table — ISCO-08 → automation probability
```

**Data flow (no API keys required for World Bank / ILO):**

```
User narrative
    │
    ▼
Gemini API (skill extraction + ISCO-08 mapping)
    │
    ▼
Frey & Osborne (2013) lookup table         ← built-in, no API
    │
    ▼
Tavily live web search (city-specific demand)   ← requires TAVILY_API_KEY
    │
    ▼
World Bank WDI API (wbgapi, unauthenticated)    ← public, no key
    │
    ▼
ILO ILOSTAT SDMX API (unauthenticated)          ← public, no key
    │
    ▼
locales.json fallback baseline                  ← always available
    │
    ▼
UNMAPPED Bridge Pass (standardised, portable)
```

---

## How to Add a New Country

### Step 1 — Identify your country's ISO-2 code

Example: `ng` (Nigeria), `ke` (Kenya), `et` (Ethiopia), `bd` (Bangladesh)

### Step 2 — Gather the required data (all from free public sources)


| Field                          | Source                         | URL                                                                                                             |
| ------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| HCI score                      | World Bank Human Capital Index | [data.worldbank.org](https://data.worldbank.org/indicator/SP.HCI.OVRL)                                          |
| Gross secondary enrollment     | World Bank WDI SE.SEC.ENRR     | [data.worldbank.org](https://data.worldbank.org/indicator/SE.SEC.ENRR)                                          |
| NEET rate                      | ILO modelled estimates / WDI   | [data.worldbank.org](https://data.worldbank.org/indicator/SL.UEM.NEET.ZS)                                       |
| Wage floor                     | ILO Global Wage Report         | [ilostat.ilo.org](https://ilostat.ilo.org/topics/wages/)                                                        |
| Informal economy share         | ILO informal economy data      | [ilostat.ilo.org](https://ilostat.ilo.org/topics/informality/)                                                  |
| TVET system name               | UNESCO ISCED taxonomy          | [uis.unesco.org](https://uis.unesco.org/)                                                                       |
| Returns to vocational training | World Bank STEP Programme      | [worldbank.org/STEP](https://www.worldbank.org/en/programs/sief-trust-fund/brief/step-skills-measurement-study) |
| Wittgenstein projections       | Wittgenstein Centre            | [wittgensteincentre.org](http://wittgensteincentre.org/dataexplorer)                                            |
| Frey-Osborne LMIC calibration  | Oxford Martin Programme        | [oxfordmartin.ox.ac.uk](https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment/)               |


> **Note:** Fields marked as "live" in the dashboard are fetched automatically
> from the World Bank WDI API (`wbgapi`) at runtime. You only need to provide
> baseline fallback values in `locales.json`.

---

### Step 3 — Add your country block to `backend/config/locales.json`

Copy and adapt the template below. Replace every `<PLACEHOLDER>` value:

```json
"ng": {
  "code": "ng",
  "country": "Nigeria",
  "currency": "NGN",
  "currency_symbol": "₦",
  "context": "Nigeria — West Africa Urban Informal Economy",
  "source": "World Bank WDI 2024 · ILO Global Wage Report 2024 · Wittgenstein Centre SSP2",

  "ilo_econometrics": {
    "source": "ILO Global Wage Report 2024 · ILOSTAT",
    "wage_floor_local": 30000,
    "wage_floor_usd_ppp": 120,
    "informal_economy_share_pct": 83.5,
    "youth_neet_rate_pct": 34.2,
    "returns_to_vocational_pct": 9.8,
    "sector_growth_indices": {
      "technology_services": {
        "annual_growth_pct": 5.2,
        "demand_gap_pct": 71
      },
      "construction_infrastructure": {
        "annual_growth_pct": 3.8,
        "demand_gap_pct": 58
      },
      "agribusiness_processing": {
        "annual_growth_pct": 3.1,
        "demand_gap_pct": 63
      }
    }
  },

  "world_bank": {
    "source": "World Bank WDI 2024 · Human Capital Index 2024",
    "hci_score": 0.36,
    "gross_secondary_enrollment_pct": 52.4,
    "internet_penetration_pct": 45.7
  },

  "education_taxonomy": {
    "name": "NBTE / NABTEB",
    "description": "National Board for Technical Education / National Business and Technical Examinations Board",
    "rpl_pathway_exists": true,
    "rpl_uptake_pct": 2.1,
    "source": "NBTE Annual Report 2023"
  },

  "wittgenstein_projections": {
    "scenario": "SSP2 Medium",
    "tvet_supply_gap_pct": 82,
    "note": "Wittgenstein Centre SSP2: Nigeria faces a 82% TVET supply gap vs projected skill demand through 2035, particularly in digital and construction sectors.",
    "source": "Wittgenstein Centre for Demography and Global Human Capital · SSP2 2025-2035"
  },

  "frey_osborne_lmic_calibration": {
    "high_risk_threshold": 0.70,
    "medium_risk_threshold": 0.45,
    "lmic_discount_pct": 22,
    "calibration_note": "Nigeria's low capital-labour cost ratio and nascent automation infrastructure delay technology adoption by ~2-3 years vs OECD baseline (ILO 2019).",
    "durable_isco_codes": ["7421", "7231", "5141", "2221", "2330"],
    "at_risk_isco_codes": ["4132", "5211", "8322", "9313"],
    "source": "Frey & Osborne (2013) · ILO LMIC adjustment working paper (2019)"
  },

  "districts": [
    { "name": "Lagos Mainland", "skill_gap": 45, "hci_local": 0.40, "neet_pct": 29.1 },
    { "name": "Kano",           "skill_gap": 78, "hci_local": 0.31, "neet_pct": 41.2 },
    { "name": "Abuja FCT",      "skill_gap": 38, "hci_local": 0.44, "neet_pct": 24.6 },
    { "name": "Port Harcourt",  "skill_gap": 52, "hci_local": 0.38, "neet_pct": 33.8 },
    { "name": "Ibadan",         "skill_gap": 61, "hci_local": 0.35, "neet_pct": 36.4 },
    { "name": "Kaduna",         "skill_gap": 71, "hci_local": 0.33, "neet_pct": 39.7 }
  ],

  "policy_insights": [
    "Northern states show 2× higher skill gaps than Lagos corridor — mobile NBTE units in Kano and Kaduna could reach ~15,000 youth annually.",
    "Informal tech-repair workforce maps to ESCO 7421 with ~74% confidence — RPL pathways exist but uptake is under 3%.",
    "Wittgenstein SSP2: digital services demand grows 5.2%/yr through 2035 in Lagos; current NBTE throughput covers approximately 18%."
  ]
}
```

### Step 4 — Register the country code in the frontend

Open `src/lib/locales.ts` and add your country to the `LOCALES` object:

```typescript
NG: {
  code: "NG",
  flag: "🇳🇬",
  country: "Nigeria",
  language: "English (Nigeria)",
  currency: "NGN",
  currencySymbol: "₦",
  sampleWageFloor: 30000,
  wageFloorSource: "ILO Global Wage Report 2024 · ILOSTAT minimum wage tables (Nigeria)",
  region: "Lagos",
  educationTaxonomy: "NBTE / NABTEB",
  districts: [ ... ],   // copy from locales.json districts
  heroNarrativeSample: "I've been fixing phones and tablets in my stall at Computer Village, Ikeja, for four years.",
  smsSenderId: "UNMAPPED",
  policymakerStats: {
    neetRate: 34.2,
    hciScore: 0.36,
    enrollment: 52.4,
    returnsToVocational: 9.8,
  },
  policyInsights: [ ... ],
}
```

### Step 5 — Deploy

No code changes required. The backend will:

1. Load your country's baseline from `locales.json` immediately
2. Attempt to fetch live World Bank WDI data for your ISO3 code on first request
3. Cache live data for 24 hours in `backend/.cache/`
4. Fall back gracefully to `locales.json` if the live API is unavailable

---

## Environment Variables

```env
# backend/.env
GEMINI_API_KEY=your_key_here          # Google AI Studio — required
TAVILY_API_KEY=your_key_here          # Tavily — required for live web evidence

# World Bank API — NO KEY REQUIRED (public open data, CC BY 4.0)
# ILO ILOSTAT API — NO KEY REQUIRED (public open data, CC BY 4.0)
```

---

## Live API Endpoints Used (No Authentication)


| Institution | Endpoint                                | Data                                          |
| ----------- | --------------------------------------- | --------------------------------------------- |
| World Bank  | `api.worldbank.org/v2`                  | HCI, enrollment, NEET, internet %, GDP/worker |
| ILO ILOSTAT | `sdmx.ilo.org/rest`                     | Wage earnings, employment by sector           |
| World Bank  | `api.worldbank.org/v2` (IT.NET.USER.ZS) | ITU internet penetration                      |


---

## Data Attribution Requirements

Per the UNMAPPED Protocol, every numeric value displayed in the UI must cite its source.
The `SourceBadge` React component handles this automatically for all live indicators.
When adding custom data to `locales.json`, populate the `source` field on every value.

---

## Technical Standards

- All ISCO-08 codes must be 4-digit (e.g. `"7421"`, not `"742"`)
- Frey-Osborne scores are looked up from the Oxford 2013 table — do not invent them
- LMIC discount must be between 15–30% (ILO 2019 calibration range)
- Wittgenstein projections must reference the SSP scenario used

---

*UNMAPPED Protocol — Open Infrastructure for the Informal Economy*
*Developed for the World Bank Innovation Challenge · 2026*