import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, QrCode, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
    if (!profile) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const A4_W = 595.28;
      const A4_H = 841.89;
      const M = 40;
      const passId = profile.passId ?? null;
      const verifyUrl = passId ? `https://unmapped.world/verify/${passId}` : null;
      const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
      let y = 0;

      const txt = (
        text: string,
        x: number,
        yPos: number,
        size: number,
        bold = false,
        rgb: [number, number, number] = [20, 20, 20],
        maxW?: number,
      ) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        if (maxW) {
          const lines = doc.splitTextToSize(text, maxW);
          doc.text(lines, x, yPos);
          return lines.length * size * 1.35;
        }
        doc.text(text, x, yPos);
        return size * 1.35;
      };

      // ── 1. Header banner ──────────────────────────────────────────────────
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, A4_W, 58, "F");
      txt("UN·MAPPED — Bridge Pass", M, 20, 15, true, [255, 255, 255]);
      txt("Open Infrastructure for the Informal Economy · UNMAPPED Protocol v2", M, 34, 8, false, [160, 160, 160]);
      txt(`Issued: ${new Date().toLocaleDateString()}  ·  ${locale.country} (${locale.code.toUpperCase()})  ·  ISCO-08 Standardised`, M, 46, 8, false, [160, 160, 160]);
      // Holographic accent bar
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 56, A4_W, 3, "F");
      y = 78;

      // ── 2. Worker identity block ──────────────────────────────────────────
      txt("HOLDER", M, y, 7.5, false, [120, 120, 120]);
      y += 14;
      txt(profile.name, M, y, 24, true, [15, 15, 15]);
      y += 30;
      txt(
        [profile.age ? `Age ${profile.age}` : "", profile.region, locale.country].filter(Boolean).join("  ·  "),
        M, y, 9, false, [100, 100, 100],
      );
      y += 16;

      // Credential meta row
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(M, y, A4_W - M * 2, 28, 4, 4, "F");
      const credId = passId ? `UNMP-${passId}` : profile.id.slice(-8).toUpperCase();
      txt("CREDENTIAL ID", M + 8, y + 10, 7, false, [120, 120, 120]);
      txt(credId, M + 8, y + 21, 8, true, [20, 20, 20]);
      txt("STANDARD", M + 180, y + 10, 7, false, [120, 120, 120]);
      txt("ESCO / ILO ISCO-08", M + 180, y + 21, 8, true, [20, 20, 20]);
      txt("ISSUED", M + 340, y + 10, 7, false, [120, 120, 120]);
      txt(new Date(profile.createdAt).toLocaleDateString(), M + 340, y + 21, 8, true, [20, 20, 20]);
      y += 42;

      // ── 3. Validated Skills table ─────────────────────────────────────────
      y += 8;
      txt("VALIDATED SKILLS (ILO ISCO-08 × FREY-OSBORNE 2013)", M, y, 7.5, true, [80, 80, 80]);
      y += 14;

      // Table header
      doc.setFillColor(30, 30, 30);
      doc.rect(M, y, A4_W - M * 2, 14, "F");
      txt("ISCO-08", M + 4, y + 10, 7, true, [200, 200, 200]);
      txt("SKILL LABEL", M + 50, y + 10, 7, true, [200, 200, 200]);
      txt("ILO TASK TYPE", M + 270, y + 10, 7, true, [200, 200, 200]);
      txt("CLASS.", M + 380, y + 10, 7, true, [200, 200, 200]);
      txt("F-O RISK", M + 430, y + 10, 7, true, [200, 200, 200]);
      y += 18;

      profile.skills.forEach((s, i) => {
        if (y > A4_H - 160) return;
        const rowBg = i % 2 === 0 ? [252, 252, 252] : [244, 244, 244];
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        doc.rect(M, y - 10, A4_W - M * 2, 14, "F");

        txt(s.iscoCode || "—", M + 4, y, 8, false, [60, 60, 60]);
        txt(s.label.slice(0, 30), M + 50, y, 8, false, [20, 20, 20]);

        const taskShort = (s.iloTaskType ?? "mixed").replace(/_/g, " ").slice(0, 22);
        txt(taskShort, M + 270, y, 7, false, [80, 80, 80]);

        const isDurable = s.classification === "durable";
        const classRgb: [number, number, number] = isDurable ? [22, 163, 74] : [220, 38, 38];
        txt(isDurable ? "DURABLE" : "AT RISK", M + 380, y, 7, true, classRgb);

        const fo = s.freyOsborneScore != null ? `${Math.round(s.freyOsborneScore * 100)}%` : "—";
        const foRgb: [number, number, number] = s.freyOsborneScore != null && s.freyOsborneScore > 0.55
          ? [220, 38, 38]
          : s.freyOsborneScore != null && s.freyOsborneScore < 0.35
            ? [22, 163, 74]
            : [180, 100, 0];
        txt(fo, M + 435, y, 8, true, foRgb);
        y += 14;
      });

      // ── 4. ILO wage floor block ───────────────────────────────────────────
      y += 12;
      doc.setFillColor(235, 252, 243);
      doc.roundedRect(M, y, A4_W - M * 2, 36, 4, 4, "F");
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(M, y, A4_W - M * 2, 36, 4, 4, "S");
      txt("ILO WAGE FLOOR — ILOSTAT 2024", M + 8, y + 12, 7.5, true, [15, 115, 70]);
      txt(
        `${locale.currencySymbol} ${locale.sampleWageFloor.toLocaleString()} / month  ·  Source: ILO Global Wage Report 2024 · ILOSTAT published tables`,
        M + 8, y + 26, 8, false, [20, 20, 20],
      );
      y += 50;

      // ── 5. Source narrative quote ─────────────────────────────────────────
      y += 4;
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(M, y, A4_W - M * 2, 8, 2, 2, "F");
      txt("SOURCE NARRATIVE", M, y + 7, 7, false, [120, 120, 120]);
      y += 14;
      const narrative = `"${profile.rawNarrative.slice(0, 300)}${profile.rawNarrative.length > 300 ? "..." : ""}"`;
      const narH = txt(narrative, M, y, 8.5, false, [50, 50, 50], A4_W - M * 2);
      y += narH + 14;

      // ── 6. QR code + credential ID ────────────────────────────────────────
      if (passId && verifyUrl) {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 160, errorCorrectionLevel: "M" });
        const QR_SIZE = 64;
        const qrX = A4_W - M - QR_SIZE;
        const qrY = A4_H - M - QR_SIZE - 28;
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
        txt("Scan to verify", qrX - 2, qrY + QR_SIZE + 10, 7, false, [120, 120, 120]);
        txt(`Credential ID: UNMP-${passId}`, M, qrY + QR_SIZE + 10, 7, false, [120, 120, 120]);
      }

      // ── 7. Footer ─────────────────────────────────────────────────────────
      doc.setDrawColor(220, 220, 220);
      doc.line(M, A4_H - 30, A4_W - M, A4_H - 30);
      txt(
        "Sources: ILO ISCO-08 taxonomy · Frey & Osborne (2013) automation scores, LMIC-adjusted per ILO (2019) · ILO Global Wage Report 2024 · ILOSTAT",
        M, A4_H - 18, 7, false, [140, 140, 140], A4_W - M * 2,
      );

      doc.save(`unmapped-bridge-pass-${profile.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF generation failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
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
        <ActionBtn onClick={downloadPdf} icon={pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} disabled={pdfLoading}>
          {pdfLoading ? (uiLocale === "ur" ? "بن رہا ہے…" : "Generating…") : t("card.download_pdf", uiLocale)}
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

      {pdfError && (
        <div className="rounded-lg border border-signal-risk/30 bg-signal-risk-soft px-4 py-3 text-sm text-signal-risk">
          PDF error: {pdfError}
        </div>
      )}

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
  disabled,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-hairline bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {children}
    </button>
  );
}
