import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { buildProfile } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding · UNMAPPED" }] }),
  component: Onboarding,
});

const STEPS = ["name", "age", "region", "narrative"] as const;
type Step = (typeof STEPS)[number];

const QUESTIONS: Record<Step, { q: string; hint?: string }> = {
  name: { q: "Hello! What should we call you?", hint: "We'll put this on your skills card." },
  age: { q: "Nice to meet you. How old are you?" },
  region: { q: "Where do you live or work?" },
  narrative: {
    q: "Tell us about your work — in your own words.",
    hint: "Tap the mic to speak instead. Voice runs on-device, nothing uploaded.",
  },
};

function Onboarding() {
  const { locale, setProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("name");
  const [data, setData] = useState({
    name: "",
    age: "",
    region: locale.region,
    narrative: "",
  });
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const idx = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;
  const canNext =
    (step === "name" && data.name.trim().length > 1) ||
    (step === "age" && /^\d{1,2}$/.test(data.age)) ||
    (step === "region" && data.region.trim().length > 0) ||
    (step === "narrative" && data.narrative.trim().length > 10);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step, listening]);

  function next() {
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else submit();
  }
  function back() {
    if (idx > 0) setStep(STEPS[idx - 1]);
  }
  function mockMic() {
    setListening(true);
    setTimeout(() => {
      setData((d) => ({ ...d, narrative: locale.heroNarrativeSample }));
      setListening(false);
    }, 1600);
  }
  async function submit() {
    setSubmitting(true);
    const profile = await buildProfile({
      name: data.name.trim(),
      age: data.age ? parseInt(data.age, 10) : null,
      region: data.region.trim(),
      narrative: data.narrative.trim(),
    });
    setProfile(profile);
    setSubmitting(false);
    navigate({ to: "/profile" });
  }

  const userBubbles = STEPS.slice(0, idx).map((s) => ({
    step: s,
    value:
      s === "name"
        ? data.name
        : s === "age"
          ? data.age
          : s === "region"
            ? data.region
            : data.narrative,
  }));

  return (
    <div className="mx-auto max-w-2xl py-2">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Step {idx + 1} of {STEPS.length} · Skills intake
        </p>
        <p className="num text-[10px] text-muted-foreground">{Math.round(progress)}%</p>
      </div>
      <div className="mb-8 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        ref={scrollRef}
        className="max-h-[70vh] space-y-4 overflow-y-auto rounded-3xl border border-hairline bg-card p-4 shadow-card md:p-6"
      >
        {/* AI greeter bubble */}
        <Bubble side="agent">
          <p className="display text-base text-foreground">
            Welcome to <span className="font-semibold">UNMAPPED</span>. I'll ask four
            short questions, then build your portable skills profile.
          </p>
        </Bubble>

        {/* Replay completed steps */}
        {userBubbles.map(({ step: s, value }) => (
          <div key={s} className="space-y-3 animate-fade-up">
            <Bubble side="agent">
              <p className="text-sm text-foreground">{QUESTIONS[s].q}</p>
            </Bubble>
            <Bubble side="user">
              <p className="text-sm">{value}</p>
            </Bubble>
          </div>
        ))}

        {/* Active step */}
        <div className="space-y-3 animate-fade-up">
          <Bubble side="agent">
            <p className="display text-lg text-foreground">{QUESTIONS[step].q}</p>
            {QUESTIONS[step].hint && (
              <p className="mt-1 text-xs text-muted-foreground">{QUESTIONS[step].hint}</p>
            )}
          </Bubble>

          <Bubble side="user" interactive>
            {step === "name" && (
              <input
                autoFocus
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="e.g. Amara"
                className="w-full bg-transparent text-base font-medium outline-none placeholder:text-foreground/40"
              />
            )}
            {step === "age" && (
              <input
                autoFocus
                inputMode="numeric"
                maxLength={2}
                value={data.age}
                onChange={(e) =>
                  setData({ ...data, age: e.target.value.replace(/\D/g, "") })
                }
                placeholder="22"
                className="num w-32 bg-transparent text-2xl font-semibold outline-none placeholder:text-foreground/40"
              />
            )}
            {step === "region" && (
              <input
                autoFocus
                value={data.region}
                onChange={(e) => setData({ ...data, region: e.target.value })}
                className="w-full bg-transparent text-base font-medium outline-none"
              />
            )}
            {step === "narrative" && (
              <div className="relative">
                <textarea
                  autoFocus
                  rows={5}
                  value={data.narrative}
                  onChange={(e) => setData({ ...data, narrative: e.target.value })}
                  placeholder={locale.heroNarrativeSample}
                  className="w-full resize-none bg-transparent pr-12 text-sm leading-relaxed outline-none placeholder:text-foreground/40"
                />
                <button
                  type="button"
                  onClick={mockMic}
                  aria-label="Voice to text"
                  className={
                    "absolute right-0 top-0 rounded-full border p-2 transition-colors " +
                    (listening
                      ? "border-signal-risk bg-signal-risk-soft text-signal-risk"
                      : "border-hairline bg-background text-foreground hover:bg-muted")
                  }
                >
                  <Mic className="h-4 w-4" />
                </button>
                {listening && <Waveform />}
              </div>
            )}
          </Bubble>
        </div>

        {submitting && (
          <Bubble side="agent">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-signal-durable" />
              <span>
                Mapping to ESCO/ISCO-08 · scoring durability · checking{" "}
                {locale.educationTaxonomy}…
              </span>
            </div>
          </Bubble>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          disabled={idx === 0 || submitting}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={next}
          disabled={!canNext || submitting}
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lift transition-all hover:translate-y-[-1px] disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Building profile…
            </>
          ) : idx === STEPS.length - 1 ? (
            <>
              Build my profile <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Continue{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Bubble({
  side,
  interactive,
  children,
}: {
  side: "agent" | "user";
  interactive?: boolean;
  children: React.ReactNode;
}) {
  if (side === "agent") {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold uppercase tracking-wider text-background">
          UM
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-end gap-3">
      <div
        className={
          "max-w-[85%] rounded-2xl rounded-tr-sm border px-4 py-3 " +
          (interactive
            ? "border-foreground bg-background"
            : "border-hairline bg-paper")
        }
      >
        {children}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-background text-xs font-semibold text-foreground">
        🙂
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <div className="mt-3 flex items-center gap-1">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar h-3 w-1 rounded-full bg-signal-risk"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
      <span className="ml-2 text-xs text-signal-risk">Listening… (mocked)</span>
    </div>
  );
}
