import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, QrCode, MessageSquare, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { useApp } from "@/context/AppContext";
import { SignalPill } from "@/components/SignalPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      v: 1, name: profile.name, region: profile.region, country: locale.code,
      skills: profile.skills.map((s) => ({ l: s.label, c: s.iscoCode, k: s.classification })),
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
    doc.text(`Issued ${new Date().toLocaleDateString()} · ${locale.country} (${locale.code})`, 40, 78);

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
      doc.text(`${s.formalName} · ISCO-08 ${s.iscoCode} · ${s.classification.toUpperCase()} · ${Math.round(s.confidence * 100)}%`, 56, y + 14);
      doc.setTextColor(20);
      y += 36;
    });

    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text("Open infrastructure for the informal economy · unmapped.dev", 40, 800);
    doc.save(`unmapped-skills-${profile.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  }

  function sendSms(e: React.FormEvent) {
    e.preventDefault();
    setSmsSent(true);
    setTimeout(() => { setSmsOpen(false); setSmsSent(false); }, 1800);
  }

  if (!profile) return null;

  const smsBody =
    `UNMAPPED: ${profile.name} — ${profile.region}. Skills: ` +
    profile.skills.map((s) => s.label).join(", ") +
    `. Card: unmapped.app/c/${profile.id}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Exportable skills card</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Carry your work with you</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A digital ID for the informal economy. Share via PDF, QR, or SMS for non-smartphone users.
        </p>
      </header>

      <div ref={cardRef} className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-surface-raised px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground">UNMAPPED · Skills Card</span>
            <span className="num text-[11px] text-muted-foreground">ID {profile.id}</span>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Holder</div>
              <div className="text-2xl font-semibold text-foreground">{profile.name}</div>
              <div className="text-sm text-muted-foreground">
                {profile.age ? `${profile.age} · ` : ""}{profile.region} · {locale.flag} {locale.country}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Issued</div>
              <div className="num text-sm font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Validated skills</div>
            <ul className="mt-3 space-y-2">
              {profile.skills.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{s.label}</div>
                    <div className="num text-[11px] text-muted-foreground">ISCO-08 {s.iscoCode}</div>
                  </div>
                  <SignalPill kind={s.classification}>
                    {s.classification === "durable" ? "Durable" : "At risk"}
                  </SignalPill>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ActionBtn onClick={downloadPdf} icon={<Download className="h-4 w-4" />}>Download PDF</ActionBtn>
        <ActionBtn onClick={openQr} icon={<QrCode className="h-4 w-4" />}>Share via QR</ActionBtn>
        <ActionBtn onClick={() => setSmsOpen(true)} icon={<MessageSquare className="h-4 w-4" />}>Send SMS summary</ActionBtn>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Share via QR</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {qrUrl && <img src={qrUrl} alt="Skills card QR" width={240} height={240} className="rounded-md border border-border" />}
            <p className="text-xs text-muted-foreground text-center">
              Anyone can scan this to verify {profile.name}'s validated skills offline.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send SMS summary</DialogTitle></DialogHeader>
          <form onSubmit={sendSms} className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={locale.code === "GH" ? "+233 24 …" : "+92 300 …"}
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Preview ({smsBody.length} chars)</label>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted p-3 text-xs text-foreground">{smsBody}</pre>
            </div>
            <button
              type="submit" disabled={smsSent}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {smsSent ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : `Send via ${locale.smsSenderId}`}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionBtn({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {icon}{children}
    </button>
  );
}
