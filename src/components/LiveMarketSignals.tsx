import { useEffect, useState } from "react";
import { ExternalLink, TrendingUp, GraduationCap, Wallet, AlertCircle } from "lucide-react";
import { getMarketSignals } from "@/lib/api";
import type { MarketSignal, MarketSignalsResponse } from "@/types/api";

interface Props {
  skill: string;
  location: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "done"; data: MarketSignalsResponse }
  | { status: "error"; message: string };

const CATEGORIES: Array<{
  key: keyof Pick<MarketSignalsResponse, "hiring" | "training" | "wages">;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: "hiring", label: "Hiring Demand", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { key: "training", label: "Training Hubs", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { key: "wages", label: "Economic Context", icon: <Wallet className="h-3.5 w-3.5" /> },
];

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-signal-durable/30 bg-signal-durable-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-signal-durable">
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal-durable" />
      Live
    </span>
  );
}

function SignalCard({ signal }: { signal: MarketSignal }) {
  return (
    <div className="rounded-lg border border-hairline bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{signal.title}</p>
        {signal.url && signal.url !== "#" && (
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {signal.snippet && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {signal.snippet}
        </p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-hairline bg-background p-3 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-3 w-full rounded bg-muted" />
      <div className="mt-1 h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export function LiveMarketSignals({ skill, location }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    getMarketSignals(skill, location)
      .then((data) => setState({ status: "done", data }))
      .catch((err: unknown) =>
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        }),
      );
  }, [skill, location]);

  return (
    <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <h2 className="display text-2xl font-semibold tracking-tight">
            Live Market Intelligence
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Real-time data for <span className="font-semibold text-foreground">{skill}</span> in{" "}
            <span className="font-semibold text-foreground">{location}</span>
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {state.status === "error" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-signal-risk/30 bg-signal-risk-soft p-3 text-sm text-signal-risk">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-mono text-xs">{state.message}</span>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {CATEGORIES.map(({ key, label, icon }) => (
          <div key={key}>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {icon}
              {label}
            </div>
            <div className="space-y-2">
              {state.status === "loading" ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : state.status === "done" && state.data[key].length > 0 ? (
                state.data[key].map((signal, i) => (
                  <SignalCard key={i} signal={signal} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No results found for this query.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
