import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp, Users, BookOpen, AlertCircle, Globe,
  BarChart3, Lightbulb, Shield, Wifi, Database, Zap, ArrowLeft,
  Download, FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import { useApp } from "@/context/AppContext";
import { getPolicymakerStats } from "@/lib/api";
import type { AggregateIntelligence, PolicymakerLiveStats, SkillAggregate } from "@/types/api";
import { LiveKpi, SourceBadge } from "@/components/SourceBadge";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Policymaker Dashboard · UNMAPPED" }] }),
  component: PolicymakerDashboard,
});

// ── Task bucket display helpers ───────────────────────────────────────────────
const BUCKET_META: Record<string, { label: string; ilo: string }> = {
  routine_cognitive:   { label: "Routine cognitive",    ilo: "Data entry, clerks, cashiers" },
  routine_manual:      { label: "Routine manual",       ilo: "Assembly, packaging, machine operators" },
  nonroutine_cognitive:{ label: "Non-routine cognitive", ilo: "Managers, professionals, ICT" },
  nonroutine_manual:   { label: "Non-routine manual",   ilo: "Repair, craft, personal services" },
};

function bucketColor(score: number): string {
  if (score > 0.65) return "bg-signal-risk";
  if (score >= 0.35) return "bg-amber-400";
  return "bg-signal-durable";
}
function bucketTextColor(score: number): string {
  if (score > 0.65) return "text-signal-risk";
  if (score >= 0.35) return "text-amber-600";
  return "text-signal-durable";
}

// ── Policy brief PDF generator ────────────────────────────────────────────────
function downloadPolicyBrief(stats: PolicymakerLiveStats) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ai = stats.aggregate_intelligence;
  const now = new Date().toLocaleDateString();
  const localeUp = stats.locale_code.toUpperCase();
  const W = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const line = (text: string, size = 11, bold = false, color: [number,number,number] = [30,30,30]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(text, W - margin * 2);
    doc.text(wrapped, margin, y);
    y += (wrapped.length * size * 1.4);
  };
  const gap = (n = 10) => { y += n; };
  const rule = () => {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, W - margin, y);
    y += 12;
  };

  // PAGE 1
  line("UNMAPPED Skills Intelligence Brief", 22, true, [15, 80, 80]);
  gap(4);
  line(`${stats.country} (${localeUp}) · Generated ${now}${ai ? ` · ${ai.total_workers_assessed} workers assessed` : " · No workers assessed yet"}`, 11, false, [100,100,100]);
  gap(6);
  rule();

  if (ai) {
    line("Section 1 — Assessed Worker Intelligence", 14, true);
    gap(6);
    line(`Total workers assessed: ${ai.total_workers_assessed}`, 11, true);
    line(`Cities represented: ${ai.cities_represented.slice(0,5).join(", ") || "—"}`, 11);
    line(`Average automation risk: ${Math.round(ai.avg_automation_score * 100)}%`, 11);
    const breakdown = Object.entries(ai.gender_breakdown).map(([k,v]) => `${k}: ${v}`).join(" · ");
    line(`Gender breakdown: ${breakdown || "—"}`, 11);
    gap(10);

    line("Top Skills at Risk (Frey & Osborne 2013, LMIC-adjusted):", 12, true);
    gap(4);
    ai.top_skills_at_risk.forEach((s, i) => {
      line(`  ${i+1}. ${s.label} (ISCO ${s.isco_code}) — ${Math.round(s.avg_automation_score*100)}% automation risk — ${s.count} workers`, 10);
    });
    gap(10);

    line("Most Durable Skills (ILO WESO 2020 task indices):", 12, true);
    gap(4);
    ai.top_durable_skills.forEach((s, i) => {
      line(`  ${i+1}. ${s.label} (ISCO ${s.isco_code}) — ${Math.round(s.avg_automation_score*100)}% automation risk — ${s.count} workers`, 10);
    });
    gap(12);

    // Policy signal callout
    const topRisk = ai.top_skills_at_risk[0];
    const topDurable = ai.top_durable_skills[0];
    if (topRisk || topDurable) {
      rule();
      line("Policy Signal", 14, true, [15, 80, 80]);
      gap(6);
      const callout = `Based on ${ai.total_workers_assessed} workers assessed in ${stats.country}: ` +
        (topRisk ? `The most common at-risk skill is "${topRisk.label}" held by ${topRisk.count} workers, ` +
          `with a ${Math.round(topRisk.avg_automation_score*100)}% automation probability ` +
          `(Frey & Osborne 2013, LMIC-adjusted). ` : "") +
        (topDurable ? `The most durable skill is "${topDurable.label}". ` : "") +
        `Recommended policy signal: prioritise vocational pathways that bridge workers ` +
        `from at-risk routine occupations toward non-routine technical and cognitive roles.`;
      line(callout, 11, false, [30,30,30]);
    }
  } else {
    line("No workers have been assessed yet in this session.", 12, false, [120,120,120]);
    line("Run the UNMAPPED onboarding flow to generate skills intelligence.", 11, false, [120,120,120]);
  }

  // PAGE 2 — Regional context
  doc.addPage();
  y = margin;
  line("Section 2 — Regional Economic Context (World Bank WDI / ILO)", 14, true);
  gap(6);
  const kpis = [
    ["Human Capital Index", stats.hci_score.value?.toFixed(2) ?? "—", stats.hci_score.source],
    ["Youth NEET Rate", `${stats.neet_rate_pct.value?.toFixed(1) ?? "—"}%`, stats.neet_rate_pct.source],
    ["Secondary Enrollment", `${stats.gross_secondary_enrollment_pct.value?.toFixed(1) ?? "—"}%`, stats.gross_secondary_enrollment_pct.source],
    ["Internet Penetration", `${stats.internet_penetration_pct.value?.toFixed(1) ?? "—"}%`, stats.internet_penetration_pct.source],
    ["ILO Wage Floor", `${stats.wage_floor_local.value?.toLocaleString() ?? "—"}`, stats.wage_floor_local.source],
    ["Gender Wage Gap", `${stats.gender_wage_gap.value?.toFixed(1) ?? "—"}% less for women`, stats.gender_wage_gap.source],
  ];
  kpis.forEach(([label, value, source]) => {
    line(`${label}: ${value}`, 11, false);
    line(`  Source: ${source}`, 9, false, [130,130,130]);
    gap(4);
  });

  gap(12);
  rule();
  line("Task Bucket Automation Risk (Frey & Osborne 2013 × ILO WESO 2020)", 12, true);
  gap(6);
  Object.entries(stats.task_bucket_averages).forEach(([bucket, score]) => {
    const meta = BUCKET_META[bucket];
    line(`${meta?.label ?? bucket}: ${Math.round(score * 100)}% avg automation risk (${meta?.ilo ?? ""})`, 10);
  });

  gap(16);
  rule();
  line("Source Attribution", 11, true);
  line("Frey & Osborne (2013) 'The Future of Employment' · Oxford Martin Programme · ILO O*NET ISCO cross-walk (2019) · ILO LMIC calibration (2019) · ILO Global Wage Report 2024 · World Bank WDI 2024 · Wittgenstein Centre SSP2 2025-2035 · ILOSTAT published baselines 2024 · World Bank HCI 2024", 9, false, [130,130,130]);

  doc.save(`unmapped-policy-brief-${localeUp}-${now.replace(/\//g,"-")}.pdf`);
}

// ── Main component ─────────────────────────────────────────────────────────────
function PolicymakerDashboard() {
  const { locale } = useApp();
  const [stats, setStats] = useState<PolicymakerLiveStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPolicymakerStats(locale)
      .then((data) => { setStats(data); setLoading(false); })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [locale]);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) return <ErrorState message={error ?? "Unknown error"} />;

  const ai = stats.aggregate_intelligence;
  const maxGap = Math.max(...stats.districts.map((d) => d.skill_gap));
  const liveCount = stats.live_indicators_count;
  const workerCount = ai?.total_workers_assessed ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">

      {/* Back nav */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      {/* FIX 4 — Live vs session clarity banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline bg-paper px-4 py-3 text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold text-signal-durable">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-durable" />
          Live data: World Bank WDI · ILOSTAT · Tavily
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Database className="h-3 w-3" />
          Session data: {workerCount} worker{workerCount !== 1 ? "s" : ""} assessed since server start · Resets on restart
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            UNMAPPED Protocol · Policymaker Intelligence Layer
          </p>
          <h1 className="display mt-1 text-3xl font-semibold tracking-tight">
            {stats.country} — {stats.context}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregate econometric signals for workforce policy and investment targeting
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-signal-durable/30 bg-signal-durable-soft px-2.5 py-1 text-[10px] font-semibold text-signal-durable">
              <Wifi className="h-3 w-3" />
              {liveCount} live indicators (World Bank WDI)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
              <Database className="h-3 w-3" />
              ILOSTAT · Wittgenstein Centre published baselines
            </span>
            <span className="text-[9px] text-muted-foreground">
              Updated: {new Date(stats.fetched_at).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* FIX 5 — Policy brief button */}
          <button
            onClick={() => downloadPolicyBrief(stats)}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            Download Policy Brief
          </button>
          <LiveKpi
            label="Human Capital Index"
            indicator={stats.hci_score}
            format={(v) => `${v.toFixed(2)} / 1.0`}
            accent="neutral"
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FIX 1 — Aggregate Skills Intelligence (UNMAPPED-exclusive data)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Skills intelligence from assessed workers
          </h2>
          <span className="rounded-full border border-teal-300/50 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700">
            UNMAPPED-exclusive
          </span>
        </div>

        {!ai ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-paper px-8 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">No workers assessed yet in this session</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Data will appear here as workers complete the UNMAPPED onboarding flow. Complete an onboarding, then return to this dashboard.
            </p>
            <Link
              to="/onboarding"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
            >
              Run a demo assessment →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Row 1 — Four summary metric cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workers assessed</p>
                <p className="num mt-2 text-3xl font-semibold text-foreground">{ai.total_workers_assessed}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">this session</p>
              </div>
              <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Cities represented</p>
                <p className="mt-2 text-sm font-semibold text-foreground leading-snug">
                  {ai.cities_represented.length > 3
                    ? `${ai.cities_represented.slice(0, 3).join(", ")} +${ai.cities_represented.length - 3}`
                    : ai.cities_represented.join(", ") || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Avg automation risk</p>
                <p className={`num mt-2 text-3xl font-semibold ${ai.avg_automation_score > 0.5 ? "text-amber-500" : "text-signal-durable"}`}>
                  {Math.round(ai.avg_automation_score * 100)}%
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">Frey-Osborne LMIC</p>
              </div>
              <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Gender breakdown</p>
                <GenderBar breakdown={ai.gender_breakdown} />
              </div>
            </div>

            {/* Row 2 — At-risk + Durable panels */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left — at risk */}
              <div className="rounded-2xl border border-signal-risk/20 bg-card p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-signal-risk" />
                    <h3 className="text-sm font-semibold text-foreground">Skills most at risk</h3>
                  </div>
                  <span className="rounded border border-hairline bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    Source: Frey &amp; Osborne 2013, LMIC-calibrated
                  </span>
                </div>
                {ai.top_skills_at_risk.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No high-risk skills detected yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {ai.top_skills_at_risk.map((s) => (
                      <SkillRiskRow key={s.isco_code} skill={s} variant="risk" />
                    ))}
                  </ul>
                )}
              </div>

              {/* Right — durable */}
              <div className="rounded-2xl border border-signal-durable/20 bg-card p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-signal-durable" />
                    <h3 className="text-sm font-semibold text-foreground">Durable skills in this workforce</h3>
                  </div>
                  <span className="rounded border border-hairline bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    Source: ILO WESO 2020 task indices
                  </span>
                </div>
                {ai.top_durable_skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No durable skills detected yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {ai.top_durable_skills.map((s) => (
                      <SkillRiskRow key={s.isco_code} skill={s} variant="durable" />
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Row 3 — Policy signal callout (headline deliverable) */}
            <PolicySignalCallout ai={ai} country={stats.country} />

          </div>
        )}
      </section>

      {/* FIX 3 — Automation risk by task bucket */}
      {Object.keys(stats.task_bucket_averages).length > 0 && (
        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Automation risk by skill type in this locale
            </h2>
          </div>
          <SourceBadge source="Frey & Osborne 2013 × ILO WESO 2020 task-content classification" live={false} year="2013–2020" />
          <p className="mt-3 text-xs text-muted-foreground">
            Frey-Osborne (2013) scores averaged across all ISCO-08 codes in each ILO task bucket, LMIC-adjusted (ILO 2019).
            Worker counts reflect assessed workers in this session.
          </p>
          <ul className="mt-4 space-y-4">
            {Object.entries(stats.task_bucket_averages).map(([bucket, score]) => {
              const meta = BUCKET_META[bucket] ?? { label: bucket, ilo: "" };
              const workerBucketCount = ai?.skill_distribution.filter((s) => {
                const major = s.isco_code?.charAt(0);
                if (bucket === "routine_cognitive") return major === "4";
                if (bucket === "routine_manual") return major === "8" || major === "9";
                if (bucket === "nonroutine_cognitive") return ["1","2","3"].includes(major);
                if (bucket === "nonroutine_manual") return ["5","6","7"].includes(major);
                return false;
              }).reduce((acc, s) => acc + s.count, 0) ?? 0;
              const pct = Math.round(score * 100);
              return (
                <li key={bucket}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div>
                      <span className="font-semibold text-foreground">{meta.label}</span>
                      <span className="ml-2 text-muted-foreground">{meta.ilo}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {ai && (
                        <span className="text-muted-foreground">{workerBucketCount} workers</span>
                      )}
                      <span className={`font-semibold ${bucketTextColor(score)}`}>{pct}% risk</span>
                    </div>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${bucketColor(score)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FIX 2 — Regional economic context (reframed as backdrop, not headline)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Regional economic context (World Bank WDI / ILO)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These indicators provide the macroeconomic backdrop for interpreting the skills intelligence above. All figures are country-level.
          </p>
        </div>

        {/* KPI grid — unchanged layout and badges */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <LiveKpi label="Youth NEET Rate" indicator={stats.neet_rate_pct} format={(v) => `${v.toFixed(1)}%`} accent="risk" icon={<Users className="h-4 w-4" />} />
          <LiveKpi label="Secondary Enrollment" indicator={stats.gross_secondary_enrollment_pct} format={(v) => `${v.toFixed(1)}%`} accent="neutral" icon={<BookOpen className="h-4 w-4" />} />
          <LiveKpi label="Internet Penetration" indicator={stats.internet_penetration_pct} format={(v) => `${v.toFixed(1)}%`} accent="neutral" icon={<Globe className="h-4 w-4" />} />
          <LiveKpi label="ILO Wage Floor" indicator={stats.wage_floor_local} format={(v) => `${locale.currencySymbol}${v.toLocaleString()}/mo`} accent="durable" icon={<TrendingUp className="h-4 w-4" />} />
          <LiveKpi label="Vulnerable Employment" indicator={stats.vulnerable_employment_pct} format={(v) => `${v.toFixed(1)}%`} accent="risk" icon={<AlertCircle className="h-4 w-4" />} />
          <LiveKpi label="Automation Delay (ITU)" indicator={stats.automation_delay_years} format={(v) => `~${v} yr${v !== 1 ? "s" : ""} vs OECD`} accent="durable" icon={<Zap className="h-4 w-4" />} />
          {stats.gender_wage_gap?.available && (
            <LiveKpi label="Gender Wage Gap" indicator={stats.gender_wage_gap} format={(v) => `${v.toFixed(1)}% less for women`} accent="risk" icon={<Users className="h-4 w-4" />} />
          )}
        </div>
      </section>

      {/* Growth sectors + district map — unchanged */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Growth Sectors</h2>
          </div>
          <SourceBadge source="ILOSTAT sector employment projections 2024 · Wittgenstein Centre SSP2" live={false} year="2025-2035" />
          <ul className="mt-4 space-y-3">
            {stats.top_growth_sectors.map((s) => (
              <li key={s.sector}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium capitalize text-foreground">{s.sector.replace(/_/g, " ")}</span>
                  <span className="num font-semibold text-signal-durable">+{s.growth_pct}%/yr</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="absolute left-0 top-0 h-full rounded-full bg-signal-durable" style={{ width: `${s.demand_gap_pct}%` }} />
                  </div>
                  <span className="num w-16 text-right text-[10px] text-signal-risk">{s.demand_gap_pct}% gap</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skill Gap by District</h2>
          </div>
          <SourceBadge source="World Bank HCI subnational estimates 2024 · UNMAPPED aggregation" live={false} />
          <ul className="mt-4 space-y-2">
            {[...stats.districts].sort((a, b) => b.skill_gap - a.skill_gap).map((d) => {
              const pct = (d.skill_gap / maxGap) * 100;
              const isHigh = d.skill_gap >= 70;
              return (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-foreground">{d.name}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={"absolute left-0 top-0 h-full rounded-full " + (isHigh ? "bg-signal-risk" : "bg-amber-400")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="num w-8 text-right text-[10px] text-muted-foreground">{d.skill_gap}</span>
                  <span className="num w-12 text-right text-[10px] text-muted-foreground">HCI {d.hci_local.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* ITU callout — unchanged */}
      {stats.automation_delay_years.value !== null && stats.automation_delay_years.value > 0 && (
        <section className="rounded-2xl border border-signal-durable/20 bg-signal-durable-soft p-5">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-signal-durable" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                ITU Digital Development: ~{stats.automation_delay_years.value} year automation delay vs OECD baseline
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stats.automation_delay_years.label}</p>
              <SourceBadge source={stats.automation_delay_years.source} live={stats.automation_delay_years.live} />
            </div>
          </div>
        </section>
      )}

      {/* Frey-Osborne + Wittgenstein — unchanged */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Frey-Osborne LMIC Calibration</h2>
          </div>
          <SourceBadge source="Frey & Osborne (2017) · ILO LMIC adjustment (2019)" live={false} year="2019" />
          <p className="mt-3 text-sm leading-relaxed text-foreground">{stats.frey_osborne_calibration}</p>
        </section>
        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Wittgenstein 2025-2035 Projection</h2>
          </div>
          <SourceBadge source={stats.wittgenstein_source} live={false} year="2025-2035" />
          <p className="mt-3 text-sm leading-relaxed text-foreground">{stats.wittgenstein_note}</p>
        </section>
      </div>

      {/* TVET — unchanged */}
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">RPL &amp; TVET Infrastructure</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">TVET System</p>
            <p className="mt-1 font-semibold text-foreground">{stats.tvet_name}</p>
            <SourceBadge source="UNESCO ISCED taxonomy · locales.json" live={false} />
          </div>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">RPL Pathway Uptake</p>
            <p className="mt-1 font-semibold text-foreground">{stats.rpl_uptake_pct}%</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">of eligible informal workers</p>
            <SourceBadge source="ILOSTAT 2024 published baseline" live={false} year="2024" />
          </div>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Wage premium (TVET)</p>
            <p className="mt-1 font-semibold text-signal-durable">+{stats.top_growth_sectors[0]?.demand_gap_pct ?? "—"}% demand gap</p>
            <SourceBadge source="World Bank STEP Skills Measurement Programme" live={false} />
          </div>
        </div>
      </section>

      {/* Policy Insights — unchanged */}
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Evidence-Based Policy Signals</h2>
        </div>
        <ul className="space-y-3">
          {stats.policy_insights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">{i + 1}</span>
              <p className="leading-relaxed text-foreground">{insight}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-hairline pt-3">
          <SourceBadge source="ILOSTAT 2024 · World Bank HCI &amp; WDI 2024 · Wittgenstein Centre SSP2 · Frey &amp; Osborne (2017) LMIC-adjusted · World Bank STEP" live={false} year="2024" />
        </div>
      </section>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GenderBar({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="mt-2 text-sm text-muted-foreground">—</p>;
  const colors: Record<string, string> = { female: "bg-purple-400", male: "bg-blue-400", other: "bg-amber-400", not_provided: "bg-muted-foreground/30" };
  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {Object.entries(breakdown).map(([key, count]) => (
          <div key={key} className={colors[key] ?? "bg-muted"} style={{ width: `${(count / total) * 100}%` }} title={`${key}: ${count}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {Object.entries(breakdown).map(([key, count]) => (
          <span key={key} className="text-[9px] capitalize text-muted-foreground">{key}: {count}</span>
        ))}
      </div>
    </div>
  );
}

function SkillRiskRow({ skill: s, variant }: { skill: SkillAggregate; variant: "risk" | "durable" }) {
  const pct = Math.round(s.avg_automation_score * 100);
  const barColor = variant === "risk" ? "bg-signal-risk" : "bg-signal-durable";
  const textColor = variant === "risk" ? "text-signal-risk" : "text-signal-durable";
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="min-w-0">
          <span className="font-medium text-foreground truncate">{s.label}</span>
          <span className="ml-1.5 text-muted-foreground">ISCO {s.isco_code}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-muted-foreground">{s.count} worker{s.count !== 1 ? "s" : ""}</span>
          <span className={`font-semibold ${textColor}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function PolicySignalCallout({ ai, country }: { ai: AggregateIntelligence; country: string }) {
  const topRisk = ai.top_skills_at_risk[0];
  const topDurable = ai.top_durable_skills[0];

  const callout = [
    `Based on ${ai.total_workers_assessed} worker${ai.total_workers_assessed !== 1 ? "s" : ""} assessed in ${country}:`,
    topRisk
      ? `The most common at-risk skill is "${topRisk.label}" (ISCO ${topRisk.isco_code}), ` +
        `held by ${topRisk.count} worker${topRisk.count !== 1 ? "s" : ""}, ` +
        `with a ${Math.round(topRisk.avg_automation_score * 100)}% automation probability ` +
        `(Frey & Osborne 2013, LMIC-adjusted).`
      : null,
    topDurable
      ? `The most durable skill in this workforce is "${topDurable.label}" ` +
        `(ISCO ${topDurable.isco_code}) — ${Math.round(topDurable.avg_automation_score * 100)}% automation risk.`
      : null,
    `Recommended policy signal: prioritise vocational pathways that bridge workers ` +
      `from at-risk routine occupations toward non-routine technical and cognitive roles, ` +
      `consistent with ILO WESO 2020 task-content evidence and Wittgenstein SSP2 labour-demand projections.`,
  ].filter(Boolean);

  if (!topRisk && !topDurable) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border-l-4 border-teal-500 bg-white px-6 py-5 shadow-card">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal-400/40 to-transparent" />
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-600">
              Policy signal · UNMAPPED intelligence
            </p>
            <span className="rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700">
              Ministry-ready
            </span>
          </div>
          {callout.map((sentence, i) => (
            <p key={i} className={`leading-relaxed text-foreground ${i === 0 ? "text-base font-semibold mb-2" : "text-[15px] mb-2"}`}>
              {sentence}
            </p>
          ))}
          <div className="mt-3 border-t border-teal-100 pt-3">
            <p className="text-[10px] text-muted-foreground">
              Source: Frey &amp; Osborne (2013) · ILO LMIC calibration (2019) · ILO WESO 2020 · Wittgenstein Centre SSP2 · UNMAPPED real-time assessment data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 py-2">
      <div className="h-10 rounded-xl bg-muted" />
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-72 rounded-2xl bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-signal-risk" />
      <p className="mt-3 font-semibold text-foreground">Failed to load policymaker data</p>
      <p className="mt-1 rounded-lg border border-signal-risk/30 bg-signal-risk-soft p-3 font-mono text-xs text-signal-risk">{message}</p>
      <p className="mt-3 text-xs text-muted-foreground">Ensure the backend is running at localhost:8000</p>
    </div>
  );
}
