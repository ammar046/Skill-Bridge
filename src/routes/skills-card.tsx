import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, QrCode, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { useApp } from "@/context/AppContext";
import { SignalPill } from "@/components/SignalPill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/skills-card")({
  head: () => ({ meta: [{ title: "Skills Card · UNMAPPED" }] }),
  component: SkillsCard,
});

function SkillsCard() {
  const { profile, locale } = useApp();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (!profile) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  async function openQr() {
    if (!profile) return;
    const payload = JSON.stringify({
      v: 1,
      name: profile.name,
      region: profile.region,
      country: locale.code,
      skills: profile.skills.map((s) => ({
        l: s.label,
        c: s.iscoCode,
        k: s.classification,
      })),
    });
    const url = await QRCode.toDataURL(payload, { margin: 1, width: 240 });
    setQrUrl(url);
    setQrOpen(true);
  }

  function downloadPdf() {
    if (!profile) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("UNMAPPED — Skills Card", 40, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `Issued ${new Date().toLocaleDateString()} · ${locale.country} (${locale.code})`,
      40,
      78,
    );

    doc.setTextColor(20);
    doc.setFontSize(16);
    doc.text(profile.name, 40, 120);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${profile.age ?? "—"} · ${profile.region}`, 40, 138);

    doc.setDrawColor(220);
    doc.line(40, 158, 555, 158);

    doc.setTextColor(20);
    doc.setFontSize(13);
    doc.text("Validated skills", 40, 184);

    let y = 210;
    profile.skills.forEach((s) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`• ${s.label}`, 40, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `${s.formalName} · ISCO-08 ${s.iscoCode} · ${s.classification.toUpperCase()} · ${Math.round(s.confidence * 100)}%`,
        56,
        y + 14,
      );
      doc.setTextColor(20);
      y += 36;
    });

    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      "Open infrastructure for the informal economy · unmapped.dev",
      40,
      800,
    );
    doc.save(
      `unmapped-skills-${profile.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
    );
  }

  function sendSms(e: React.FormEvent) {
    e.preventDefault();
    setSmsSent(true);
    setTimeout(() => {
      setSmsOpen(false);
      setSmsSent(false);
    }, 1800);
  }

  if (!profile) return null;

  const smsBody =
    `UNMAPPED: ${profile.name} — ${profile.region}. Skills: ` +
    profile.skills.map((s) => s.label).join(", ") +
    `. Card: unmapped.app/c/${profile.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-2">
      <header className="border-b border-hairline pb-8 animate-fade-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Exportable skills card
        </p>
        <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
          Carry your work with you.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A digital ID for the informal economy. Share via PDF, QR, or SMS — works
          even on a feature phone.
        </p>
      </header>

      {/* The card — physical ID aesthetic */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl border border-hairline bg-card shadow-lift animate-fade-up [animation-delay:80ms]"
      >
        {/* Holographic top stripe */}
        <div className="relative h-2 bg-holo">
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        {/* Guilloché security pattern */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
          viewBox="0 0 600 400"
          aria-hidden
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <ellipse
              key={i}
              cx="300"
              cy="200"
              rx={290 - i * 8}
              ry={180 - i * 5}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          ))}
        </svg>

        <div className="relative px-6 py-5 md:px-8 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="display text-base font-bold tracking-tight text-foreground">
                UN<span className="text-signal-durable">·</span>MAPPED
              </span>
              <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Skills Card
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-signal-durable" />
              <span>Verified · ESCO-aligned</span>
            </div>
          </div>
        </div>

        <div className="relative grid gap-6 px-6 pb-6 md:grid-cols-[1.6fr,1fr] md:gap-8 md:px-8 md:pb-8">
          {/* Holder block */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Holder
            </div>
            <div className="display mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {profile.name}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {profile.age ? `${profile.age} · ` : ""}
              {profile.region} · {locale.flag} {locale.country}
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-hairline py-4">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Issued
                </dt>
                <dd className="num mt-0.5 text-xs font-semibold text-foreground">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Card ID
                </dt>
                <dd className="num mt-0.5 text-xs font-semibold text-foreground">
                  {profile.id.slice(-8).toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Standard
                </dt>
                <dd className="num mt-0.5 text-xs font-semibold text-foreground">
                  ESCO/ISCO-08
                </dd>
              </div>
            </dl>
          </div>

          {/* Inline QR placeholder */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-paper p-4">
            <div
              className="grid h-24 w-24 grid-cols-8 grid-rows-8 gap-px rounded-md bg-foreground/5 p-1"
              aria-hidden
            >
              {Array.from({ length: 64 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    "rounded-[1px] " +
                    ((i * 7 + (i % 3)) % 3 === 0 ? "bg-foreground" : "bg-transparent")
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              Tap "Share via QR" for verifiable code
            </p>
          </div>
        </div>

        <div className="relative border-t border-hairline px-6 pb-6 pt-5 md:px-8 md:pb-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Validated skills · {profile.skills.length}
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {profile.skills.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {s.label}
                  </div>
                  <div className="num text-[10px] text-muted-foreground">
                    ISCO-08 {s.iscoCode} · {Math.round(s.confidence * 100)}%
                  </div>
                </div>
                <SignalPill kind={s.classification}>
                  {s.classification === "durable" ? "Durable" : "At risk"}
                </SignalPill>
              </li>
            ))}
          </ul>
        </div>

        {/* MRZ strip footer */}
        <div className="relative overflow-hidden border-t border-hairline bg-foreground px-6 py-3 md:px-8">
          <div className="num truncate text-[11px] font-semibold tracking-[0.12em] text-background/80">
            UMP&lt;{locale.code}&lt;{profile.name.toUpperCase().replace(/\s+/g, "<")}
            &lt;&lt;{profile.id.toUpperCase()}&lt;&lt;
            {profile.skills.map((s) => s.iscoCode).join("<")}
            &lt;&lt;{new Date(profile.createdAt).getTime().toString(36).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ActionBtn onClick={downloadPdf} icon={<Download className="h-4 w-4" />}>
          Download PDF
        </ActionBtn>
        <ActionBtn onClick={openQr} icon={<QrCode className="h-4 w-4" />}>
          Share via QR
        </ActionBtn>
        <ActionBtn
          onClick={() => setSmsOpen(true)}
          icon={<MessageSquare className="h-4 w-4" />}
        >
          Send SMS summary
        </ActionBtn>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share via QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Skills card QR"
                width={240}
                height={240}
                className="rounded-md border border-hairline"
              />
            )}
            <p className="text-center text-xs text-muted-foreground">
              Anyone can scan this to verify {profile.name}'s validated skills offline.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send SMS summary</DialogTitle>
          </DialogHeader>
          <form onSubmit={sendSms} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Phone number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={locale.code === "GH" ? "+233 24 …" : "+92 300 …"}
                required
                className="mt-1 w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Preview ({smsBody.length} chars)
              </label>
              <pre className="num mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-hairline bg-paper p-3 text-xs text-foreground">
                {smsBody}
              </pre>
            </div>
            <button
              type="submit"
              disabled={smsSent}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {smsSent ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                `Send via ${locale.smsSenderId}`
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionBtn({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-hairline bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-foreground hover:text-background"
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {children}
    </button>
  );
}
