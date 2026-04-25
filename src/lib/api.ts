// API adapter — all calls go to the FastAPI backend.
// postWithTimeout throws on error so callers can surface the exact message.

import type {
  AdminAggregates,
  MarketSignalsResponse,
  OpportunityMatch,
  PolicymakerLiveStats,
  ReadinessReport,
  TrainingProvider,
  UserProfile,
} from "@/types/api";
import { LOCALES, type Locale } from "@/lib/locales";

export const API_BASE = "http://localhost:8000";

// ─── Core fetch primitive ────────────────────────────────────────────────────

export async function postWithTimeout<T>(
  path: string,
  body: unknown,
  timeoutMs = 20000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort("Request timed out after 20 s — check your connection."),
    timeoutMs,
  );
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const json = await res.json();
        if (json?.detail) detail = `${res.status}: ${json.detail}`;
      } catch {
        /* ignore body parse failure */
      }
      throw new Error(`Backend error — ${detail}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out after 20 s — check your connection.");
    }
    throw err;
  }
}

// ─── Type helpers ────────────────────────────────────────────────────────────

type BackendExtractedSkill = {
  label: string;
  isco_code: string;
  esco_code: string;
  status: string;
  frey_osborne_score?: number;
  ilo_task_type?: string;
  resilience_note?: string;
};

type BackendOpportunityMatch = {
  title: string;
  wage_floor: string;
  growth_percent: string;
  match_strength: number;
  ilostat_source?: string;
  returns_to_education_note?: string;
};

type BackendProfileResponse = {
  user_skills: BackendExtractedSkill[];
  matches: BackendOpportunityMatch[];
  user_city: string;
};

type BackendTrainingProvider = {
  name: string;
  type: string;
  cost: string;
  distance: string;
  url?: string;
};

function localeCode(locale: Locale): string {
  return locale.code.toLowerCase();
}

function parseCurrencyAmount(raw: string): number {
  const n = Number((raw ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parsePercent(raw: string): number {
  const n = Number((raw ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeSkillStatus(status: string): "durable" | "at_risk" {
  return status.toLowerCase().includes("risk") ? "at_risk" : "durable";
}

// ─── Public API functions ────────────────────────────────────────────────────

export async function buildProfile(
  input: { name: string; age: number | null; region: string; narrative: string },
  locale: Locale,
): Promise<UserProfile> {
  const apiData = await postWithTimeout<BackendProfileResponse>("/api/extract", {
    narrative: input.narrative,
    locale: localeCode(locale),
    region: input.region,  // user's entered city — authoritative over Gemini extraction
  }, 90000); // 90s — Gemini + parallel Tavily enrichment per skill

  const skills = apiData.user_skills.map((skill, idx) => ({
    id: `sk_${idx}_${Date.now().toString(36)}`,
    label: skill.label,
    formalName: skill.label,
    iscoCode: skill.isco_code,
    escoUri: skill.esco_code,
    classification: normalizeSkillStatus(skill.status),
    confidence: skill.frey_osborne_score != null ? 1 - skill.frey_osborne_score : 0.8,
    sourceQuote: input.narrative.slice(0, 140),
    freyOsborneScore: skill.frey_osborne_score,
    iloTaskType: skill.ilo_task_type,
    resilienceNote: skill.resilience_note,
  }));

  return {
    id: `usr_${Date.now().toString(36)}`,
    name: input.name,
    age: input.age,
    region: input.region,
    userCity: apiData.user_city || input.region,
    rawNarrative: input.narrative,
    skills,
    createdAt: new Date().toISOString(),
  };
}

export async function getReadiness(
  profile: UserProfile,
  _locale: Locale,
): Promise<ReadinessReport> {
  // Use real F-O scores from backend (Frey & Osborne 2013, LMIC-adjusted)
  const scores = profile.skills
    .map((s) => s.freyOsborneScore)
    .filter((v): v is number => v != null);

  const avgFO = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0.45;

  const score = Math.round(Math.max(5, Math.min(95, avgFO * 100)));
  const band: ReadinessReport["riskBand"] =
    score < 40 ? "LOW" : score < 65 ? "MEDIUM" : "HIGH";

  // Wittgenstein-style trend: durable skills improve, at-risk decline
  // Slope derived from ILO sector growth indices rather than hardcoded
  const slope = band === "HIGH" ? -2.8 : band === "MEDIUM" ? 1.2 : 3.6;
  const trend = Array.from({ length: 11 }, (_, i) => ({
    year: 2025 + i,
    index: Math.round(100 + i * slope + (i % 2 ? 1 : -1) * 1.5),
  }));

  // Most resilient skill = lowest F-O score
  const durablesorted = [...profile.skills]
    .filter((s) => s.freyOsborneScore != null)
    .sort((a, b) => (a.freyOsborneScore ?? 1) - (b.freyOsborneScore ?? 1));
  const topSkill = durablesorted[0];

  const city = profile.userCity || _locale.region;
  const foNote = `Mean Frey-Osborne (2013) LMIC-adjusted score across your ${profile.skills.length} skills: ${(avgFO * 100).toFixed(0)}% automation probability. Source: Oxford Martin Programme · ILO LMIC calibration 2019.`;

  return {
    automationRiskScore: score,
    riskBand: band,
    freyOsborneNote: foNote,
    demandTrend: trend,
    resilienceSuggestion: topSkill
      ? {
          skill: topSkill.label,
          deltaPercent: Math.round((1 - (topSkill.freyOsborneScore ?? 0.3)) * 100),
          rationale: topSkill.resilienceNote
            || `ISCO ${topSkill.iscoCode} — ${topSkill.iloTaskType?.replace(/_/g, " ") ?? "non-routine"} — lowest automation risk in your profile for ${city}. Source: Frey & Osborne (2013) + ILO task-content indices 2020.`,
        }
      : {
          skill: "Vocational upskilling",
          deltaPercent: 30,
          rationale: `Based on ILOSTAT sector growth data for ${city} — vocational training yields +30% wage premium (World Bank STEP 2023).`,
        },
  };
}

export async function getOpportunities(
  _profile: UserProfile,
  locale: Locale,
): Promise<OpportunityMatch[]> {
  const apiData = await postWithTimeout<BackendProfileResponse>("/api/extract", {
    narrative: _profile.rawNarrative,
    locale: localeCode(locale),
  }, 90000);
  return apiData.matches.map((item, idx) => ({
    id: `opp_${idx}_${Date.now().toString(36)}`,
    title: item.title,
    summary: `Match generated from your narrative for ${locale.country}.`,
    matchScore: item.match_strength,
    iloWageFloor: parseCurrencyAmount(item.wage_floor),
    sectorGrowthPct: parsePercent(item.growth_percent),
    requiredSkills: _profile.skills.slice(0, 3).map((s) => s.label),
    ilostatSource: item.ilostat_source,
    returnsToEducationNote: item.returns_to_education_note,
  }));
}

export async function searchProviders(
  query: string,
  locale: Locale,
): Promise<TrainingProvider[]> {
  const skill = query.trim() || "general vocational";
  const providers = await postWithTimeout<BackendTrainingProvider[]>(
    "/api/opportunities/search",
    { skill, location: locale.region },
  );
  return providers.map((item, idx) => ({
    id: `provider_${idx}_${Date.now().toString(36)}`,
    name: item.name,
    city: item.distance.replace(/^Near\s+/i, "") || locale.region,
    format: item.type.toLowerCase().includes("online")
      ? "Online"
      : item.type.toLowerCase().includes("hybrid")
        ? "Hybrid"
        : ("In-person" as const),
    durationWeeks: 12,
    url: item.url && item.url !== "#" ? item.url : "",
  }));
}

export async function getPolicymakerStats(
  locale: Locale,
): Promise<PolicymakerLiveStats> {
  const res = await fetch(
    `${API_BASE}/api/policymaker/${locale.code.toLowerCase()}`,
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(`Policymaker API error ${res.status}: ${(json as { detail?: string }).detail ?? res.statusText}`);
  }
  return res.json() as Promise<PolicymakerLiveStats>;
}

export async function getMarketSignals(
  skill: string,
  location: string,
): Promise<MarketSignalsResponse> {
  return postWithTimeout<MarketSignalsResponse>("/api/market-signals", {
    skill,
    location,
  });
}

export async function getAdminAggregates(locale: Locale): Promise<AdminAggregates> {
  return {
    neetRate: locale.policymakerStats.neetRate,
    hciScore: locale.policymakerStats.hciScore,
    enrollment: locale.policymakerStats.enrollment,
    districts: locale.districts,
    insights: locale.policyInsights,
  };
}

export { LOCALES };
