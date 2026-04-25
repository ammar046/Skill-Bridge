// API contracts — these JSON shapes mirror the future FastAPI backend.
// Today they are produced by lib/api.ts from seeded data + the mock skills
// engine; tomorrow point lib/api.ts at the real server.

export type SkillClass = "durable" | "at_risk";

export interface Skill {
  id: string;
  label: string;            // plain Grade-6 language ("Business Ops")
  formalName: string;       // ESCO/ISCO formal name
  iscoCode: string;         // ISCO-08 e.g. "7421"
  escoUri: string;          // ESCO concept URI
  classification: SkillClass;
  confidence: number;       // 0-1
  sourceQuote: string;      // verbatim slice that produced this skill
}

export interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  region: string;
  rawNarrative: string;
  skills: Skill[];
  createdAt: string;
}

export interface ReadinessReport {
  automationRiskScore: number;       // 0-100
  riskBand: "LOW" | "MEDIUM" | "HIGH";
  freyOsborneNote: string;
  demandTrend: { year: number; index: number }[]; // Wittgenstein style
  resilienceSuggestion: {
    skill: string;
    deltaPercent: number;
    rationale: string;
  };
}

export interface OpportunityMatch {
  id: string;
  title: string;
  summary: string;
  matchScore: number;        // 0-100
  iloWageFloor: number;      // local currency per month
  sectorGrowthPct: number;   // signed annual %
  requiredSkills: string[];
}

export interface TrainingProvider {
  id: string;
  name: string;
  city: string;
  format: "In-person" | "Hybrid" | "Online";
  durationWeeks: number;
  url: string;
}

export interface AdminAggregates {
  neetRate: number;
  hciScore: number;
  enrollment: number;
  districts: { name: string; gap: number }[];
  insights: string[];
}
