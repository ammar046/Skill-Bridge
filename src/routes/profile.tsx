import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Quote } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SignalPill } from "@/components/SignalPill";

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

  return (
    <div className="space-y-6 py-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Portable skills profile</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.age ? `${profile.age} · ` : ""}{profile.region} · Mapped to {locale.educationTaxonomy}
          </p>
        </div>
        <Link
          to="/readiness"
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          AI readiness <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Skills mapped" value={profile.skills.length.toString()} />
        <Stat label="Durable" value={durable.toString()} accent="durable" />
        <Stat label="At risk" value={atRisk.toString()} accent="risk" />
        <Stat label="Avg confidence" value={`${Math.round((profile.skills.reduce((a, s) => a + s.confidence, 0) / profile.skills.length) * 100)}%`} />
      </div>

      <ul className="space-y-3">
        {profile.skills.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">{s.label}</h3>
                  <SignalPill kind={s.classification}>
                    {s.classification === "durable" ? "Durable" : "At risk"}
                  </SignalPill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plain-language label. Formal: <span className="text-foreground">{s.formalName}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="num text-xs text-muted-foreground">ISCO-08 · {s.iscoCode}</div>
                <div className="num mt-0.5 text-xs text-muted-foreground">{s.escoUri}</div>
                <div className="num mt-1 text-xs font-semibold text-foreground">
                  {Math.round(s.confidence * 100)}% conf.
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="italic">"{s.sourceQuote}"</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "durable" | "risk" }) {
  const color = accent === "durable" ? "text-signal-durable" : accent === "risk" ? "text-signal-risk" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`num mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
