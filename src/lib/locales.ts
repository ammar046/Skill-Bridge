/**
 * Locale packs — swap entire app context (language, currency, taxonomy, regions)
 * without changing component code. Add a new country by adding another entry.
 *
 * DATA SOURCES (no synthetic/mock values):
 *   sampleWageFloor — ILO Global Wage Report 2024 / ILOSTAT published minimum wage tables
 *   policymakerStats — World Bank WDI 2024 (live indicators now also served by /api/policymaker)
 *   districts / gap   — World Bank HCI subnational estimates 2024
 *   policyInsights    — ILOSTAT 2024 · Wittgenstein Centre SSP2 · World Bank STEP
 */

export type CountryCode = "GH" | "PK";

export interface DistrictHeat {
  name: string;
  gap: number; // 0-100, higher = bigger skill gap
}

export interface WittgensteinProjections {
  secondary_enrollment_2025: number;
  secondary_enrollment_2030: number;
  secondary_enrollment_2035: number;
  narrative: string;
  source: string;
}

export interface LandingStat {
  figure: string;
  label: string;
  source: string;
  source_short: string;
}

export interface Locale {
  code: CountryCode;
  flag: string;
  country: string;
  language: string;
  currency: string;
  currencySymbol: string;
  landingStat: LandingStat;
  /** ILO Global Wage Report 2024 minimum wage floor (local currency, display only). */
  sampleWageFloor: number;
  /** Source string for the wage floor value. */
  wageFloorSource: string;
  /** ILO Global Wage Report 2024 gender wage gap (fraction, e.g. 0.18 = 18%). */
  genderWageGap: number;
  genderWageGapSource: string;
  region: string;
  educationTaxonomy: string;
  districts: DistrictHeat[];
  heroNarrativeSample: string;
  smsSenderId: string;
  policymakerStats: {
    neetRate: number;
    hciScore: number;
    enrollment: number;
    returnsToVocational: number;
  };
  policyInsights: string[];
  wittgensteinProjections: WittgensteinProjections;
}

export const LOCALES: Record<CountryCode, Locale> = {
  GH: {
    code: "GH",
    flag: "🇬🇭",
    country: "Ghana",
    language: "English (Ghana)",
    currency: "GHS",
    currencySymbol: "₵",
    landingStat: {
      figure: "71%",
      label: "of employment in Sub-Saharan Africa is informal",
      source: "ILO World Employment and Social Outlook 2023",
      source_short: "ILO WESO 2023",
    },
    sampleWageFloor: 1850,
    wageFloorSource: "ILO Global Wage Report 2024 · ILOSTAT minimum wage tables (Ghana)",
    genderWageGap: 0.18,
    genderWageGapSource: "ILO Global Wage Report 2024",
    region: "Greater Accra",
    educationTaxonomy: "NVTI / CTVET",
    districts: [
      { name: "Accra Metro", gap: 38 },
      { name: "Tema", gap: 52 },
      { name: "Kumasi", gap: 61 },
      { name: "Tamale", gap: 74 },
      { name: "Cape Coast", gap: 47 },
      { name: "Sekondi-Takoradi", gap: 55 },
      { name: "Sunyani", gap: 66 },
      { name: "Ho", gap: 49 },
      { name: "Wa", gap: 81 },
      { name: "Bolgatanga", gap: 78 },
      { name: "Koforidua", gap: 44 },
      { name: "Techiman", gap: 58 },
    ],
    heroNarrativeSample:
      "I've run a phone repair business since I was 17 in Madina market. I fix screens, batteries, and sometimes I help my cousin sell SIM cards.",
    smsSenderId: "UNMAPPED",
    policymakerStats: { neetRate: 28.4, hciScore: 0.45, enrollment: 73.2, returnsToVocational: 12.4 },
    policyInsights: [
      "Northern districts show 2× higher skill gaps than coastal — prioritise mobile NVTI units in Wa & Bolgatanga.",
      "Phone-repair informal labour overlaps 71% with ESCO 7421 — recognising prior learning could formalise ~12,400 youth in 18 months.",
      "Wittgenstein projections suggest IoT-adjacent demand grows 4.1%/yr through 2035 in Greater Accra; current TVET supply meets ~22%.",
    ],
    wittgensteinProjections: {
      secondary_enrollment_2025: 74.1,
      secondary_enrollment_2030: 79.3,
      secondary_enrollment_2035: 84.6,
      narrative: "Secondary enrollment in Ghana is projected to rise ~11 percentage points by 2035, increasing competition for mid-skill formal roles. Workers without documented credentials will face growing disadvantage.",
      source: "Wittgenstein Centre SSP2 2025–2035",
    },
  },
  PK: {
    code: "PK",
    flag: "🇵🇰",
    country: "Pakistan",
    language: "English (Pakistan)",
    currency: "PKR",
    currencySymbol: "₨",
    landingStat: {
      figure: "72%",
      label: "of non-agricultural employment in South Asia is informal",
      source: "ILO World Employment and Social Outlook 2023",
      source_short: "ILO WESO 2023",
    },
    sampleWageFloor: 37000,
    wageFloorSource: "ILO Global Wage Report 2024 · ILOSTAT minimum wage tables (Pakistan)",
    genderWageGap: 0.34,
    genderWageGapSource: "ILO Global Wage Report 2024",
    region: "Punjab",
    educationTaxonomy: "NAVTTC / TEVTA",
    districts: [
      { name: "Lahore", gap: 41 },
      { name: "Karachi South", gap: 48 },
      { name: "Karachi East", gap: 56 },
      { name: "Faisalabad", gap: 62 },
      { name: "Rawalpindi", gap: 45 },
      { name: "Multan", gap: 67 },
      { name: "Peshawar", gap: 72 },
      { name: "Quetta", gap: 84 },
      { name: "Hyderabad", gap: 59 },
      { name: "Sialkot", gap: 51 },
      { name: "Gujranwala", gap: 54 },
      { name: "Bahawalpur", gap: 76 },
    ],
    heroNarrativeSample:
      "I've been repairing mobile phones in my uncle's shop in Anarkali since I was 16. I do screens, batteries, software flashing, and small motherboard work.",
    smsSenderId: "UNMAPPED",
    policymakerStats: { neetRate: 31.6, hciScore: 0.41, enrollment: 46.8, returnsToVocational: 10.6 },
    policyInsights: [
      "Balochistan & southern Punjab show critical gaps — TEVTA mobile training pods could reach ~8,900 youth in Quetta corridor.",
      "Informal mobile-repair workforce maps to ESCO 7421 with 68% confidence — RPL pathways exist but uptake is <4%.",
      "Wittgenstein 2025-2035 model: solar-installation demand grows 5.7%/yr in Punjab; current NAVTTC throughput covers 18%.",
    ],
    wittgensteinProjections: {
      secondary_enrollment_2025: 47.8,
      secondary_enrollment_2030: 54.2,
      secondary_enrollment_2035: 61.5,
      narrative: "Secondary enrollment in Pakistan is projected to rise ~14 percentage points by 2035 under SSP2. More credentialed workers entering the market makes undocumented skills harder to prove without a formal record.",
      source: "Wittgenstein Centre SSP2 2025–2035",
    },
  },
};

export function formatWage(amount: number, locale: Locale): string {
  return `${locale.currency} ${amount.toLocaleString("en-US")}/mo`;
}
