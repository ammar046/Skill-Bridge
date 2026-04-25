import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, AlertTriangle, Shield, Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { getReadiness } from "@/lib/api";
import type { ReadinessReport } from "@/types/api";

export const Route = createFileRoute("/readiness")({
  head: () => ({ meta: [{ title: "AI Readiness · UNMAPPED" }] }),
  component: Readiness,
});

function Readiness() {
  const { profile, locale } = useApp();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReadinessReport | null>(null);

  useEffect(() => {
    if (!profile) {
      navigate({ to: "/onboarding" });
      return;
    }
    getReadiness(profile, locale).then(setReport);
  }, [profile, locale, navigate]);

  if (!profile || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse text-signal-durable" />
          Calibrating Frey-Osborne for {locale.country}…
        </div>
      </div>
    );
  }

  const bandColor =
    report.riskBand === "LOW"
      ? "text-signal-durable"
      : report.riskBand === "HIGH"
        ? "text-signal-risk"
        : "text-foreground";
  const BandIcon =
    report.riskBand === "LOW"
      ? Shield
      : report.riskBand === "HIGH"
        ? AlertTriangle
        : Activity;

  return (
    <div className="space-y-8 py-2">
      <header className="border-b border-hairline pb-8 animate-fade-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          AI readiness & displacement lens
        </p>
        <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
          How automation will touch your work.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Frey-Osborne (2017) probabilities adjusted for LMIC informal-sector weighting,
          plotted against Wittgenstein Centre projections for {locale.region}.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Risk gauge */}
        <div className="md:col-span-5 rounded-2xl border border-hairline bg-card p-6 shadow-card animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Automation risk score
            </h2>
            <span
              className={
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                (report.riskBand === "LOW"
                  ? "border-signal-durable/40 bg-signal-durable-soft text-signal-durable"
                  : report.riskBand === "HIGH"
                    ? "border-signal-risk/40 bg-signal-risk-soft text-signal-risk"
                    : "border-hairline bg-muted text-foreground")
              }
            >
              <BandIcon className="h-3 w-3" /> {report.riskBand}
            </span>
          </div>

          <Gauge percent={report.automationRiskScore} band={report.riskBand} />

          <div className="mt-2 text-center">
            <div className={`num display text-5xl font-semibold ${bandColor}`}>
              {report.automationRiskScore}
              <span className="text-2xl">%</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
              {report.freyOsborneNote}
            </p>
          </div>
        </div>

        {/* Demand horizon chart */}
        <div className="md:col-span-7 rounded-2xl border border-hairline bg-card p-6 shadow-card animate-fade-up [animation-delay:80ms]">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Wittgenstein demand trend · 2025–2035
            </h2>
            <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
              {locale.region} · index 100 = today
            </span>
          </div>

          <div className="mt-5 h-60 w-full">
            <ResponsiveContainer>
              <AreaChart
                data={report.demandTrend}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--signal-durable)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--signal-durable)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                  stroke="var(--grid)"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                  stroke="var(--grid)"
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine
                  y={100}
                  stroke="var(--ink-muted)"
                  strokeDasharray="3 3"
                  label={{
                    value: "today",
                    position: "right",
                    fontSize: 10,
                    fill: "var(--ink-muted)",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="var(--signal-durable)"
                  strokeWidth={2.5}
                  fill="url(#demandGrad)"
                  dot={{ r: 3, fill: "var(--signal-durable)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Region-specific projection of demand for your skill mix.
          </p>
        </div>
      </div>

      {/* Resilience suggestion */}
      <div className="relative overflow-hidden rounded-2xl border border-signal-durable/30 bg-signal-durable-soft p-6 md:p-8 animate-fade-up [animation-delay:160ms]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-signal-durable/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-signal-durable/20 text-signal-durable">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-durable">
              Resilience suggestion · UNMAPPED engine
            </p>
            <h3 className="display mt-2 text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
              Learn{" "}
              <span className="underline decoration-signal-durable decoration-[3px] underline-offset-4">
                {report.resilienceSuggestion.skill}
              </span>{" "}
              to lift resilience by{" "}
              <span className="num text-signal-durable">
                +{report.resilienceSuggestion.deltaPercent}%
              </span>
              .
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              {report.resilienceSuggestion.rationale}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to="/opportunities"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-card transition-all hover:translate-y-[-1px]"
        >
          See real opportunities{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function Gauge({
  percent,
  band,
}: {
  percent: number;
  band: ReadinessReport["riskBand"];
}) {
  // Half-arc gauge (180°) — more dramatic than full circle
  const r = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = Math.PI; // 180°
  const endAngle = 0;
  const valAngle = startAngle - (percent / 100) * Math.PI;

  const arcPath = (a1: number, a2: number) => {
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy - r * Math.sin(a2);
    const large = a1 - a2 > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const color =
    band === "LOW"
      ? "var(--signal-durable)"
      : band === "HIGH"
        ? "var(--signal-risk)"
        : "var(--ink)";

  // Tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = startAngle - (i / 10) * Math.PI;
    const inner = r - 6;
    const outer = r + 4;
    return {
      x1: cx + inner * Math.cos(a),
      y1: cy - inner * Math.sin(a),
      x2: cx + outer * Math.cos(a),
      y2: cy - outer * Math.sin(a),
      key: i,
    };
  });

  return (
    <div className="mt-6 flex justify-center">
      <svg width="220" height="130" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="var(--grid)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={arcPath(startAngle, valAngle)}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Ticks */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--ink-muted)"
            strokeWidth="1"
            opacity="0.4"
          />
        ))}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + (r - 12) * Math.cos(valAngle)}
          y2={cy - (r - 12) * Math.sin(valAngle)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill="var(--background)" stroke={color} strokeWidth="2" />
        <text
          x="20"
          y="115"
          fontSize="9"
          fill="var(--ink-muted)"
          fontFamily="var(--font-mono)"
        >
          0%
        </text>
        <text
          x="170"
          y="115"
          fontSize="9"
          fill="var(--ink-muted)"
          fontFamily="var(--font-mono)"
        >
          100%
        </text>
      </svg>
    </div>
  );
}
