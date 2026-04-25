import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { buildProfile } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding · UNMAPPED" }] }),
  component: Onboarding,
});

const STEPS = ["name", "age", "region", "narrative"] as const;
type Step = typeof STEPS[number];

function Onboarding() {
  const { locale, setProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("name");
  const [data, setData] = useState({ name: "", age: "", region: locale.region, narrative: "" });
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const idx = STEPS.indexOf(step);
  const canNext =
    (step === "name" && data.name.trim().length > 1) ||
    (step === "age" && /^\d{1,2}$/.test(data.age)) ||
    (step === "region" && data.region.trim().length > 0) ||
    (step === "narrative" && data.narrative.trim().length > 10);

  function next() {
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else submit();
  }
  function back() { if (idx > 0) setStep(STEPS[idx - 1]); }

  function mockMic() {
    setListening(true);
    setTimeout(() => {
      setData((d) => ({ ...d, narrative: locale.heroNarrativeSample }));
      setListening(false);
    }, 1400);
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

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={
              "h-1.5 flex-1 rounded-full transition-colors " +
              (i <= idx ? "bg-foreground" : "bg-border")
            }
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        {step === "name" && (
          <Field label="Hello! What's your name?" hint="We'll use this on your skills card.">
            <input
              autoFocus
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g. Amara"
              className="w-full border-0 border-b border-border bg-transparent pb-2 text-2xl font-medium outline-none focus:border-foreground"
            />
          </Field>
        )}
        {step === "age" && (
          <Field label={`Nice to meet you, ${data.name || "friend"}. How old are you?`}>
            <input
              autoFocus inputMode="numeric" maxLength={2}
              value={data.age}
              onChange={(e) => setData({ ...data, age: e.target.value.replace(/\D/g, "") })}
              placeholder="22"
              className="num w-32 border-0 border-b border-border bg-transparent pb-2 text-3xl font-semibold outline-none focus:border-foreground"
            />
          </Field>
        )}
        {step === "region" && (
          <Field label="Where do you live or work?" hint={`Most common in ${locale.country}: ${locale.region}.`}>
            <input
              autoFocus
              value={data.region}
              onChange={(e) => setData({ ...data, region: e.target.value })}
              className="w-full border-0 border-b border-border bg-transparent pb-2 text-xl font-medium outline-none focus:border-foreground"
            />
          </Field>
        )}
        {step === "narrative" && (
          <Field
            label="Tell us about your work."
            hint="In your own words. Example: 'I've run a phone repair business since I was 17.' Tap the mic to speak instead."
          >
            <div className="relative">
              <textarea
                autoFocus
                rows={6}
                value={data.narrative}
                onChange={(e) => setData({ ...data, narrative: e.target.value })}
                placeholder={locale.heroNarrativeSample}
                className="w-full resize-none rounded-md border border-border bg-background p-3 pr-12 text-sm leading-relaxed outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={mockMic}
                aria-label="Voice to text"
                className={
                  "absolute right-2 top-2 rounded-full border p-2 transition-colors " +
                  (listening
                    ? "animate-pulse border-signal-risk bg-signal-risk-soft text-signal-risk"
                    : "border-border bg-background text-foreground hover:bg-accent")
                }
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
            {listening && (
              <p className="mt-2 text-xs text-signal-risk">Listening… (mocked voice-to-text)</p>
            )}
          </Field>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={idx === 0 || submitting}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canNext || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
          >
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Building profile…</>) :
              idx === STEPS.length - 1 ? (<>Build my profile <ArrowRight className="h-4 w-4" /></>) :
                (<>Next <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{label}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
