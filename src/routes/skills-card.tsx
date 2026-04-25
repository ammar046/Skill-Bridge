import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, QrCode, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useApp } from "@/context/AppContext";
import { SignalPill } from "@/components/SignalPill";
import { t } from "@/lib/i18n";
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
  const { profile, locale, uiLocale } = useApp();
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
    const verifyUrl = profile.passId
      ? `https://unmapped.world/verify/${profile.passId}`
      : `https://unmapped.world/verify?name=${encodeURIComponent(profile.name)}`;
    const url = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
    setQrUrl(url);
    setQrOpen(true);
  }

  async function downloadPdf() {
    if (!profile || !cardRef.current) return;

    const A4_W = 595.28;
    const A4_H = 841.89;
    const M = 36;
    const passId = profile.passId ?? null;
    const verifyUrl = passId
      ? `https://unmapped.world/verify/${passId}`
      : null;

    // 1 — Capture card DOM visually
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

    // 2 — Header banner
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, A4_W, 52, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("UNMAPPED — Bridge Pass", M, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `${profile.name}  ·  ${locale.country} (${locale.code})  ·  Issued ${new Date().toLocaleDateString()}`,
      M,
      37,
    );
    doc.text("ISCO-08 Standardised · Portable across borders · UNMAPPED Protocol v2", M, 47);

    // 3 — Visual card image
    const availW = A4_W - M * 2;
    const imgRatio = canvas.height / canvas.width;
    const imgH = Math.min(availW * imgRatio, A4_H - 52 - M - 130);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", M, 62, availW, imgH);

    // 4 — ISCO-08 credentials table (the portable, machine-readable section)
    let y = 62 + imgH + 18;
    doc.setFillColor(245, 245, 245);
    doc.rect(M, y, A4_W - M * 2, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text("ISCO-08 CODE", M + 4, y + 10);
    doc.text("SKILL LABEL", M + 70, y + 10);
    doc.text("CLASSIFICATION", M + 280, y + 10);
    doc.text("AUTOMATION RISK (F-O)", M + 390, y + 10);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    profile.skills.forEach((s) => {
      if (y > A4_H - 60) return;
      doc.setTextColor(20, 20, 20);
      doc.text(s.iscoCode, M + 4, y);
      doc.text(s.label.slice(0, 38), M + 70, y);
      const classColor = s.classification === "durable" ? [22, 163, 74] : [220, 38, 38];
      doc.setTextColor(classColor[0], classColor[1], classColor[2]);
      doc.text(s.classification.toUpperCase(), M + 280, y);
      doc.setTextColor(80, 80, 80);
      const fo = s.freyOsborneScore != null ? `${Math.round(s.freyOsborneScore * 100)}%` : "—";
      doc.text(fo, M + 390, y);
      y += 12;
    });

    // 5 — ILO wage floor + econometric attribution
    y += 10;
    doc.setFillColor(235, 250, 240);
    doc.rect(M, y, A4_W - M * 2, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(22, 163, 74);
    doc.text("ILO WAGE FLOOR (ILOSTAT 2024)", M + 4, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(
      `${locale.currencySymbol}${locale.sampleWageFloor.toLocaleString()}/month  ·  Source: ILO Global Wage Report 2024 · ILOSTAT published tables`,
      M + 4,
      y + 21,
    );

    // 6 — Credential ID + QR code (bottom-right, ~2cm × 2cm ≈ 56pt)
    if (passId && verifyUrl) {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 160 });
      const QR_SIZE = 56;
      const qrX = A4_W - M - QR_SIZE;
      const qrY = A4_H - M - QR_SIZE - 20;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(`Credential ID: UNMP-${passId}`, M, qrY + QR_SIZE + 8);
    }

    // 7 — Footer
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Sources: ISCO-08 ILO taxonomy · Frey & Osborne (2013) LMIC-adjusted automation scores · World Bank WDI 2024 · ILO Global Wage Report 2024 · ILOSTAT",
      M,
      A4_H - 16,
    );
    const footerLine2 = passId
      ? `Scan QR code to verify this credential. Powered by UNMAPPED Protocol — Open Infrastructure for the Informal Economy.`
      : "This credential was generated by the UNMAPPED Protocol — open infrastructure for the informal economy.";
    doc.text(footerLine2, M, A4_H - 7);

    doc.save(`unmapped-bridge-pass-${profile.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
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
          {t("card.page_label", uiLocale)}
        </p>
        <h1 className="display mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
          {t("card.title", uiLocale)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("card.sub", uiLocale)}
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
              <span>{t("card.verified_label", uiLocale)}</span>
            </div>
          </div>
        </div>

        <div className="relative grid gap-6 px-6 pb-6 md:grid-cols-[1.6fr,1fr] md:gap-8 md:px-8 md:pb-8">
          {/* Holder block */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("card.holder", uiLocale)}
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
                  {t("card.issued", uiLocale)}
                </dt>
                <dd className="num mt-0.5 text-xs font-semibold text-foreground">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("card.credential_id", uiLocale)}
                </dt>
                <dd className="num mt-0.5 text-xs font-semibold text-foreground">
                  {profile.passId ? `UNMP-${profile.passId}` : profile.id.slice(-8).toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("card.standard", uiLocale)}
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
              {t("card.qr_hint", uiLocale)}
            </p>
          </div>
        </div>

        <div className="relative border-t border-hairline px-6 pb-6 pt-5 md:px-8 md:pb-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("card.validated_skills", uiLocale)} · {profile.skills.length}
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
                  {s.classification === "durable" ? t("profile.durable", uiLocale) : t("profile.at_risk", uiLocale)}
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
          {t("card.download_pdf", uiLocale)}
        </ActionBtn>
        <ActionBtn onClick={openQr} icon={<QrCode className="h-4 w-4" />}>
          {t("card.share_qr", uiLocale)}
        </ActionBtn>
        <ActionBtn
          onClick={() => setSmsOpen(true)}
          icon={<MessageSquare className="h-4 w-4" />}
        >
          {t("card.send_sms", uiLocale)}
        </ActionBtn>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("card.qr_title", uiLocale)}</DialogTitle>
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
              {t("card.qr_verify_hint", uiLocale)}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("card.sms_title", uiLocale)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={sendSms} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("card.sms_phone_label", uiLocale)}
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
                {t("card.sms_preview_label", uiLocale)} ({smsBody.length})
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
