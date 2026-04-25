import { Check, Loader2 } from "lucide-react";

export type Phase =
  | { status: "idle" }
  | { status: "extracting" }
  | { status: "querying" }
  | { status: "standardizing" }
  | { status: "finalizing" }
  | { status: "error"; message: string };

const STEPS: Array<{
  key: Phase["status"];
  label: string;
  detail: string;
}> = [
  {
    key: "extracting",
    label: "Extracting Hidden Skills",
    detail: "Gemini 1.5 Pro is reading your work history…",
  },
  {
    key: "querying",
    label: "Querying Live Labor Agent",
    detail: "Tavily is searching real-time hiring, training & wage data…",
  },
  {
    key: "standardizing",
    label: "Standardizing to ISCO-08",
    detail: "Mapping skills to ILO international occupational codes…",
  },
  {
    key: "finalizing",
    label: "Finalizing Bridge Pass",
    detail: "Assembling your portable skills profile…",
  },
];

const ORDER: Phase["status"][] = [
  "extracting",
  "querying",
  "standardizing",
  "finalizing",
];

function stepIndex(status: Phase["status"]): number {
  return ORDER.indexOf(status);
}

export function ProcessingOverlay({ phase }: { phase: Phase }) {
  if (phase.status === "idle") return null;

  const activeIdx = phase.status === "error" ? -1 : stepIndex(phase.status);

  return (
    <div className="animate-fade-up rounded-2xl border border-hairline bg-card p-5 shadow-card">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        AI Processing Pipeline
      </p>

      <ul className="space-y-3">
        {STEPS.map((step, i) => {
          const isDone = activeIdx > i;
          const isActive = activeIdx === i;
          const isPending = activeIdx < i;

          return (
            <li key={step.key} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <Check className="h-4 w-4 text-signal-durable" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <div>
                <p
                  className={
                    "text-sm font-semibold " +
                    (isDone
                      ? "text-muted-foreground line-through"
                      : isActive
                        ? "text-foreground"
                        : "text-muted-foreground/50")
                  }
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="mt-0.5 text-xs text-muted-foreground animate-fade-up">
                    {step.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {phase.status === "error" && (
        <div className="mt-4 rounded-lg border border-signal-risk/40 bg-signal-risk-soft px-4 py-3 text-sm">
          <p className="font-semibold text-signal-risk">Error</p>
          <p className="mt-1 font-mono text-xs text-foreground">{phase.message}</p>
        </div>
      )}
    </div>
  );
}
