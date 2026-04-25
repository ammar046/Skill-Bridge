import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  TrendingDown,
  Users,
  GraduationCap,
  Activity,
} from "lucide-react";
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

  useEffect(() => {
    getAdminAggregates(locale).then(setData);
  }, [locale]);

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse text-signal-durable" />
          Loading aggregates from ILO · World Bank · UNESCO…
        </div>
      </div>
    );

  const sortedDistricts = [...data.districts].sort((a, b) => b.gap - a.gap);
  const avgGap =
    data.districts.reduce((a, d) => a + d.gap, 0) / data.districts.length;

  return (
    <div className="space-y-10 py-2">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8 animate-fade-up">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Policymaker dashboard · Q1 2026
          </p>
          <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
            {locale.country} skills landscape
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Aggregated from ILO, World Bank, UNESCO, and UNMAPPED field intake. Read-only
            demo with seeded data.
          </p>
        </div>
        <span className="rounded-full border border-hairline bg-background px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {locale.flag} {locale.country} · {locale.educationTaxonomy}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          source="ILO 2024"
          label="Youth NEET rate"
          value={`${data.neetRate.toFixed(1)}%`}
          context="15–24, not in employment, education, training"
          tone="risk"
          spark={[24, 25, 26, 26.5, 27, 27.5, 28, 28.2, 28.4, data.neetRate]}
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          source="World Bank"
          label="Human Capital Index"
          value={data.hciScore.toFixed(2)}
          context="0 = no capital · 1 = full potential"
          tone="neutral"
          spark={[0.4, 0.41, 0.42, 0.42, 0.43, 0.44, 0.44, 0.44, 0.45, data.hciScore]}
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4" />}
          source="UNESCO"
          label="Secondary enrollment"
          value={`${data.enrollment.toFixed(1)}%`}
          context="Gross enrollment ratio, latest year"
          tone="durable"
          spark={[58, 60, 62, 64, 66, 68, 70, 71, 72, data.enrollment]}
        />
      </div>

      {/* Heatmap */}
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="display text-2xl font-semibold tracking-tight">
              Skill gap heatmap
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Higher value = larger mismatch between informal-sector supply and
              projected sector demand. Average:{" "}
              <span className="num font-semibold text-foreground">
                {avgGap.toFixed(0)}
              </span>
            </p>
          </div>
          <Legend />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {sortedDistricts.map((d, i) => {
            const tone =
              d.gap > 70
                ? "var(--signal-risk)"
                : d.gap > 50
                  ? "color-mix(in oklab, var(--signal-risk) 55%, var(--signal-durable))"
                  : "var(--signal-durable)";
            return (
              <div
                key={d.name}
                className="group relative overflow-hidden rounded-xl border border-hairline bg-background p-4 transition-all hover:shadow-lift animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground">{d.name}</div>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: tone }}
                  />
                </div>
                <div className="num mt-3 text-2xl font-semibold text-foreground">
                  {d.gap}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.gap}%`, background: tone }}
                  />
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Gap index
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top urgent districts */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-signal-risk/30 bg-signal-risk-soft p-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-risk">
            Top intervention priority
          </h3>
          <ul className="mt-4 space-y-3">
            {sortedDistricts.slice(0, 3).map((d, i) => (
              <li
                key={d.name}
                className="flex items-center justify-between border-b border-signal-risk/20 pb-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="num text-2xl font-semibold text-signal-risk">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="display text-base font-semibold text-foreground">
                      {d.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mobile TVET deployment recommended
                    </div>
                  </div>
                </div>
                <div className="num text-xl font-semibold text-signal-risk">
                  {d.gap}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-signal-durable/30 bg-signal-durable-soft p-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-durable">
            Lowest gap · scale-ready
          </h3>
          <ul className="mt-4 space-y-3">
            {[...sortedDistricts]
              .reverse()
              .slice(0, 3)
              .map((d, i) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between border-b border-signal-durable/20 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="num text-2xl font-semibold text-signal-durable">
                      0{i + 1}
                    </span>
                    <div>
                      <div className="display text-base font-semibold text-foreground">
                        {d.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        RPL pathways have proven uptake
                      </div>
                    </div>
                  </div>
                  <div className="num text-xl font-semibold text-signal-durable">
                    {d.gap}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </section>

      {/* AI insights */}
      <section className="relative overflow-hidden rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-signal-durable/10 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <div className="rounded-full bg-foreground/5 p-1.5">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <h2 className="display text-2xl font-semibold tracking-tight">
            Claude AI insights
          </h2>
          <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Auto-generated · mock
          </span>
        </div>
        <ul className="mt-5 space-y-3">
          {data.insights.map((insight, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl border border-hairline bg-paper p-4 text-sm leading-relaxed text-foreground animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="num shrink-0 text-xs font-semibold text-muted-foreground">
                0{i + 1}
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  source,
  label,
  value,
  context,
  tone,
  spark,
}: {
  icon: React.ReactNode;
  source: string;
  label: string;
  value: string;
  context: string;
  tone: "risk" | "durable" | "neutral";
  spark: number[];
}) {
  const valColor =
    tone === "risk"
      ? "text-signal-risk"
      : tone === "durable"
        ? "text-signal-durable"
        : "text-foreground";
  const sparkColor =
    tone === "risk"
      ? "var(--signal-risk)"
      : tone === "durable"
        ? "var(--signal-durable)"
        : "var(--ink-muted)";

  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const range = max - min || 1;
  const w = 110;
  const h = 30;
  const points = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <span className="rounded-md bg-muted p-1.5">{icon}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
            {label}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {source}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={`num display text-4xl font-semibold ${valColor}`}>{value}</div>
        <svg width={w} height={h} className="shrink-0">
          <polyline
            points={points}
            fill="none"
            stroke={sparkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{context}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      <span>Low</span>
      <div
        className="h-2 w-24 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--signal-durable), var(--signal-risk))",
        }}
      />
      <span>High</span>
    </div>
  );
}
