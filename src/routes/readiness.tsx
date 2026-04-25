import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
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
    if (!profile) { navigate({ to: "/onboarding" }); return; }
    getReadiness(profile, locale).then(setReport);
  }, [profile, locale, navigate]);

  if (!profile || !report) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Calibrating…</div>;
  }

  const bandColor =
    report.riskBand === "LOW" ? "text-signal-durable" :
      report.riskBand === "HIGH" ? "text-signal-risk" : "text-foreground";

  return (
    <div className="space-y-6 py-2">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">AI readiness & displacement lens</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">How automation will touch your work</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr,1.4fr]">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Automation risk score</h2>
          <p className="mt-1 text-xs text-muted-foreground">{report.freyOsborneNote}</p>
          <Gauge percent={report.automationRiskScore} band={report.riskBand} />
          <div className="mt-2 text-center">
            <div className={`num text-3xl font-semibold ${bandColor}`}>{report.automationRiskScore}%</div>
            <div className={`text-xs font-semibold uppercase tracking-wider ${bandColor}`}>{report.riskBand} risk</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Wittgenstein demand trend (2025–2035)</h2>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{locale.region}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Region-specific projection of demand for your skill mix. 100 = today.
          </p>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer>
              <LineChart data={report.demandTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} stroke="var(--grid)" />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-muted)" }} stroke="var(--grid)" />
                <ReferenceLine y={100} stroke="var(--grid)" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                <Line
                  type="monotone" dataKey="index"
                  stroke="var(--signal-durable)" strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--signal-durable)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-signal-durable/40 bg-signal-durable-soft p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-signal-durable/15 p-2 text-signal-durable">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Resilience suggestion</h3>
            <p className="mt-1 text-base font-medium text-foreground">
              Learn <span className="underline decoration-signal-durable decoration-2 underline-offset-2">{report.resilienceSuggestion.skill}</span>
              {" "}to increase resilience by{" "}
              <span className="num text-signal-durable">+{report.resilienceSuggestion.deltaPercent}%</span>.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{report.resilienceSuggestion.rationale}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          See opportunities <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Gauge({ percent, band }: { percent: number; band: ReadinessReport["riskBand"] }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  const color = band === "LOW" ? "var(--signal-durable)" : band === "HIGH" ? "var(--signal-risk)" : "var(--ink)";
  return (
    <div className="mt-4 flex justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--grid)" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c / 4}
          strokeLinecap="round" transform="rotate(-90 90 90)"
        />
      </svg>
    </div>
  );
}
