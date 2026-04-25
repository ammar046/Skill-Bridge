import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wifi, ShieldCheck, BarChart3, Quote } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNMAPPED — Make informal skills economically legible" },
      {
        name: "description",
        content:
          "A portable, ESCO-aligned skills profile for the informal economy. Built for 2G connections and shared phones.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { locale, profile, uiLocale } = useApp();
  return (
    <div className="space-y-16 py-2 md:space-y-24">
      {/* HERO — editorial broadsheet */}
      <section className="grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7 animate-fade-up">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-8 bg-foreground" />
            {t("home.hero_eyebrow", uiLocale)} · {locale.country}
          </div>

          <h1 className="display mt-5 text-[44px] font-semibold leading-[0.95] tracking-tight text-foreground text-balance md:text-[76px]">
            {t("home.hero_title_1", uiLocale)}{" "}
            <em className="not-italic relative">
              {t("home.hero_title_em", uiLocale)}
              <svg
                viewBox="0 0 200 14"
                className="absolute -bottom-1 left-0 h-2 w-full text-signal-durable"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9 Q 50 2, 100 7 T 198 5"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  className="animate-draw"
                />
              </svg>
            </em>{" "}
            {t("home.hero_title_2", uiLocale)}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            {t("home.hero_sub", uiLocale)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={profile ? "/profile" : "/onboarding"}
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lift transition-all hover:translate-y-[-1px]"
            >
              {profile ? t("home.open_profile_btn", uiLocale) : t("home.start_btn", uiLocale)}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("home.policymaker_btn", uiLocale)}
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline">
            <Metric n="1.6B" label={t("home.metric_workers", uiLocale)} />
            <Metric n="71%" label={t("home.metric_africa", uiLocale)} />
            <Metric n="0" label={t("home.metric_ids", uiLocale)} tone="risk" />
          </div>
        </div>

        {/* Live signals card */}
        <aside className="md:col-span-5 animate-fade-up [animation-delay:120ms]">
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card p-6 shadow-card">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-holo opacity-70" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal-durable" />
                {t("home.live_signals", uiLocale)}
              </div>
              <span className="num text-[10px] font-medium text-muted-foreground">
                {locale.currency}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <SignalRow
                label={`ILO wage floor · ${locale.wageFloorSource.split("·")[0].trim()}`}
                value={`${locale.currencySymbol} ${locale.sampleWageFloor.toLocaleString()}`}
                unit="/mo"
                delta="+3.4%"
                positive
                spark={[12, 14, 13, 16, 18, 17, 20, 22, 21, 24]}
              />
              <SignalRow
                label="Youth NEET rate · ILO 2024"
                value={`${locale.policymakerStats.neetRate.toFixed(1)}`}
                unit="%"
                delta="critical"
                spark={[20, 22, 21, 24, 25, 26, 27, 28, 28, 28.4]}
              />
              <SignalRow
                label="World Bank HCI · 0–1"
                value={locale.policymakerStats.hciScore.toFixed(2)}
                unit=""
                delta="stable"
                spark={[0.4, 0.41, 0.42, 0.42, 0.43, 0.44, 0.44, 0.45, 0.45, 0.45]}
              />
              <SignalRow
                label="UNESCO secondary enrollment"
                value={`${locale.policymakerStats.enrollment.toFixed(1)}`}
                unit="%"
                delta="+1.1%"
                positive
                spark={[60, 62, 64, 66, 67, 68, 70, 71, 72, locale.policymakerStats.enrollment]}
              />
            </div>

            <p className="mt-5 border-t border-hairline pt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Sources are mocked for the demo · contracts mirror future FastAPI shapes
            </p>
          </div>
        </aside>
      </section>

      {/* Quote */}
      <section className="border-y border-hairline bg-paper py-12">
        <div className="mx-auto max-w-3xl px-2 text-center">
          <Quote className="mx-auto h-6 w-6 text-signal-durable" />
          <blockquote className="display mt-4 text-2xl font-medium leading-snug tracking-tight text-foreground text-balance md:text-3xl">
            "{t("home.quote_text", uiLocale)}"
          </blockquote>
          <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.quote_attr", uiLocale)}
          </figcaption>
        </div>
      </section>

      {/* Pillars */}
      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard n="01" icon={<Wifi className="h-4 w-4" />} title={t("home.pillar1_title", uiLocale)}>
          {t("home.pillar1_body", uiLocale)}
        </FeatureCard>
        <FeatureCard n="02" icon={<ShieldCheck className="h-4 w-4" />} title={t("home.pillar2_title", uiLocale)}>
          {t("home.pillar2_body", uiLocale)}
        </FeatureCard>
        <FeatureCard n="03" icon={<BarChart3 className="h-4 w-4" />} title={t("home.pillar3_title", uiLocale)}>
          {t("home.pillar3_body", uiLocale)}
        </FeatureCard>
      </section>

      {/* CTA strip */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-foreground px-6 py-12 text-background md:px-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-grid-paper opacity-[0.06]" />
        <div className="relative grid gap-6 md:grid-cols-[1.5fr,1fr] md:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-background/60">
              {t("home.cta_sub", uiLocale)}
            </p>
            <h2 className="display mt-3 text-3xl font-semibold leading-tight tracking-tight text-balance md:text-5xl">
              {t("home.cta_title", uiLocale)}
            </h2>
          </div>
          <Link
            to={profile ? "/profile" : "/onboarding"}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:translate-y-[-1px]"
          >
            {profile ? t("home.open_profile_btn", uiLocale) : t("home.begin_btn", uiLocale)}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ n, label, tone }: { n: string; label: string; tone?: "risk" }) {
  return (
    <div className="bg-background px-4 py-4">
      <div
        className={
          "num text-2xl font-semibold " +
          (tone === "risk" ? "text-signal-risk" : "text-foreground")
        }
      >
        {n}
      </div>
      <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

function SignalRow({
  label,
  value,
  unit,
  delta,
  positive,
  spark,
}: {
  label: string;
  value: string;
  unit: string;
  delta: string;
  positive?: boolean;
  spark: number[];
}) {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const range = max - min || 1;
  const w = 80;
  const h = 22;
  const points = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = positive ? "var(--signal-durable)" : "var(--ink-muted)";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="num text-lg font-semibold text-foreground">{value}</span>
          <span className="num text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <svg width={w} height={h} className="shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={
          "num w-16 text-right text-xs font-semibold " +
          (positive ? "text-signal-durable" : "text-muted-foreground")
        }
      >
        {delta}
      </span>
    </div>
  );
}

function FeatureCard({
  n,
  icon,
  title,
  children,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="group relative rounded-2xl border border-hairline bg-card p-6 transition-all hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className="num text-[10px] font-medium text-muted-foreground">{n}</span>
        <span className="rounded-md bg-muted p-1.5 text-foreground">{icon}</span>
      </div>
      <h3 className="display mt-6 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </article>
  );
}
