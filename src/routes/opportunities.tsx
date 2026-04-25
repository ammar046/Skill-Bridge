import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown, Loader2, ArrowRight, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getOpportunities, searchProviders } from "@/lib/api";
import type { OpportunityMatch, TrainingProvider } from "@/types/api";
import { formatWage } from "@/lib/locales";

export const Route = createFileRoute("/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities · UNMAPPED" }] }),
  component: Opportunities,
});

function Opportunities() {
  const { profile, locale } = useApp();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<TrainingProvider[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!profile) { navigate({ to: "/onboarding" }); return; }
    getOpportunities(profile, locale).then(setMatches);
    searchProviders("", locale).then(setProviders);
  }, [profile, locale, navigate]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    const r = await searchProviders(query, locale);
    setProviders(r);
    setSearching(false);
  }

  if (!profile) return null;

  return (
    <div className="space-y-8 py-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Honest opportunity matching</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Real roles, real wages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calibrated for {locale.country}. Each card surfaces ILO wage floors and sector growth.
          </p>
        </div>
        <Link
          to="/skills-card"
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          Get my skills card <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => {
          const growthPositive = m.sectorGrowthPct >= 0;
          return (
            <li key={m.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{m.title}</h3>
                <span className="num rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold">
                  {m.matchScore}% match
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-foreground" style={{ width: `${m.matchScore}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Signal
                  icon={<Wallet className="h-3.5 w-3.5" />}
                  label="ILO wage floor"
                  value={formatWage(m.iloWageFloor, locale)}
                  positive
                />
                <Signal
                  icon={growthPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  label="Sector growth /yr"
                  value={`${growthPositive ? "+" : ""}${m.sectorGrowthPct.toFixed(1)}%`}
                  positive={growthPositive}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.requiredSkills.map((s) => (
                  <span key={s} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Find local training providers</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Powered by Tavily (mock)</span>
        </div>
        <form onSubmit={runSearch} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`e.g. solar in ${locale.region}`}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        <ul className="mt-4 divide-y divide-border">
          {providers.length === 0 && !searching && (
            <li className="py-4 text-sm text-muted-foreground">No providers match "{query}".</li>
          )}
          {providers.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.city} · {p.format} · {p.durationWeeks} weeks</div>
              </div>
              <a href={p.url} className="text-xs font-semibold text-foreground underline underline-offset-4">
                View →
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Signal({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive?: boolean }) {
  const color = positive ? "text-signal-durable" : "text-signal-risk";
  const bg = positive ? "bg-signal-durable-soft border-signal-durable/30" : "bg-signal-risk-soft border-signal-risk/30";
  return (
    <div className={`flex items-center gap-2 rounded-md border ${bg} px-3 py-2`}>
      <span className={color}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`num text-sm font-semibold ${color}`}>{value}</div>
      </div>
    </div>
  );
}
