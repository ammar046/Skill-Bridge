import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, QrCode, MessageSquare, Loader2, ShieldCheck, Zap } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { useApp } from "@/context/AppContext";
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
  const [cardQrUrl, setCardQrUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  useEffect(() => {
    if (!profile) return;
    const url = profile.passId
      ? `https://unmapped.world/verify/${profile.passId}`
      : `https://unmapped.world/verify?name=${encodeURIComponent(profile.name)}`;
    QRCode.toDataURL(url, { margin: 1, width: 160, errorCorrectionLevel: "M" })
      .then(setCardQrUrl)
      .catch(() => {});
  }, [profile]);

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
      // ── Constants ───────────────────────────────────────────────────────────
      const A4_W = 595.28;
      const A4_H = 841.89;
      const L = 36;                        // left margin
      const R = A4_W - 36;                 // right edge
      const CW = R - L;                    // content width  = 523.28 pt
      const FOOTER_Y = A4_H - 44;         // footer zone starts here
      const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

      const passId  = profile.passId ?? null;
      const verifyUrl = passId ? `https://unmapped.world/verify/${passId}` : null;
      const credId  = passId ? `UNMP-${passId}` : profile.id.slice(-8).toUpperCase();

      // ── Primitive helpers ───────────────────────────────────────────────────
      // draw() — raw text, returns the height consumed (font-size × leading)
      const draw = (
        text: string, x: number, y: number, size: number,
        bold = false, rgb: [number, number, number] = [20, 20, 20],
      ) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(text, x, y);
        return size * 1.4;
      };

      // wrap() — wraps text into maxW, returns total height consumed
      const wrap = (
        text: string, x: number, y: number, size: number, maxW: number,
        bold = false, rgb: [number, number, number] = [20, 20, 20],
      ) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const lines = doc.splitTextToSize(text, maxW) as string[];
        doc.text(lines, x, y);
        return lines.length * size * 1.4;
      };

      // label() — small uppercase section label
      const label = (text: string, x: number, y: number) =>
        draw(text, x, y, 7, false, [120, 120, 120]);

      // ── 1. Header  (0 → 60 pt) ─────────────────────────────────────────────
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, A4_W, 57, "F");
      draw("UN·MAPPED — Bridge Pass", L, 20, 14, true, [255, 255, 255]);
      draw("Open Infrastructure for the Informal Economy · UNMAPPED Protocol v2", L, 34, 7.5, false, [150, 150, 150]);
      draw(
        `Issued: ${new Date().toLocaleDateString()}  ·  ${locale.country} (${locale.code.toUpperCase()})  ·  ISCO-08 Standardised`,
        L, 47, 7.5, false, [130, 130, 130],
      );
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 56, A4_W, 3, "F");

      // ── 2. Worker identity  (starts at y = 75) ─────────────────────────────
      let y = 75;
      label("HOLDER", L, y + 8);
      y += 14;
      draw(profile.name, L, y + 22, 26, true, [15, 15, 15]);
      y += 30;
      draw(
        [profile.age ? `Age ${profile.age}` : "", profile.userCity || profile.region, locale.country]
          .filter(Boolean).join("  ·  "),
        L, y + 10, 8.5, false, [100, 100, 100],
      );
      y += 18;

      // ── 3. Credential bar  (fixed 30 pt tall) ──────────────────────────────
      y += 4;
      doc.setFillColor(246, 246, 246);
      doc.roundedRect(L, y, CW, 30, 3, 3, "F");
      // col 1
      label("CREDENTIAL ID", L + 8, y + 10);
      draw(credId, L + 8, y + 23, 8, true, [20, 20, 20]);
      // col 2
      label("STANDARD", L + 190, y + 10);
      draw("ESCO / ILO ISCO-08", L + 190, y + 23, 8, true, [20, 20, 20]);
      // col 3
      label("ISSUED", L + 360, y + 10);
      draw(new Date(profile.createdAt).toLocaleDateString(), L + 360, y + 23, 8, true, [20, 20, 20]);
      y += 42;

      // ── 4. Skills table ────────────────────────────────────────────────────
      y += 10;
      label("VALIDATED SKILLS  (ILO ISCO-08 × FREY-OSBORNE 2013)", L, y + 7);
      y += 14;

      // Table header row
      const TH = 15;   // table header height
      const TR = 14;   // table row height
      doc.setFillColor(25, 25, 25);
      doc.rect(L, y, CW, TH, "F");
      const colX = { isco: L + 4, skill: L + 52, task: L + 268, cls: L + 378, fo: L + 446 };
      draw("ISCO-08",    colX.isco,  y + 10, 6.5, true, [190, 190, 190]);
      draw("SKILL LABEL",colX.skill, y + 10, 6.5, true, [190, 190, 190]);
      draw("ILO TASK TYPE", colX.task,y + 10, 6.5, true, [190, 190, 190]);
      draw("STATUS",     colX.cls,  y + 10, 6.5, true, [190, 190, 190]);
      draw("F-O RISK",   colX.fo,   y + 10, 6.5, true, [190, 190, 190]);
      y += TH;

      const skillsToShow = profile.skills.slice(0, 8);
      skillsToShow.forEach((s, i) => {
        const bg = i % 2 === 0 ? [250, 250, 250] : [242, 242, 242];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(L, y, CW, TR, "F");

        draw(s.iscoCode || "—",                                           colX.isco,  y + 10, 8,   false, [60, 60, 60]);
        draw(s.label.slice(0, 32),                                        colX.skill, y + 10, 8,   false, [15, 15, 15]);
        draw((s.iloTaskType ?? "mixed").replace(/_/g, " ").slice(0, 24), colX.task,  y + 10, 6.5, false, [80, 80, 80]);

        const isDurable = s.classification === "durable";
        const clsColor: [number, number, number] = isDurable ? [16, 140, 64] : [200, 30, 30];
        draw(isDurable ? "DURABLE" : "AT RISK",                           colX.cls,   y + 10, 7,   true,  clsColor);

        const foVal  = s.freyOsborneScore != null ? Math.round(s.freyOsborneScore * 100) : null;
        const foStr  = foVal != null ? `${foVal}%` : "—";
        const foColor: [number, number, number] =
          foVal != null && foVal >= 65 ? [200, 30, 30] :
          foVal != null && foVal < 40  ? [16, 140, 64] :
          [160, 90, 0];
        draw(foStr,                                                        colX.fo,    y + 10, 8,   true,  foColor);
        y += TR;
      });

      // ── 5. Wage floor  (fixed 44 pt tall) ─────────────────────────────────
      y += 14;
      const sortedMatches = [...(profile.matches ?? [])].sort((a, b) => b.matchStrength - a.matchStrength);
      const bestMatch = sortedMatches.find((m) => m.wageFloorAmount > 0) ?? null;

      doc.setFillColor(232, 252, 240);
      doc.roundedRect(L, y, CW, 44, 3, 3, "F");
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      doc.roundedRect(L, y, CW, 44, 3, 3, "S");
      doc.setLineWidth(0.2);

      label(`ILO WAGE FLOOR — ${locale.currency}`, L + 8, y + 10);
      if (bestMatch) {
        draw(
          `${locale.currencySymbol} ${bestMatch.wageFloorAmount.toLocaleString()} / month`,
          L + 8, y + 24, 11, true, [15, 15, 15],
        );
        draw(
          `${bestMatch.title.slice(0, 55)}  ·  ${bestMatch.matchStrength}% match  ·  ${bestMatch.ilostatSource ?? "ILOSTAT 2024"}`,
          L + 8, y + 37, 7, false, [80, 80, 80],
        );
      } else {
        draw(
          `${locale.currencySymbol} ${locale.sampleWageFloor.toLocaleString()} / month  (regional minimum baseline)`,
          L + 8, y + 24, 10, true, [15, 15, 15],
        );
        draw(locale.wageFloorSource.slice(0, 70), L + 8, y + 37, 7, false, [80, 80, 80]);
      }
      y += 56;

      // ── 6. Matched opportunities  (up to 3 rows, each 15 pt) ──────────────
      if (sortedMatches.length > 0) {
        label("MATCHED OPPORTUNITIES  (ILO ILOSTAT · Gemini)", L, y + 7);
        y += 14;

        const oppHeader = 13;
        doc.setFillColor(25, 25, 25);
        doc.rect(L, y, CW, oppHeader, "F");
        draw("ROLE",      L + 4,   y + 9.5, 6.5, true, [190, 190, 190]);
        draw("WAGE / MO", L + 290, y + 9.5, 6.5, true, [190, 190, 190]);
        draw("GROWTH",    L + 378, y + 9.5, 6.5, true, [190, 190, 190]);
        draw("MATCH",     L + 448, y + 9.5, 6.5, true, [190, 190, 190]);
        y += oppHeader;

        sortedMatches.slice(0, 3).forEach((m, i) => {
          const bg = i % 2 === 0 ? [250, 250, 250] : [242, 242, 242];
          doc.setFillColor(bg[0], bg[1], bg[2]);
          doc.rect(L, y, CW, TR, "F");
          draw(m.title.slice(0, 40), L + 4, y + 10, 8, false, [15, 15, 15]);
          const wStr = m.wageFloorAmount > 0
            ? `${locale.currencySymbol}${m.wageFloorAmount.toLocaleString()}`
            : `${locale.currencySymbol}${locale.sampleWageFloor.toLocaleString()}`;
          draw(wStr,              L + 290, y + 10, 8, true,  [16, 140, 64]);
          draw(m.growthPercent,   L + 378, y + 10, 8, false, [80, 80, 80]);
          draw(`${m.matchStrength}%`, L + 448, y + 10, 8, true, [60, 60, 60]);
          y += TR;
        });
        y += 8;
      }

      // ── 7. Source narrative  (capped to 4 lines ≈ 52 pt) ──────────────────
      y += 6;
      // Draw a thin left rule instead of a background box
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(2);
      doc.line(L, y, L, y + 52);
      doc.setLineWidth(0.2);

      label("SOURCE NARRATIVE", L + 8, y + 9);
      const rawNarrative = profile.rawNarrative.slice(0, 280);
      const narText = `"${rawNarrative}${profile.rawNarrative.length > 280 ? "…" : ""}"`;
      // clamp to 4 lines max by wrapping into CW - 16 and taking first 4 lines
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const narLines = (doc.splitTextToSize(narText, CW - 16) as string[]).slice(0, 4);
      doc.setTextColor(55, 55, 55);
      doc.text(narLines, L + 8, y + 22);
      y += 22 + narLines.length * 8.5 * 1.4 + 10;

      // ── 8. QR code  (anchored to bottom-right, never overlaps body) ────────
      if (passId && verifyUrl) {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          margin: 1, width: 140, errorCorrectionLevel: "M",
        });
        const QR = 70;
        const qrX = R - QR;
        const qrY = FOOTER_Y - QR - 18;
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR, QR);
        draw("Scan to verify", qrX + 6, qrY + QR + 11, 6.5, false, [120, 120, 120]);
        draw(`Credential ID: ${credId}`, L, qrY + QR + 11, 6.5, false, [120, 120, 120]);
      }

      // ── 9. Footer rule + attribution ───────────────────────────────────────
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.5);
      doc.line(L, FOOTER_Y, R, FOOTER_Y);
      wrap(
        "Sources: ILO ISCO-08 taxonomy · Frey & Osborne (2013) automation scores, LMIC-adjusted per ILO (2019) · ILO Global Wage Report 2024 · ILOSTAT",
        L, FOOTER_Y + 12, 6.5, CW, false, [140, 140, 140],
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

  const credId = profile.passId
    ? `UNMP-${profile.passId}`
    : profile.id.slice(-8).toUpperCase();

  const sortedMatches = [...(profile.matches ?? [])].sort(
    (a, b) => b.matchStrength - a.matchStrength,
  );
  const bestWage = sortedMatches.find((m) => m.wageFloorAmount > 0) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 pt-2">
      {/* Page heading */}
      <header className="animate-fade-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t("card.page_label", uiLocale)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {t("card.title", uiLocale)}
        </h1>
      </header>

      {/* ── The Card ──────────────────────────────────────────────────────── */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] animate-fade-up [animation-delay:60ms]"
      >
        {/* ── Dark header zone ── */}
        <div className="relative bg-[#0f0f0f] px-6 pt-5 pb-6 md:px-8">
          {/* Guilloché pattern */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
            viewBox="0 0 600 200"
            aria-hidden
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <ellipse
                key={i}
                cx="300" cy="100"
                rx={290 - i * 12} ry={90 - i * 4}
                fill="none" stroke="white" strokeWidth="0.6"
              />
            ))}
          </svg>

          {/* Top bar: brand + verified badge */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold tracking-tight text-white">
                UN<span className="text-emerald-400">·</span>MAPPED
              </span>
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-white/50">
                Bridge Pass
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                {t("card.verified_label", uiLocale)}
              </span>
            </div>
          </div>

          {/* Holder name + QR */}
          <div className="relative mt-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.22em] text-white/40">
                {t("card.holder", uiLocale)}
              </p>
              <p className="mt-1 truncate text-2xl font-bold tracking-tight text-white md:text-3xl">
                {profile.name}
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                {[profile.age ? `Age ${profile.age}` : "", profile.userCity || profile.region, `${locale.flag} ${locale.country}`]
                  .filter(Boolean).join("  ·  ")}
              </p>
            </div>

            {/* Real QR code */}
            <div className="shrink-0 text-center">
              {cardQrUrl ? (
                <img
                  src={cardQrUrl}
                  alt="Verify credential"
                  className="h-16 w-16 rounded-md border border-white/10 bg-white p-0.5"
                />
              ) : (
                <div className="h-16 w-16 rounded-md border border-white/10 bg-white/5 animate-pulse" />
              )}
              <p className="mt-1 text-[8px] uppercase tracking-widest text-white/30">
                {t("card.qr_hint", uiLocale)}
              </p>
            </div>
          </div>

          {/* Credential meta strip */}
          <div className="relative mt-5 grid grid-cols-3 border-t border-white/10 pt-4">
            {[
              { label: t("card.issued", uiLocale),        value: new Date(profile.createdAt).toLocaleDateString() },
              { label: t("card.credential_id", uiLocale), value: credId },
              { label: t("card.standard", uiLocale),      value: "ESCO/ISCO-08" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[8px] uppercase tracking-widest text-white/35">{label}</p>
                <p className="num mt-0.5 truncate text-[10px] font-semibold text-white/80">{value}</p>
              </div>
            ))}
          </div>

          {/* Holographic bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        </div>

        {/* ── Skills section ── */}
        <div className="bg-card px-6 py-5 md:px-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("card.validated_skills", uiLocale)} · {profile.skills.length}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((s) => {
              const isDurable = s.classification === "durable";
              const foVal = s.freyOsborneScore != null ? Math.round(s.freyOsborneScore * 100) : null;
              return (
                <div
                  key={s.id}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1.5",
                    isDurable
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                      : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
                  ].join(" ")}
                >
                  <span className={[
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    isDurable ? "bg-emerald-500" : "bg-red-500",
                  ].join(" ")} />
                  <span className="text-xs font-semibold text-foreground">{s.label}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {s.iscoCode}
                    {foVal != null && ` · ${foVal}% risk`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Wage floor ── */}
        <div className="border-t border-hairline bg-emerald-50/60 px-6 py-4 dark:bg-emerald-950/20 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                ILO Wage Floor · {locale.currency}
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {locale.currencySymbol}{" "}
                {bestWage
                  ? bestWage.wageFloorAmount.toLocaleString()
                  : locale.sampleWageFloor.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
              </p>
              {bestWage && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {bestWage.title} · {bestWage.matchStrength}% match
                </p>
              )}
            </div>
            {sortedMatches.length > 1 && (
              <div className="shrink-0 space-y-1 text-right">
                {sortedMatches.slice(1, 3).map((m, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{locale.currencySymbol}{m.wageFloorAmount > 0 ? m.wageFloorAmount.toLocaleString() : locale.sampleWageFloor.toLocaleString()}</span>
                    {" · "}
                    <span className="truncate">{m.title.slice(0, 22)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground">
            Source: {bestWage?.ilostatSource ?? locale.wageFloorSource}
          </p>
        </div>

        {/* ── MRZ strip ── */}
        <div className="overflow-hidden bg-[#0f0f0f] px-6 py-2.5 md:px-8">
          <p className="num truncate text-[10px] font-medium tracking-[0.14em] text-white/40">
            UMP&lt;{locale.code.toUpperCase()}&lt;{profile.name.toUpperCase().replace(/\s+/g, "<")}
            {"<<"}
            {credId.replace("UNMP-", "")}
            {"<<"}
            {profile.skills.map((s) => s.iscoCode).join("<")}
            {"<<"}
            {new Date(profile.createdAt).getTime().toString(36).toUpperCase()}
          </p>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-3 gap-2 animate-fade-up [animation-delay:120ms]">
        <ActionBtn
          onClick={downloadPdf}
          icon={pdfLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
          disabled={pdfLoading}
          primary
        >
          {pdfLoading
            ? (uiLocale === "ur" ? "بن رہا ہے…" : "Generating…")
            : t("card.download_pdf", uiLocale)}
        </ActionBtn>
        <ActionBtn onClick={openQr} icon={<QrCode className="h-4 w-4" />}>
          {t("card.share_qr", uiLocale)}
        </ActionBtn>
        <ActionBtn onClick={() => setSmsOpen(true)} icon={<MessageSquare className="h-4 w-4" />}>
          {t("card.send_sms", uiLocale)}
        </ActionBtn>
      </div>

      {pdfError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <Zap className="mt-0.5 h-4 w-4 shrink-0" />
          {pdfError}
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
  primary,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        primary
          ? "bg-[#0f0f0f] text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-black dark:hover:bg-white/90"
          : "border border-hairline bg-background text-foreground hover:bg-foreground/5",
      ].join(" ")}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {children}
    </button>
  );
}
