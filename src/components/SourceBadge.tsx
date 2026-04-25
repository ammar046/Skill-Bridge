import { Wifi, Database, AlertCircle } from "lucide-react";
import type { IndicatorValue } from "@/types/api";

interface SourceBadgeProps {
  source: string;
  live?: boolean;
  year?: string | null;
  compact?: boolean;
}

export function SourceBadge({ source, live = false, year, compact = false }: SourceBadgeProps) {
  if (compact) {
    return (
      <span
        title={`Source: ${source}${year ? ` (${year})` : ""}`}
        className={
          "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] " +
          (live
            ? "border-signal-durable/30 bg-signal-durable-soft text-signal-durable"
            : "border-hairline bg-muted text-muted-foreground")
        }
      >
        {live ? <Wifi className="h-2 w-2" /> : <Database className="h-2 w-2" />}
        {live ? "Live" : "Published"}
      </span>
    );
  }

  return (
    <p className="mt-0.5 flex items-center gap-1 text-[9px] leading-snug text-muted-foreground/70">
      {live ? (
        <Wifi className="h-2.5 w-2.5 shrink-0 text-signal-durable" />
      ) : (
        <Database className="h-2.5 w-2.5 shrink-0" />
      )}
      <span>
        Source: {source}
        {year ? ` (${year})` : ""}
      </span>
    </p>
  );
}

interface LiveKpiProps {
  label: string;
  indicator: IndicatorValue;
  format?: (v: number) => string;
  accent?: "durable" | "risk" | "neutral";
  icon?: React.ReactNode;
}

export function LiveKpi({ label, indicator, format, accent = "neutral", icon }: LiveKpiProps) {
  const color =
    accent === "durable"
      ? "text-signal-durable"
      : accent === "risk"
        ? "text-signal-risk"
        : "text-foreground";

  const display =
    indicator.available && indicator.value != null
      ? (format ? format(indicator.value) : indicator.value.toLocaleString())
      : "—";

  return (
    <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        <SourceBadge source={indicator.source} live={indicator.live} year={indicator.year} compact />
      </div>
      {indicator.available ? (
        <p className={`num mt-2 text-2xl font-bold ${color}`}>{display}</p>
      ) : (
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Data unavailable</span>
        </div>
      )}
      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{indicator.label}</p>
      <SourceBadge source={indicator.source} live={indicator.live} year={indicator.year} />
    </div>
  );
}
