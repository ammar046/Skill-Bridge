import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Settings, Compass } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, viewMode } = useApp();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Compass className="h-4 w-4" />
            <span>UNMAPPED</span>
            <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              v0.1
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {locale.flag} {locale.country} · {locale.currency} ·{" "}
              <span className="font-medium text-foreground">{viewMode === "user" ? "User" : "Policymaker"}</span>
            </span>
            <DevSettings />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground">
        Open infrastructure for the informal economy · Built for low-bandwidth contexts.
      </footer>
    </div>
  );
}

function DevSettings() {
  const { countryCode, setCountry, viewMode, setViewMode, resetAll } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Dev settings">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Dev Settings</SheetTitle>
          <SheetDescription>
            Swap localization context and view mode. The entire app re-themes without code changes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                className="mt-2 inline-block text-xs font-medium text-foreground underline underline-offset-4"
              >
                Open dashboard →
              </Link>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reset
            </h3>
            <Button
              variant="outline"
              className="w-full"
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
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:bg-accent")
      }
    >
      {children}
    </button>
  );
}
