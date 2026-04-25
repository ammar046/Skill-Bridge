import { useState } from "react";
import { Info, ShieldCheck, AlertTriangle, Zap, ChevronDown, ChevronRight } from "lucide-react";
import type { Skill } from "@/types/api";

// ILO Future of Work (2020) task-content index labels
// Source: ILO World Employment and Social Outlook 2020 — Appendix
const ILO_TASK_LABELS: Record<string, { short: string; description: string; risk: "low" | "medium" | "high" }> = {
  non_routine_cognitive: {
    short: "Non-routine cognitive",
    description: "Requires creativity, judgment, problem-solving and planning — hard to automate. ILO classifies this as HIGH resilience.",
    risk: "low",
  },
  routine_cognitive: {
    short: "Routine cognitive",
    description: "Rule-following, pattern-matching and data processing. ILO classifies this as HIGH automation susceptibility.",
    risk: "high",
  },
  non_routine_manual_interpersonal: {
    short: "Non-routine manual / interpersonal",
    description: "Personal interaction, care, trust and situational adaptability. Automation requires social intelligence not yet achieved by AI.",
    risk: "low",
  },
  non_routine_manual_technical: {
    short: "Non-routine manual / technical",
    description: "Craft, repair and trades requiring physical dexterity and context-specific judgment. Medium resilience — automation is capital-intensive.",
    risk: "medium",
  },
  routine_manual: {
    short: "Routine manual",
    description: "Repetitive physical operations following fixed sequences. ILO classifies this as HIGH automation susceptibility over 2025–2035.",
    risk: "high",
  },
  mixed_cognitive_technical: {
    short: "Mixed — cognitive + technical",
    description: "Combines technical skill with cognitive judgment. Partially resilient — technical component may automate before cognitive component.",
    risk: "medium",
  },
};

function getIloLabel(type?: string) {
  return ILO_TASK_LABELS[type ?? ""] ?? {
    short: "Mixed task profile",
    description: "Mixed task profile — requires further assessment against ILO task-content indices.",
    risk: "medium" as const,
  };
}

function classificationRationale(skill: Skill, isDurable: boolean, foPercent: number | null): string {
  const ilo = getIloLabel(skill.iloTaskType);
  const foStr = foPercent != null ? `${foPercent}% LMIC-adjusted automation probability (Frey & Osborne 2013, Oxford)` : "automation probability unavailable";
  const task = ilo.short;

  if (isDurable) {
    return (
      `Classified as DURABLE: ${task} demand (ILO Future of Work 2020) ` +
      `and ${foStr}. ` +
      `LMIC calibration applied per ILO (2019) — capital-labour cost ratios in this region delay automation adoption.`
    );
  }
  return (
    `Classified as AT RISK: ${task} profile (ILO Future of Work 2020) ` +
    `and ${foStr}. ` +
    `Wittgenstein Centre SSP2 projections (2025–2035) indicate declining demand unless upskilling occurs.`
  );
}

export function SkillBadge({ skill }: { skill: Skill }) {
  const [open, setOpen] = useState(false);
  const [adjacentOpen, setAdjacentOpen] = useState(false);
  const isDurable = skill.classification === "durable";
  const isTransitioning = skill.classification === "transitioning";
  const foPercent = skill.freyOsborneScore != null ? Math.round(skill.freyOsborneScore * 100) : null;
  const ilo = getIloLabel(skill.iloTaskType);
  const hasAdjacent = (skill.adjacentSkills?.length ?? 0) > 0;
  const hasTavilyEvidence = skill.resilienceNote?.startsWith("Live evidence");

  const badgeColors = isDurable
    ? "border-signal-durable/40 bg-signal-durable-soft text-signal-durable"
    : isTransitioning
      ? "border-amber-400/40 bg-amber-50 text-amber-700"
      : "border-signal-risk/40 bg-signal-risk-soft text-signal-risk";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm ${badgeColors}`}
        aria-expanded={open}
        title="Click to see AI reasoning"
      >
        {isDurable ? (
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        ) : isTransitioning ? (
          <Zap className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        )}
        {skill.label}
        <Info className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div
            className="absolute left-0 top-full z-20 mt-2 w-80 animate-fade-up rounded-xl border border-hairline bg-card p-4 shadow-lift"
            role="tooltip"
          >
            {/* Header */}
            <div className="flex items-start gap-2">
              {isDurable ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal-durable" />
              ) : isTransitioning ? (
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-risk" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{skill.label}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ISCO-08 · {skill.iscoCode}
                </p>
              </div>
            </div>

            {/* AI Classification Reasoning — institutional terminology */}
            <div className="mt-3 rounded-lg border border-hairline bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                AI Reasoning — Institutional Basis
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground">
                {classificationRationale(skill, isDurable, foPercent)}
              </p>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">

              {/* Frey-Osborne score */}
              {foPercent != null && (
                <div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Frey-Osborne automation probability</span>
                    <span
                      className={`num font-semibold ${
                        foPercent >= 65
                          ? "text-signal-risk"
                          : foPercent >= 40
                            ? "text-amber-600"
                            : "text-signal-durable"
                      }`}
                    >
                      {foPercent}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        foPercent >= 65
                          ? "bg-signal-risk"
                          : foPercent >= 40
                            ? "bg-amber-400"
                            : "bg-signal-durable"
                      }`}
                      style={{ width: `${foPercent}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    Source: Frey &amp; Osborne (2013) "The Future of Employment" · Oxford Martin Programme ·
                    LMIC-adjusted per ILO working paper (2019) · ILO-ISCO O*NET cross-walk
                  </p>
                </div>
              )}

              {/* ILO task profile */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ILO task-content index</span>
                  <span
                    className={`font-semibold ${
                      ilo.risk === "low"
                        ? "text-signal-durable"
                        : ilo.risk === "high"
                          ? "text-signal-risk"
                          : "text-amber-600"
                    }`}
                  >
                    {ilo.short}
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] leading-snug text-muted-foreground">
                  {ilo.description}
                </p>
                <p className="mt-0.5 text-[9px] text-muted-foreground/60">
                  Source: ILO World Employment and Social Outlook 2020 — Chapter 3, Appendix
                </p>
              </div>

              {/* ESCO / ISCO */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ISCO-08 classification</span>
                <span className="num font-medium text-foreground">{skill.iscoCode}</span>
              </div>

              {/* Live resilience evidence */}
              {skill.resilienceNote && (
                <div className="rounded-lg border border-hairline bg-muted/50 p-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {hasTavilyEvidence ? "Live Evidence (Tavily web search · city-specific)" : "Assessment Basis"}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-foreground">
                    {skill.resilienceNote}
                  </p>
                </div>
              )}

              {/* Epistemic honesty — limitations */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                  ⚠ Limitations of this score
                </p>
                <p className="mt-1 text-[10px] leading-snug italic text-amber-800">
                  {foPercent != null
                    ? "This probability is derived from Frey & Osborne (2013) — a study of US occupations in a high-income context. An ILO (2019) LMIC calibration discount of 20% has been applied, but local task composition in your city may differ further. Treat this as directional, not definitive."
                    : "Automation probability unavailable for this ISCO code. Classification is based on ILO task-content indices only."}
                </p>
                {!hasTavilyEvidence && (
                  <p className="mt-1 text-[10px] leading-snug italic text-amber-800">
                    No live city-specific data was found for this skill. The assessment above is based on the Oxford 2013 paper and ILO task indices only.
                  </p>
                )}
                {hasTavilyEvidence && (
                  <p className="mt-1 text-[10px] leading-snug italic text-amber-800">
                    Job market evidence is sourced from a live web search conducted at the time of your assessment. Results reflect publicly available data and may not represent the full local market.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-3 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* Adjacent skills — expandable resilience panel */}
      {hasAdjacent && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setAdjacentOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/50 bg-teal-50 px-3 py-1 text-[10px] font-semibold text-teal-700 transition-colors hover:bg-teal-100"
          >
            {adjacentOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Build resilience
          </button>

          {adjacentOpen && (
            <div className="mt-2 rounded-xl border border-teal-200 bg-teal-50/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                Skills that would make you more resilient
              </p>
              <p className="mt-0.5 text-[9px] text-teal-600">
                Source: Frey &amp; Osborne 2013 + ILO WESO 2020
              </p>
              <ul className="mt-2 space-y-2">
                {skill.adjacentSkills!.map((adj) => {
                  const currentPct = foPercent ?? 50;
                  const targetPct = Math.max(5, currentPct - Math.round(adj.resilience_delta * 100));
                  return (
                    <li key={adj.isco_code} className="rounded-lg border border-teal-200 bg-white p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-foreground">{adj.label}</p>
                          <p className="text-[9px] text-muted-foreground">
                            ISCO {adj.isco_code} · {adj.training_type} · {adj.estimated_weeks}w
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                          +{Math.round(adj.resilience_delta * 100)}% resilient
                        </span>
                      </div>
                      {/* F-O progress arrow */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="num text-[9px] text-muted-foreground">{currentPct}%</span>
                        <div className="relative flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="absolute left-0 h-full rounded-full bg-signal-risk"
                            style={{ width: `${currentPct}%` }}
                          />
                          <div
                            className="absolute left-0 h-full rounded-full bg-teal-500 opacity-70 transition-all duration-700"
                            style={{ width: `${targetPct}%` }}
                          />
                        </div>
                        <span className="num text-[9px] font-semibold text-teal-700">→ {targetPct}%</span>
                      </div>
                      <p className="mt-1 text-[9px] leading-snug text-muted-foreground italic">
                        {adj.rationale}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
