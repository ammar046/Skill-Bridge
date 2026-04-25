import { cn } from "@/lib/utils";
import type { SkillClass } from "@/types/api";

export function SignalPill({
  kind,
  children,
  className,
}: {
  kind: SkillClass | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const styles =
    kind === "durable"
      ? "bg-signal-durable-soft text-signal-durable border-signal-durable/30"
      : kind === "at_risk"
        ? "bg-signal-risk-soft text-signal-risk border-signal-risk/30"
        : "bg-muted text-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        styles,
        className,
      )}
    >
      {children}
    </span>
  );
}
