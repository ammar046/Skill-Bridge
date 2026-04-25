import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp, Users, BookOpen, AlertCircle, Globe,
  BarChart3, Lightbulb, Shield, Wifi, Database, Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getPolicymakerStats } from "@/lib/api";
import type { PolicymakerLiveStats } from "@/types/api";
import { LiveKpi, SourceBadge } from "@/components/SourceBadge";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Policymaker Dashboard · UNMAPPED" }] }),
  component: PolicymakerDashboard,
});

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

  const maxGap = Math.max(...stats.districts.map((d) => d.skill_gap));
  const liveCount = stats.live_indicators_count;

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">

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
        <LiveKpi
          label="Human Capital Index"
          indicator={stats.hci_score}
          format={(v) => `${v.toFixed(2)} / 1.0`}
          accent="neutral"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* KPI grid — all with live source badges */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <LiveKpi
          label="Youth NEET Rate"
          indicator={stats.neet_rate_pct}
          format={(v) => `${v.toFixed(1)}%`}
          accent="risk"
          icon={<Users className="h-4 w-4" />}
        />
        <LiveKpi
          label="Secondary Enrollment"
          indicator={stats.gross_secondary_enrollment_pct}
          format={(v) => `${v.toFixed(1)}%`}
          accent="neutral"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <LiveKpi
          label="Internet Penetration"
          indicator={stats.internet_penetration_pct}
          format={(v) => `${v.toFixed(1)}%`}
          accent="neutral"
          icon={<Globe className="h-4 w-4" />}
        />
        <LiveKpi
          label="ILO Wage Floor"
          indicator={stats.wage_floor_local}
          format={(v) => `${locale.currencySymbol}${v.toLocaleString()}/mo`}
          accent="durable"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <LiveKpi
          label="Vulnerable Employment"
          indicator={stats.vulnerable_employment_pct}
          format={(v) => `${v.toFixed(1)}%`}
          accent="risk"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <LiveKpi
          label="Automation Delay (ITU)"
          indicator={stats.automation_delay_years}
          format={(v) => `~${v} yr${v !== 1 ? "s" : ""} vs OECD`}
          accent="durable"
          icon={<Zap className="h-4 w-4" />}
        />
        {stats.gender_wage_gap?.available && (
          <LiveKpi
            label="Gender Wage Gap"
            indicator={stats.gender_wage_gap}
            format={(v) => `${v.toFixed(1)}% less for women`}
            accent="risk"
            icon={<Users className="h-4 w-4" />}
          />
        )}
      </div>

      {/* Growth sectors + district map */}
      <div className="grid gap-6 md:grid-cols-2">

        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Top Growth Sectors
            </h2>
          </div>
          <SourceBadge
            source="ILOSTAT sector employment projections 2024 · Wittgenstein Centre SSP2"
            live={false}
            year="2025-2035"
          />
          <ul className="mt-4 space-y-3">
            {stats.top_growth_sectors.map((s) => (
              <li key={s.sector}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium capitalize text-foreground">
                    {s.sector.replace(/_/g, " ")}
                  </span>
                  <span className="num font-semibold text-signal-durable">+{s.growth_pct}%/yr</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-signal-durable"
                      style={{ width: `${s.demand_gap_pct}%` }}
                    />
                  </div>
                  <span className="num w-16 text-right text-[10px] text-signal-risk">
                    {s.demand_gap_pct}% gap
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Skill Gap by District
            </h2>
          </div>
          <SourceBadge source="World Bank HCI subnational estimates 2024 · UNMAPPED aggregation" live={false} />
          <ul className="mt-4 space-y-2">
            {[...stats.districts]
              .sort((a, b) => b.skill_gap - a.skill_gap)
              .map((d) => {
                const pct = (d.skill_gap / maxGap) * 100;
                const isHigh = d.skill_gap >= 70;
                return (
                  <li key={d.name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs text-foreground">{d.name}</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={"absolute left-0 top-0 h-full rounded-full " + (isHigh ? "bg-signal-risk" : "bg-amber-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="num w-8 text-right text-[10px] text-muted-foreground">{d.skill_gap}</span>
                    <span className="num w-12 text-right text-[10px] text-muted-foreground">HCI {d.hci_local.toFixed(2)}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      </div>

      {/* ITU Automation delay callout */}
      {stats.automation_delay_years.value !== null && stats.automation_delay_years.value > 0 && (
        <section className="rounded-2xl border border-signal-durable/20 bg-signal-durable-soft p-5">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-signal-durable" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                ITU Digital Development: ~{stats.automation_delay_years.value} year automation delay vs OECD baseline
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.automation_delay_years.label}
              </p>
              <SourceBadge source={stats.automation_delay_years.source} live={stats.automation_delay_years.live} />
            </div>
          </div>
        </section>
      )}

      {/* Frey-Osborne + Wittgenstein */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Frey-Osborne LMIC Calibration
            </h2>
          </div>
          <SourceBadge source="Frey & Osborne (2017) · ILO LMIC adjustment (2019)" live={false} year="2019" />
          <p className="mt-3 text-sm leading-relaxed text-foreground">{stats.frey_osborne_calibration}</p>
        </section>

        <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Wittgenstein 2025-2035 Projection
            </h2>
          </div>
          <SourceBadge source={stats.wittgenstein_source} live={false} year="2025-2035" />
          <p className="mt-3 text-sm leading-relaxed text-foreground">{stats.wittgenstein_note}</p>
        </section>
      </div>

      {/* TVET Infrastructure */}
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            RPL &amp; TVET Infrastructure
          </h2>
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
            <p className="mt-1 font-semibold text-signal-durable">
              +{stats.top_growth_sectors[0]?.demand_gap_pct ?? "—"}% demand gap
            </p>
            <SourceBadge source="World Bank STEP Skills Measurement Programme" live={false} />
          </div>
        </div>
      </section>

      {/* Policy Insights */}
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence-Based Policy Signals
          </h2>
        </div>
        <ul className="space-y-3">
          {stats.policy_insights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {i + 1}
              </span>
              <p className="leading-relaxed text-foreground">{insight}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-hairline pt-3">
          <SourceBadge
            source="ILOSTAT 2024 · World Bank HCI &amp; WDI 2024 · Wittgenstein Centre SSP2 · Frey &amp; Osborne (2017) LMIC-adjusted · World Bank STEP"
            live={false}
            year="2024"
          />
        </div>
      </section>

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 py-2">
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
      <p className="mt-1 rounded-lg border border-signal-risk/30 bg-signal-risk-soft p-3 font-mono text-xs text-signal-risk">
        {message}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Ensure the backend is running at localhost:8000
      </p>
    </div>
  );
}
