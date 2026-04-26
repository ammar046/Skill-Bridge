// API contracts — these JSON shapes mirror the future FastAPI backend.
// Today they are produced by lib/api.ts from seeded data + the mock skills
// engine; tomorrow point lib/api.ts at the real server.

export type SkillClass = "durable" | "at_risk" | "transitioning";

export interface AdjacentSkill {
  isco_code: string;
  label: string;
  resilience_delta: number;
  rationale: string;
  training_type: string;
  estimated_weeks: number;
}

export interface ScarcityIndex {
  score: number;        // 0-95
  label: string;
  tier: "high" | "medium" | "low";
  source: string;
}

export interface PolicySignal {
  severity: "high" | "medium" | "low";
  text: string;
  source: string;
}

export interface SectorRisk {
  sector: string;
  avg_automation_score: number;
  isco_code_count: number;
  min_score: number;
  max_score: number;
}

export interface Skill {
  id: string;
  label: string;
  formalName: string;
  iscoCode: string;
  escoUri: string;
  classification: SkillClass;
  confidence: number;
  sourceQuote: string;
  freyOsborneScore?: number;
  iloTaskType?: string;
  resilienceNote?: string;
  adjacentSkills?: AdjacentSkill[];
  scarcityIndex?: ScarcityIndex;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  gender: "female" | "male" | "other" | null;
  region: string;
  userCity: string;
  rawNarrative: string;
  skills: Skill[];
  createdAt: string;
  passId?: string;
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
  ilostatSource?: string;
  returnsToEducationNote?: string;
}

export interface TrainingProvider {
  id: string;
  name: string;
  city: string;
  format: "In-person" | "Hybrid" | "Online";
  durationWeeks: number;
  url: string;
}

export interface IndicatorValue {
  value: number | null;
  source: string;
  year: string | null;
  live: boolean;
  label: string;
  available: boolean;
}

export interface SkillAggregate {
  isco_code: string;
  label: string;
  count: number;
  avg_automation_score: number;
  status: string;
}

export interface AggregateIntelligence {
  total_workers_assessed: number;
  top_skills_at_risk: SkillAggregate[];
  top_durable_skills: SkillAggregate[];
  skill_distribution: SkillAggregate[];
  gender_breakdown: Record<string, number>;
  cities_represented: string[];
  avg_automation_score: number;
  assessment_trend: Array<{ date: string; count: number }>;
}

export interface PolicymakerLiveStats {
  locale_code: string;
  country: string;
  context: string;
  fetched_at: string;
  live_indicators_count: number;
  hci_score: IndicatorValue;
  gross_secondary_enrollment_pct: IndicatorValue;
  internet_penetration_pct: IndicatorValue;
  neet_rate_pct: IndicatorValue;
  vulnerable_employment_pct: IndicatorValue;
  gdp_per_capita_ppp: IndicatorValue;
  output_per_worker_usd: IndicatorValue;
  wage_floor_local: IndicatorValue;
  wage_floor_usd_ppp: IndicatorValue;
  automation_delay_years: IndicatorValue;
  gender_wage_gap: IndicatorValue;
  wittgenstein_note: string;
  wittgenstein_source: string;
  frey_osborne_calibration: string;
  tvet_name: string;
  rpl_uptake_pct: number;
  districts: Array<{ name: string; skill_gap: number; hci_local: number; neet_pct: number }>;
  policy_insights: string[];
  top_growth_sectors: Array<{ sector: string; growth_pct: number; demand_gap_pct: number; source: string }>;
  aggregate_intelligence: AggregateIntelligence | null;
  task_bucket_averages: Record<string, number>;
  policy_signals: PolicySignal[];
  sector_risk_profile: SectorRisk[];
}

// Keep for backward compat
export interface PolicymakerLocaleStats extends PolicymakerLiveStats {}

export interface MarketSignal {
  category: string;
  title: string;
  snippet: string;
  url: string;
}

export interface MarketSignalsResponse {
  hiring: MarketSignal[];
  training: MarketSignal[];
  wages: MarketSignal[];
  skill: string;
  location: string;
}

export interface AdminAggregates {
  neetRate: number;
  hciScore: number;
  enrollment: number;
  districts: { name: string; gap: number }[];
  insights: string[];
}
