import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { buildProfile } from "@/lib/api";
import { NarrativeInput } from "@/components/NarrativeInput";
import { ProcessingOverlay, type Phase } from "@/components/ProcessingOverlay";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding · UNMAPPED" }] }),
  component: Onboarding,
});

const STEPS = ["name", "age", "gender", "region", "narrative"] as const;
type Step = (typeof STEPS)[number];

function Onboarding() {
  const { locale, setProfile, uiLocale, setGender: setGlobalGender } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("name");
  const [data, setData] = useState({
    name: "",
    age: "",
    gender: "" as "female" | "male" | "other" | "",
    region: locale.region,
    narrative: "",
  });
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const idx = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;
  const isProcessing =
    phase.status !== "idle" && phase.status !== "error";

  const canNext =
    (step === "name" && data.name.trim().length > 1) ||
    (step === "age" && /^\d{1,2}$/.test(data.age)) ||
    step === "gender" ||  // always skippable
    (step === "region" && data.region.trim().length > 0) ||
    (step === "narrative" && data.narrative.trim().length > 10);

  function scrollBottom() {
    setTimeout(
      () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      60,
    );
  }

  function next() {
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
      scrollBottom();
    } else {
      void submit();
    }
  }

  function back() {
    if (phase.status === "error") {
      setPhase({ status: "idle" });
      return;
    }
    if (idx > 0) {
      setStep(STEPS[idx - 1]);
    } else {
      navigate({ to: "/" });
    }
  }

  async function submit() {
    setPhase({ status: "extracting" });
    scrollBottom();

    try {
      const gender = data.gender || null;
      if (gender) setGlobalGender(gender);

      const profile = await buildProfile(
        {
          name: data.name.trim(),
          age: data.age ? parseInt(data.age, 10) : null,
          gender: gender as "female" | "male" | "other" | null,
          region: data.region.trim(),
          narrative: data.narrative.trim(),
        },
        locale,
      );

      setPhase({ status: "querying" });

      if (profile.skills.length === 0) {
        throw new Error(
          "No skills could be extracted. Please add more detail to your narrative.",
        );
      }

      setPhase({ status: "standardizing" });
      // Brief yield so the UI can paint the step
      await new Promise((r) => setTimeout(r, 400));

      setPhase({ status: "finalizing" });
      setProfile(profile);
      // Save narrative for offline recovery
      localStorage.setItem("unmapped.savedNarrative", data.narrative);
      await new Promise((r) => setTimeout(r, 300));

      navigate({ to: "/profile" });
    } catch (err) {
      // Persist narrative so user doesn't lose their work
      localStorage.setItem("unmapped.savedNarrative", data.narrative);
      setPhase({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
      scrollBottom();
    }
  }

  const STEP_QUESTIONS: Record<Step, { q: string; hint?: string }> = {
    name: { q: t("onboarding.tell_us_your_name", uiLocale), hint: t("onboarding.name_hint", uiLocale) },
    age: { q: t("onboarding.how_old_are_you", uiLocale) },
    gender: { q: t("onboarding.your_gender", uiLocale), hint: t("onboarding.gender_hint", uiLocale) },
    region: { q: t("onboarding.which_city", uiLocale) },
    narrative: {
      q: t("onboarding.describe_your_work", uiLocale),
      hint: t("onboarding.narrative_hint", uiLocale),
    },
  };

  const userBubbles = STEPS.slice(0, idx).map((s) => ({
    step: s,
    value:
      s === "name"
        ? data.name
        : s === "age"
          ? data.age
          : s === "gender"
            ? data.gender
              ? { female: t("common.woman", uiLocale), male: t("common.man", uiLocale), other: t("common.non_binary", uiLocale) }[data.gender]
              : `(${t("onboarding.skip", uiLocale)})`
            : s === "region"
              ? data.region
              : data.narrative,
  }));

  return (
    <div className="mx-auto max-w-2xl py-2">
      <div className="mb-6 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t("onboarding.step_label", uiLocale)} {idx + 1} / {STEPS.length} · {t("onboarding.skills_intake", uiLocale)}
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
        <Bubble side="agent">
          <p className="display text-base text-foreground">
            {t("onboarding.welcome", uiLocale)}
          </p>
        </Bubble>

        {userBubbles.map(({ step: s, value }) => (
          <div key={s} className="space-y-3 animate-fade-up">
            <Bubble side="agent">
              <p className="text-sm text-foreground">{STEP_QUESTIONS[s].q}</p>
            </Bubble>
            <Bubble side="user">
              <p className="text-sm">{value}</p>
            </Bubble>
          </div>
        ))}

        {/* Active input step — hide while processing */}
        {phase.status === "idle" && (
          <div className="space-y-3 animate-fade-up">
            <Bubble side="agent">
              <p className="display text-lg text-foreground">{STEP_QUESTIONS[step].q}</p>
              {STEP_QUESTIONS[step].hint && (
                <p className="mt-1 text-xs text-muted-foreground">{STEP_QUESTIONS[step].hint}</p>
              )}
            </Bubble>

            <Bubble side="user" interactive>
              {step === "name" && (
                <input
                  autoFocus
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && canNext && next()}
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
                  onChange={(e) => setData({ ...data, age: e.target.value.replace(/\D/g, "") })}
                  onKeyDown={(e) => e.key === "Enter" && canNext && next()}
                  placeholder="22"
                  className="num w-32 bg-transparent text-2xl font-semibold outline-none placeholder:text-foreground/40"
                />
              )}
              {step === "gender" && (
                <div className="flex flex-wrap gap-2">
                  {(["female", "male", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setData({ ...data, gender: g })}
                      className={
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all " +
                        (data.gender === g
                          ? "border-foreground bg-foreground text-background"
                          : "border-hairline bg-background text-foreground hover:bg-muted")
                      }
                    >
                      {{ female: t("common.woman", uiLocale), male: t("common.man", uiLocale), other: t("common.non_binary", uiLocale) }[g]}
                    </button>
                  ))}
                </div>
              )}
              {step === "region" && (
                <input
                  autoFocus
                  value={data.region}
                  onChange={(e) => setData({ ...data, region: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && canNext && next()}
                  className="w-full bg-transparent text-base font-medium outline-none"
                />
              )}
              {step === "narrative" && (
                <NarrativeInput
                  value={data.narrative}
                  onChange={(text) => setData({ ...data, narrative: text })}
                  placeholder={locale.heroNarrativeSample}
                  locale={locale}
                />
              )}
            </Bubble>
          </div>
        )}

        {/* Processing / error overlay */}
        {phase.status !== "idle" && <ProcessingOverlay phase={phase} />}

        {/* Retry hint after error */}
        {phase.status === "error" && (
          <Bubble side="agent">
            <p className="text-sm text-foreground">
              {t("onboarding.error_retry", uiLocale)}
            </p>
          </Bubble>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          {phase.status === "error" ? t("onboarding.back", uiLocale) : t("onboarding.back", uiLocale)}
        </button>

        <div className="flex items-center gap-2">
          {step === "gender" && (
            <button
              onClick={next}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t("onboarding.skip", uiLocale)}
            </button>
          )}
          <button
            onClick={next}
            disabled={(!canNext && phase.status === "idle") || isProcessing}
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lift transition-all hover:translate-y-[-1px] disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-background" />
                {t("common.processing", uiLocale)}
              </span>
            ) : idx === STEPS.length - 1 ? (
              <>
                {t("onboarding.build_profile", uiLocale)} <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                {t("onboarding.next", uiLocale)}{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
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
          SB
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
          (interactive ? "border-foreground bg-background" : "border-hairline bg-paper")
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
