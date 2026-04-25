import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Settings, ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { formatWage } from "@/lib/locales";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, viewMode, profile } = useApp();
  const location = useLocation();
  const onAdmin = location.pathname.startsWith("/admin");

  const userNav = [
    { to: "/", label: "Home" },
    { to: profile ? "/profile" : "/onboarding", label: profile ? "Profile" : "Start" },
    { to: "/readiness", label: "AI lens" },
    { to: "/opportunities", label: "Opportunities" },
    { to: "/skills-card", label: "Skills card" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Editorial masthead */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="display text-xl font-bold tracking-tight text-foreground">
              UN<span className="text-signal-durable">·</span>MAPPED
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              Open infra · v0.1
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {!onAdmin &&
              userNav.map((item) => {
                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                      (active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground")
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            {onAdmin && (
              <Link
                to="/admin"
                className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
              >
                Policymaker dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-hairline bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal-durable" />
              {locale.flag} {locale.country} · {viewMode === "user" ? "User" : "Policy"}
            </span>
            <DevSettings />
          </div>
        </div>

        {/* Live econometric ticker */}
        <Ticker />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>

      <footer className="border-t border-hairline bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground">
          <p>
            <span className="display font-semibold text-foreground">UNMAPPED</span> ·
            Open infrastructure for the informal economy.
          </p>
          <p className="num">
            Sources: ILO · World Bank · UNESCO · Wittgenstein Centre · Frey-Osborne (2017)
          </p>
        </div>
      </footer>
    </div>
  );
}

function Ticker() {
  const { locale } = useApp();
  const items = [
    {
      label: "ILO Wage Floor",
      value: formatWage(locale.sampleWageFloor, locale),
      tone: "durable" as const,
    },
    { label: "Sector Growth · IoT", value: "+6.9% /yr", tone: "durable" as const },
    { label: "Sector Growth · Solar", value: "+5.7% /yr", tone: "durable" as const },
    {
      label: "Youth NEET",
      value: `${locale.policymakerStats.neetRate.toFixed(1)}%`,
      tone: "risk" as const,
    },
    {
      label: "World Bank HCI",
      value: locale.policymakerStats.hciScore.toFixed(2),
      tone: "neutral" as const,
    },
    {
      label: "UNESCO Enrollment",
      value: `${locale.policymakerStats.enrollment.toFixed(1)}%`,
      tone: "neutral" as const,
    },
    { label: "Cashier Roles", value: "−2.4% /yr", tone: "risk" as const },
    { label: "Data Entry", value: "−4.1% /yr", tone: "risk" as const },
  ];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-t border-hairline bg-paper">
      <div className="flex animate-ticker whitespace-nowrap py-1.5">
        {row.map((it, i) => (
          <span
            key={i}
            className="flex items-center gap-2 px-4 text-[11px] uppercase tracking-wider"
          >
            <span className="text-muted-foreground">{it.label}</span>
            <span
              className={
                "num font-semibold " +
                (it.tone === "durable"
                  ? "text-signal-durable"
                  : it.tone === "risk"
                    ? "text-signal-risk"
                    : "text-foreground")
              }
            >
              {it.value}
            </span>
            <span className="text-hairline">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DevSettings() {
  const { countryCode, setCountry, viewMode, setViewMode, resetAll } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Dev settings"
          className="border-hairline"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="display text-2xl">Dev Settings</SheetTitle>
          <SheetDescription>
            Swap localization context and view mode. The entire app re-themes without code
            changes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Country
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ToggleBtn active={countryCode === "GH"} onClick={() => setCountry("GH")}>
                🇬🇭 Ghana · GHS
              </ToggleBtn>
              <ToggleBtn active={countryCode === "PK"} onClick={() => setCountry("PK")}>
                🇵🇰 Pakistan · PKR
              </ToggleBtn>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              View
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ToggleBtn active={viewMode === "user"} onClick={() => setViewMode("user")}>
                User (Amara)
              </ToggleBtn>
              <ToggleBtn active={viewMode === "admin"} onClick={() => setViewMode("admin")}>
                Policymaker
              </ToggleBtn>
            </div>
            {viewMode === "admin" && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4"
              >
                Open dashboard <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Reset
            </h3>
            <Button
              variant="outline"
              className="w-full border-hairline"
              onClick={() => {
                resetAll();
                setOpen(false);
              }}
            >
              Clear profile & restart
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-md border px-3 py-2 text-sm font-medium transition-all " +
        (active
          ? "border-foreground bg-foreground text-background shadow-card"
          : "border-hairline bg-background text-foreground hover:bg-muted")
      }
    >
      {children}
    </button>
  );
}
