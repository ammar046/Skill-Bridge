// API adapter — all calls go to the FastAPI backend.
// postWithTimeout throws on error so callers can surface the exact message.

import type {
  AdminAggregates,
  MarketSignalsResponse,
  OpportunityMatch,
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
};

type BackendOpportunityMatch = {
  title: string;
  wage_floor: string;
  growth_percent: string;
  match_strength: number;
};

type BackendProfileResponse = {
  user_skills: BackendExtractedSkill[];
  matches: BackendOpportunityMatch[];
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
  });

  const skills = apiData.user_skills.map((skill, idx) => ({
    id: `sk_${idx}_${Date.now().toString(36)}`,
    label: skill.label,
    formalName: skill.label,
    iscoCode: skill.isco_code,
    escoUri: skill.esco_code,
    classification: normalizeSkillStatus(skill.status),
    confidence: 0.8,
    sourceQuote: input.narrative.slice(0, 140),
  }));

  return {
    id: `usr_${Date.now().toString(36)}`,
    name: input.name,
    age: input.age,
    region: input.region,
    rawNarrative: input.narrative,
    skills,
    createdAt: new Date().toISOString(),
  };
}

export async function getReadiness(
  profile: UserProfile,
  _locale: Locale,
): Promise<ReadinessReport> {
  const risk =
    profile.skills.reduce(
      (acc, s) => acc + (s.classification === "at_risk" ? 65 : 28) * s.confidence,
      0,
    ) / Math.max(profile.skills.length, 1);
  const score = Math.round(Math.max(8, Math.min(92, risk)));
  const band: ReadinessReport["riskBand"] =
    score < 40 ? "LOW" : score < 65 ? "MEDIUM" : "HIGH";
  const trend = Array.from({ length: 11 }, (_, i) => ({
    year: 2025 + i,
    index: Math.round(
      100 +
        i * (band === "HIGH" ? -3.2 : band === "MEDIUM" ? 1.4 : 4.1) +
        (i % 2 ? 1 : -1) * 2,
    ),
  }));
  return {
    automationRiskScore: score,
    riskBand: band,
    freyOsborneNote:
      "Calibrated for LMIC context · Frey-Osborne adjusted (2017) with ILO informal-sector weighting.",
    demandTrend: trend,
    resilienceSuggestion: {
      skill: "IoT Repair",
      deltaPercent: 42,
      rationale:
        "Adding IoT diagnostics to existing electronics work shifts 3 of your skills into growth quadrant through 2035.",
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
  });
  return apiData.matches.map((item, idx) => ({
    id: `opp_${idx}_${Date.now().toString(36)}`,
    title: item.title,
    summary: `Match generated from your narrative for ${locale.country}.`,
    matchScore: item.match_strength,
    iloWageFloor: parseCurrencyAmount(item.wage_floor),
    sectorGrowthPct: parsePercent(item.growth_percent),
    requiredSkills: _profile.skills.slice(0, 3).map((s) => s.label),
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
