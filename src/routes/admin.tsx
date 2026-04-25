import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, TrendingDown, Users, GraduationCap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getAdminAggregates } from "@/lib/api";
import type { AdminAggregates } from "@/types/api";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Policymaker Dashboard · UNMAPPED" }] }),
  component: Admin,
});

function Admin() {
  const { locale } = useApp();
  const [data, setData] = useState<AdminAggregates | null>(null);

  useEffect(() => { getAdminAggregates(locale).then(setData); }, [locale]);

  if (!data) return <div className="py-16 text-center text-sm text-muted-foreground">Loading aggregates…</div>;

  return (
    <div className="space-y-6 py-2">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Policymaker dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{locale.country} skills landscape</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregated from ILO, World Bank, UNESCO, and UNMAPPED field intake. Read-only demo.
          </p>
        </div>
        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {locale.flag} {locale.country} · {locale.educationTaxonomy}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" />} source="ILO"
          label="Youth NEET rate" value={`${data.neetRate.toFixed(1)}%`}
          context="15–24, not in employment, education, training"
          tone="risk"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />} source="World Bank"
          label="Human Capital Index" value={data.hciScore.toFixed(2)}
          context="0 = no capital · 1 = full potential"
          tone="neutral"
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4" />} source="UNESCO"
          label="Secondary enrollment" value={`${data.enrollment.toFixed(1)}%`}
          context="Gross enrollment ratio, latest year"
          tone="durable"
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Skill gap heatmap by district</h2>
          <Legend />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Higher value = larger mismatch between informal-sector skill supply and projected sector demand.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {data.districts.map((d) => (
            <div
              key={d.name}
              className="rounded-md border border-border p-3"
              style={{ background: heatColor(d.gap) }}
            >
              <div className="text-xs font-semibold text-foreground">{d.name}</div>
              <div className="num mt-1 text-lg font-semibold text-foreground">{d.gap}</div>
              <div className="text-[10px] uppercase tracking-wider text-foreground/70">gap index</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-foreground/5 p-1.5"><Sparkles className="h-4 w-4 text-foreground" /></div>
          <h2 className="text-sm font-semibold">Claude AI insights</h2>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Auto-generated · mock</span>
        </div>
        <ul className="mt-4 space-y-3">
          {data.insights.map((insight, i) => (
            <li key={i} className="rounded-lg border border-border bg-surface-raised p-3 text-sm leading-relaxed text-foreground">
              <span className="num mr-2 text-xs font-semibold text-muted-foreground">0{i + 1}</span>
              {insight}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  icon, source, label, value, context, tone,
}: { icon: React.ReactNode; source: string; label: string; value: string; context: string; tone: "risk" | "durable" | "neutral" }) {
  const valColor = tone === "risk" ? "text-signal-risk" : tone === "durable" ? "text-signal-durable" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <span className="rounded-md bg-muted p-1.5">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{source}</span>
      </div>
      <div className={`num mt-3 text-3xl font-semibold ${valColor}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{context}</div>
    </div>
  );
}

function heatColor(gap: number): string {
  // Map 0..100 → green-ish to amber-ish
  // Use HSL for perceptual smoothness
  const h = 150 - (gap / 100) * 110; // 150 (green) → 40 (amber)
  const l = 95 - (gap / 100) * 22;   // 95 → 73
  return `hsl(${h.toFixed(0)} 70% ${l.toFixed(0)}%)`;
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
      <span>Low</span>
      <div className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, hsl(150 70% 95%), hsl(40 70% 73%))" }} />
      <span>High</span>
    </div>
  );
}
