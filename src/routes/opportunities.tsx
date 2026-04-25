import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowRight,
  Wallet,
  MapPin,
  Clock,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getOpportunities, searchProviders } from "@/lib/api";
import type { OpportunityMatch, TrainingProvider } from "@/types/api";
import { formatWage } from "@/lib/locales";
import { LiveMarketSignals } from "@/components/LiveMarketSignals";

export const Route = createFileRoute("/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities · UNMAPPED" }] }),
  component: Opportunities,
});

function Opportunities() {
  const { profile, locale } = useApp();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<TrainingProvider[]>([]);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!profile) {
      navigate({ to: "/onboarding" });
      return;
    }
    getOpportunities(profile, locale)
      .then(setMatches)
      .catch((err: unknown) =>
        setMatchError(err instanceof Error ? err.message : String(err)),
      );
    searchProviders("", locale)
      .then(setProviders)
      .catch((err: unknown) =>
        setProviderError(err instanceof Error ? err.message : String(err)),
      );
  }, [profile, locale, navigate]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const r = await searchProviders(query, locale);
      setProviders(r);
      setProviderError(null);
    } catch (err: unknown) {
      setProviderError(err instanceof Error ? err.message : String(err));
    }
    setSearching(false);
  }

  if (!profile) return null;

  const maxWage = Math.max(...matches.map((m) => m.iloWageFloor), 1);

  return (
    <div className="space-y-10 py-2">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8 animate-fade-up">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Honest opportunity matching
          </p>
          <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
            Real roles. Real wages. No spin.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Calibrated for {locale.country}. Every card surfaces the ILO wage floor and
            sector growth — so you can compare on what matters.
          </p>
        </div>
        <Link
          to="/skills-card"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-card transition-all hover:translate-y-[-1px]"
        >
          Get my skills card{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      {matchError && (
        <div className="rounded-lg border border-signal-risk/30 bg-signal-risk-soft px-4 py-3 text-sm text-signal-risk font-mono">
          Opportunities error: {matchError}
        </div>
      )}

      {/* Comparison terminal */}
      <section className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-hairline bg-paper px-5 py-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Top matches · sorted by fit
          </h2>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-signal-durable" /> growing
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-signal-risk" /> shrinking
            </span>
          </div>
        </div>

        <ul className="divide-y divide-hairline">
          {matches.map((m, i) => {
            const positive = m.sectorGrowthPct >= 0;
            const wagePct = (m.iloWageFloor / maxWage) * 100;
            return (
              <li
                key={m.id}
                className="grid grid-cols-12 gap-3 px-5 py-5 transition-colors hover:bg-paper animate-fade-up md:gap-6"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Title + summary */}
                <div className="col-span-12 md:col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="num text-[10px] font-semibold text-muted-foreground">
                      0{i + 1}
                    </span>
                    <h3 className="display text-lg font-semibold leading-tight tracking-tight text-foreground">
                      {m.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {m.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-hairline bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Match score */}
                <div className="col-span-4 md:col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Match
                  </div>
                  <div className="num mt-1 text-2xl font-semibold text-foreground">
                    {m.matchScore}%
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-700"
                      style={{ width: `${m.matchScore}%` }}
                    />
                  </div>
                </div>

                {/* Wage */}
                <div className="col-span-8 md:col-span-3">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Wallet className="h-3 w-3" /> ILO wage floor
                  </div>
                  <div className="num mt-1 text-2xl font-semibold text-signal-durable">
                    {formatWage(m.iloWageFloor, locale)}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-signal-durable transition-all duration-700"
                      style={{ width: `${wagePct}%` }}
                    />
                  </div>
                </div>

                {/* Growth */}
                <div className="col-span-12 md:col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sector /yr
                  </div>
                  <div
                    className={
                      "num mt-1 flex items-center gap-1 text-2xl font-semibold " +
                      (positive ? "text-signal-durable" : "text-signal-risk")
                    }
                  >
                    {positive ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {positive ? "+" : ""}
                    {m.sectorGrowthPct.toFixed(1)}%
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Live market intelligence — parallel agentic Tavily search */}
      {profile.skills[0] && (
        <LiveMarketSignals
          skill={profile.skills[0].label}
          location={profile.region}
        />
      )}

      {/* Provider search */}
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-2xl font-semibold tracking-tight">
            Local training providers
          </h2>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal-durable" />
            Powered by Tavily · live search
          </span>
        </div>
        <form onSubmit={runSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`e.g. solar in ${locale.region}, mobile repair, IoT…`}
              className="w-full rounded-full border border-hairline bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-foreground"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" /> Search
              </>
            )}
          </button>
        </form>

        <ul className="mt-5 divide-y divide-hairline">
          {providerError && (
            <li className="py-4 text-sm font-mono text-signal-risk">
              Provider search error: {providerError}
            </li>
          )}
          {!providerError && providers.length === 0 && !searching && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No providers match "{query}".
            </li>
          )}
          {providers.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium text-foreground">{p.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.city}
                  </span>
                  <span>{p.format}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {p.durationWeeks} weeks
                  </span>
                </div>
              </div>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  View <ArrowRight className="h-3 w-3" />
                </a>
              ) : (
                <span className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs text-muted-foreground/50">
                  No link
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
