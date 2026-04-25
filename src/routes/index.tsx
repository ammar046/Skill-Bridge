import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wifi, ShieldCheck, BarChart3 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNMAPPED — Map your informal skills to real opportunity" },
      { name: "description", content: "A portable skills profile for the informal economy. Built for 2G connections and shared phones." },
    ],
  }),
  component: Index,
});

function Index() {
  const { locale, profile } = useApp();
  return (
    <div className="space-y-12 py-6">
      <section className="grid gap-8 md:grid-cols-[1.4fr,1fr] md:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-durable" />
            Open infra · {locale.flag} {locale.country}
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Make informal skills <span className="underline decoration-signal-durable decoration-4 underline-offset-4">economically legible</span>.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            UNMAPPED turns lived work history into a portable, ESCO-aligned skills profile —
            with honest opportunity matching and AI-readiness signals calibrated for {locale.country}.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={profile ? "/profile" : "/onboarding"}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              {profile ? "Open my profile" : "Start mapping"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Policymaker view
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">Live econometric signals</span>
            <span className="num">{locale.currency}</span>
          </div>
          <div className="mt-4 space-y-4">
            <Stat label="ILO wage floor (electronics tech)" value={`${locale.currencySymbol} ${locale.sampleWageFloor.toLocaleString()}/mo`} delta="+3.4%" positive />
            <Stat label="Youth NEET rate" value={`${locale.policymakerStats.neetRate.toFixed(1)}%`} delta="ILO 2024" />
            <Stat label="World Bank HCI" value={locale.policymakerStats.hciScore.toFixed(2)} delta="0–1 scale" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard icon={<Wifi className="h-4 w-4" />} title="Built for 2G">
          System fonts, no hero images, offline-first PWA logic. Works on a shared phone in Madina market or Anarkali bazaar.
        </FeatureCard>
        <FeatureCard icon={<ShieldCheck className="h-4 w-4" />} title="Honest matching">
          Every opportunity surfaces ILO wage floors and sector growth — no inflated promises.
        </FeatureCard>
        <FeatureCard icon={<BarChart3 className="h-4 w-4" />} title="Policy-grade data">
          Aggregate skill-gap heatmaps powered by ILO, World Bank, UNESCO, and Wittgenstein projections.
        </FeatureCard>
      </section>
    </div>
  );
}

function Stat({ label, value, delta, positive }: { label: string; value: string; delta: string; positive?: boolean }) {
  return (
    <div className="flex items-end justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="num mt-1 text-lg font-semibold text-foreground">{value}</div>
      </div>
      <span className={"num text-xs font-semibold " + (positive ? "text-signal-durable" : "text-muted-foreground")}>
        {delta}
      </span>
    </div>
  );
}

function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-foreground">
        <span className="rounded-md bg-muted p-1.5">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
