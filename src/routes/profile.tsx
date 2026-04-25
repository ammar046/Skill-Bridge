import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Quote, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SignalPill } from "@/components/SignalPill";
import type { Skill } from "@/types/api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Skills Profile · UNMAPPED" }] }),
  component: Profile,
});

function Profile() {
  const { profile, locale } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  if (!profile) return null;

  const durable = profile.skills.filter((s) => s.classification === "durable").length;
  const atRisk = profile.skills.filter((s) => s.classification === "at_risk").length;
  const avgConf = Math.round(
    (profile.skills.reduce((a, s) => a + s.confidence, 0) / profile.skills.length) * 100,
  );

  return (
    <div className="space-y-10 py-2">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
        <div className="animate-fade-up">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Portable skills profile · ESCO-aligned
          </p>
          <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.age ? `${profile.age} · ` : ""}
            {profile.region} · Mapped to {locale.educationTaxonomy}
          </p>
        </div>
        <Link
          to="/readiness"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-card transition-all hover:translate-y-[-1px]"
        >
          AI readiness lens{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Skills mapped" value={profile.skills.length.toString()} />
        <Stat label="Durable" value={durable.toString()} accent="durable" />
        <Stat label="At risk" value={atRisk.toString()} accent="risk" />
        <Stat label="Avg confidence" value={`${avgConf}%`} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-2xl font-semibold tracking-tight">
            Validated skills
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

      {/* Raw narrative provenance */}
      <section className="rounded-2xl border border-hairline bg-paper p-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Source narrative
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
              {isDurable ? "Durable" : "At risk"}
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

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
          ISCO-08 · {s.iscoCode}
        </span>
        <span className="num truncate text-[10px] text-muted-foreground">
          {s.escoUri}
        </span>
      </div>
    </li>
  );
}

function ConfidenceRing({
  value,
  kind,
}: {
  value: number;
  kind: "durable" | "at_risk";
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
