import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Quote, Sparkles, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getPolicymakerStats } from "@/lib/api";
import { SignalPill } from "@/components/SignalPill";
import { SkillBadge } from "@/components/SkillBadge";
import { t } from "@/lib/i18n";
import type { PolicymakerLiveStats, Skill } from "@/types/api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Skills Profile · UNMAPPED" }] }),
  component: Profile,
});

function Profile() {
  const { profile, locale, uiLocale, gender: ctxGender } = useApp();
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState<PolicymakerLiveStats | null>(null);

  useEffect(() => {
    if (!profile) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  useEffect(() => {
    getPolicymakerStats(locale)
      .then(setLiveStats)
      .catch(() => {/* fall back to static locale values */});
  }, [locale.code]);

  if (!profile) return null;

  const durable = profile.skills.filter((s) => s.classification === "durable").length;
  const atRisk = profile.skills.filter((s) => s.classification === "at_risk").length;
  const avgConf = Math.round(
    (profile.skills.reduce((a, s) => a + s.confidence, 0) / profile.skills.length) * 100,
  );

  const isFemale = (profile.gender ?? ctxGender) === "female";
  // Use live gender wage gap from backend if available, fall back to static locale
  const gapPct = liveStats
    ? Math.round((liveStats.gender_wage_gap.value ?? locale.genderWageGap) * (liveStats.gender_wage_gap.value != null ? 1 : 100))
    : Math.round(locale.genderWageGap * 100);
  const gapSource = liveStats?.gender_wage_gap.source ?? locale.genderWageGapSource;
  const witt = locale.wittgensteinProjections;
  // Use live Wittgenstein narrative from backend if available
  const wittNarrative = liveStats?.wittgenstein_note ?? witt.narrative;
  const wittSource = liveStats?.wittgenstein_source ?? witt.source;

  const wittPoints = [
    { year: "2025", value: witt.secondary_enrollment_2025 },
    { year: "2030", value: witt.secondary_enrollment_2030 },
    { year: "2035", value: witt.secondary_enrollment_2035 },
  ];
  const wittMax = Math.max(...wittPoints.map((p) => p.value), 100);

  return (
    <div className="space-y-10 py-2">

      {/* Global disclaimer banner */}
      <div
        className="rounded-lg border-l-2 border-muted-foreground/30 bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground"
        role="note"
      >
        <span className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          <span>{t("profile.disclaimer", uiLocale)}</span>
        </span>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
        <div className="animate-fade-up">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("profile.page_label", uiLocale)}
          </p>
          <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.age ? `${profile.age} · ` : ""}
            {profile.region} · {t("profile.mapped_to", uiLocale)} {locale.educationTaxonomy}
          </p>
        </div>
        <Link
          to="/readiness"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-card transition-all hover:translate-y-[-1px]"
        >
          {t("profile.ai_lens_btn", uiLocale)}{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      {/* Gender wage callout */}
      {isFemale && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold text-amber-900">
            {uiLocale === "ur" ? "جنس کے مطابق اجرت کا حساب لگایا گیا" : "Gender wage adjustment applied"}
          </p>
          <p className="mt-1 text-[13px]">
            {uiLocale === "ur"
              ? `${locale.country} میں خواتین اوسطاً ${gapPct}% کم کماتی ہیں۔ یہ ILO کے اعداد کے مطابق ہے۔`
              : `Wage floor shown is ILO-adjusted for gender. Women in ${locale.country} earn approximately `}
            {uiLocale !== "ur" && <><strong>{gapPct}% less</strong> than the regional average.</>}{" "}
            <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Source: {gapSource}
            </span>
          </p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("profile.skills_mapped", uiLocale)} value={profile.skills.length.toString()} />
        <Stat label={t("profile.durable", uiLocale)} value={durable.toString()} accent="durable" />
        <Stat label={t("profile.at_risk", uiLocale)} value={atRisk.toString()} accent="risk" />
        <Stat label={t("profile.avg_confidence", uiLocale)} value={`${avgConf}%`} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-2xl font-semibold tracking-tight">
            {t("profile.validated_skills", uiLocale)}
          </h2>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Signal Engine v0.1
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {profile.skills.map((s, i) => (
            <SkillCard key={s.id} skill={s} index={i} />
          ))}
        </ul>
      </section>

      {/* Wittgenstein projections — "Your region's future" */}
      <section className="rounded-2xl border border-hairline bg-paper p-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t("profile.region_future", uiLocale)}
        </h2>
        <p className="display mt-2 text-xl font-semibold tracking-tight text-foreground">
          {t("profile.enrollment_proj", uiLocale)}
        </p>

        {/* Inline enrollment bar chart */}
        <div className="mt-4 flex items-end gap-4">
          {wittPoints.map((p) => {
            const heightPct = Math.round((p.value / wittMax) * 100);
            return (
              <div key={p.year} className="flex flex-1 flex-col items-center gap-1">
                <span className="num text-sm font-semibold text-foreground">{p.value}%</span>
                <div className="w-full overflow-hidden rounded-t-md bg-muted" style={{ height: "72px" }}>
                  <div
                    className="ml-auto mr-auto w-full rounded-t-md bg-foreground/70 transition-all duration-700"
                    style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                  />
                </div>
                <span className="num text-[10px] text-muted-foreground">{p.year}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground">{wittNarrative}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded border border-hairline bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Source: {wittSource}
          </span>
          <p className="text-[13px] text-muted-foreground">
            {t("profile.witt_implication", uiLocale)}
          </p>
        </div>
      </section>

      {/* Raw narrative provenance */}
      <section className="rounded-2xl border border-hairline bg-paper p-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t("profile.source_narrative", uiLocale)}
        </h2>
        <p className="display mt-3 text-lg leading-relaxed text-foreground text-pretty">
          "{profile.rawNarrative}"
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "durable" | "risk";
}) {
  const color =
    accent === "durable"
      ? "text-signal-durable"
      : accent === "risk"
        ? "text-signal-risk"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className={`num mt-2 text-3xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function SkillCard({ skill: s, index }: { skill: Skill; index: number }) {
  const { uiLocale } = useApp();
  const isDurable = s.classification === "durable";
  return (
    <li
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-card p-5 shadow-card transition-all hover:shadow-lift animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top accent stripe */}
      <div
        className={
          "absolute inset-x-0 top-0 h-1 " +
          (isDurable ? "bg-signal-durable" : "bg-signal-risk")
        }
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="display text-xl font-semibold leading-tight text-foreground">
              {s.label}
            </h3>
            <SignalPill kind={s.classification}>
              {isDurable ? t("profile.durable", uiLocale) : t("profile.at_risk", uiLocale)}
            </SignalPill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ESCO formal: <span className="text-foreground">{s.formalName}</span>
          </p>
        </div>
        <ConfidenceRing value={s.confidence} kind={s.classification} />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-hairline bg-paper p-3 text-xs leading-relaxed text-muted-foreground">
        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
        <span className="italic">"{s.sourceQuote}"</span>
      </div>

      {/* Explainability badge — click for ILO/Frey-Osborne breakdown */}
      <div className="mt-3">
        <SkillBadge skill={s} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
          ISCO-08 · {s.iscoCode}
        </span>
        {s.iloTaskType && (
          <span className="text-[10px] text-muted-foreground capitalize">
            {s.iloTaskType.replace(/_/g, " ")}
          </span>
        )}
      </div>
    </li>
  );
}

function ConfidenceRing({
  value,
  kind,
}: {
  value: number;
  kind: "durable" | "at_risk" | "transitioning";
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = value * c;
  const color =
    kind === "durable" ? "var(--signal-durable)" : "var(--signal-risk)";
  return (
    <div className="relative shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--grid)"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeDashoffset={c / 4}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="num text-xs font-semibold text-foreground">
          {Math.round(value * 100)}
        </span>
      </div>
    </div>
  );
}
