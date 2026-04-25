// Single API adapter — currently returns seeded JSON. Swap implementations
// here when wiring the FastAPI backend; component code does not change.

import type {
  AdminAggregates,
  OpportunityMatch,
  ReadinessReport,
  TrainingProvider,
  UserProfile,
} from "@/types/api";
import { LOCALES, type CountryCode, type Locale } from "@/lib/locales";
import { extractSkills } from "@/lib/skillsEngine";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function buildProfile(
  input: { name: string; age: number | null; region: string; narrative: string },
): Promise<UserProfile> {
  await wait(350);
  return {
    id: `usr_${Date.now().toString(36)}`,
    name: input.name,
    age: input.age,
    region: input.region,
    rawNarrative: input.narrative,
    skills: extractSkills(input.narrative),
    createdAt: new Date().toISOString(),
  };
}

export async function getReadiness(profile: UserProfile, _locale: Locale): Promise<ReadinessReport> {
  await wait(250);
  // Score: average risk weighted by classification
  const risk = profile.skills.reduce((acc, s) => {
    return acc + (s.classification === "at_risk" ? 65 : 28) * s.confidence;
  }, 0) / Math.max(profile.skills.length, 1);
  const score = Math.round(Math.max(8, Math.min(92, risk)));
  const band: ReadinessReport["riskBand"] = score < 40 ? "LOW" : score < 65 ? "MEDIUM" : "HIGH";
  const trend = Array.from({ length: 11 }, (_, i) => ({
    year: 2025 + i,
    index: Math.round(100 + i * (band === "HIGH" ? -3.2 : band === "MEDIUM" ? 1.4 : 4.1) + (i % 2 ? 1 : -1) * 2),
  }));
  return {
    automationRiskScore: score,
    riskBand: band,
    freyOsborneNote: "Calibrated for LMIC context · Frey-Osborne adjusted (2017) with ILO informal-sector weighting.",
    demandTrend: trend,
    resilienceSuggestion: {
      skill: "IoT Repair",
      deltaPercent: 42,
      rationale:
        "Adding IoT diagnostics to existing electronics work shifts 3 of your skills into growth quadrant through 2035.",
    },
  };
}

export async function getOpportunities(_profile: UserProfile, locale: Locale): Promise<OpportunityMatch[]> {
  await wait(300);
  const wage = locale.sampleWageFloor;
  return [
    {
      id: "opp_1", title: "Electronics Technician",
      summary: "Repair and service consumer electronics in independent shops or service centres.",
      matchScore: 88, iloWageFloor: Math.round(wage * 1.0), sectorGrowthPct: 3.4,
      requiredSkills: ["Mobile Device Repair", "Diagnostics", "Customer Service"],
    },
    {
      id: "opp_2", title: "Solar Panel Installer",
      summary: "Install and maintain rooftop solar systems for homes and small businesses.",
      matchScore: 76, iloWageFloor: Math.round(wage * 1.18), sectorGrowthPct: 5.7,
      requiredSkills: ["Electrical Install", "Safety", "Wiring"],
    },
    {
      id: "opp_3", title: "Small Shop Operator",
      summary: "Run a registered micro-business with formal bookkeeping and POS.",
      matchScore: 71, iloWageFloor: Math.round(wage * 0.92), sectorGrowthPct: 1.1,
      requiredSkills: ["Business Ops", "Cash Handling", "Inventory"],
    },
    {
      id: "opp_4", title: "IoT Field Service",
      summary: "Install and troubleshoot connected meters, sensors and small-business networking gear.",
      matchScore: 64, iloWageFloor: Math.round(wage * 1.32), sectorGrowthPct: 6.9,
      requiredSkills: ["Mobile Device Repair", "Networking", "Diagnostics"],
    },
    {
      id: "opp_5", title: "Vocational Peer Trainer",
      summary: "Lead short-cycle trainings at a community TVET centre.",
      matchScore: 58, iloWageFloor: Math.round(wage * 1.05), sectorGrowthPct: 2.3,
      requiredSkills: ["Peer Coaching", "Curriculum Basics"],
    },
  ];
}

const PROVIDERS_BY_COUNTRY: Record<CountryCode, TrainingProvider[]> = {
  GH: [
    { id: "p1", name: "Accra Tech Skills Hub", city: "Accra", format: "In-person", durationWeeks: 12, url: "#" },
    { id: "p2", name: "NVTI Tema Centre", city: "Tema", format: "Hybrid", durationWeeks: 24, url: "#" },
    { id: "p3", name: "Kumasi Solar Academy", city: "Kumasi", format: "In-person", durationWeeks: 8, url: "#" },
    { id: "p4", name: "Coursera × CTVET (Sponsored)", city: "Online", format: "Online", durationWeeks: 16, url: "#" },
  ],
  PK: [
    { id: "p1", name: "TEVTA Lahore Mobile Repair", city: "Lahore", format: "In-person", durationWeeks: 12, url: "#" },
    { id: "p2", name: "NAVTTC Karachi", city: "Karachi", format: "Hybrid", durationWeeks: 20, url: "#" },
    { id: "p3", name: "Punjab Skills Dev Fund — Solar", city: "Multan", format: "In-person", durationWeeks: 10, url: "#" },
    { id: "p4", name: "DigiSkills.pk", city: "Online", format: "Online", durationWeeks: 12, url: "#" },
  ],
};

export async function searchProviders(query: string, locale: Locale): Promise<TrainingProvider[]> {
  await wait(450); // simulate Tavily latency
  const all = PROVIDERS_BY_COUNTRY[locale.code];
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.city.toLowerCase().includes(q) ||
    p.format.toLowerCase().includes(q),
  );
}

export async function getAdminAggregates(locale: Locale): Promise<AdminAggregates> {
  await wait(200);
  return {
    neetRate: locale.policymakerStats.neetRate,
    hciScore: locale.policymakerStats.hciScore,
    enrollment: locale.policymakerStats.enrollment,
    districts: locale.districts,
    insights: locale.policyInsights,
  };
}

export { LOCALES };
