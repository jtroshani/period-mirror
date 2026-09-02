import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Button, Card, SectionLabel } from "@/components/ui/primitives";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { ReportDocument } from "./ReportDocument";
import { IconDownload, IconShare, IconLock } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { useEntries, useIsPremium, useUser } from "@/store/selectors";
import { generateReport, resolveRange } from "@/services/report/ReportService";
import { useT } from "@/i18n";
import { brand } from "@/branding/brand";
import { addMonths, todayIso } from "@/utils/date";
import { uid } from "@/utils/id";
import type { ReportRangeKey } from "@/models";

export function ReportScreen() {
  const navigate = useNavigate();
  const t = useT();
  const entries = useEntries();
  const user = useUser();
  const isPremium = useIsPremium();
  const saveReport = useAppStore((s) => s.saveReport);
  const addSharedReport = useAppStore((s) => s.addSharedReport);

  const [rangeKey, setRangeKey] = useState<ReportRangeKey>("6m");
  const [customFrom, setCustomFrom] = useState(addMonths(todayIso(), -6));
  const [customTo, setCustomTo] = useState(todayIso());
  const [preview, setPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const range = useMemo(
    () => resolveRange(rangeKey, { from: customFrom, to: customTo }, t.lang),
    [rangeKey, customFrom, customTo, t.lang],
  );
  const report = useMemo(
    () => generateReport(entries, user, range, t.lang),
    [entries, user, range, t.lang],
  );

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const timer = setTimeout(() => window.print(), 60);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const gated = !isPremium;

  const share = async () => {
    const text = `${brand.name} — ${t("report.heading")} (${range.label}). ${report.changesToDiscuss[0] ?? ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t("report.heading"), text });
        return;
      } catch {
        /* cancelled */
      }
    }
    setShareOpen(true);
  };

  return (
    <>
      <AppBar title={t("report.heading")} />
      <Screen>
        <Stack>
          <p className="px-0.5 pt-1 text-[13px] leading-snug text-muted">{t("report.intro")}</p>

          <div>
            <SectionLabel>{t("report.timeRange")}</SectionLabel>
            <SegmentedControl<ReportRangeKey>
              value={rangeKey}
              onChange={setRangeKey}
              options={[
                { value: "3m", label: t("report.r3m") },
                { value: "6m", label: t("report.r6m") },
                { value: "12m", label: t("report.r12m") },
                { value: "custom", label: t("report.rCustom") },
              ]}
            />
            {rangeKey === "custom" && (
              <div className="mt-3 flex gap-2">
                <label className="flex-1 text-xs text-muted">
                  {t("report.from")}
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-line bg-surface px-2 text-sm text-ink"
                  />
                </label>
                <label className="flex-1 text-xs text-muted">
                  {t("report.to")}
                  <input
                    type="date"
                    value={customTo}
                    max={todayIso()}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-line bg-surface px-2 text-sm text-ink"
                  />
                </label>
              </div>
            )}
          </div>

          <Card className="grid grid-cols-3 gap-y-3.5 text-center">
            <Metric label={t("report.cycles")} value={`${report.cycleSummary.recordedCycles}`} />
            <Metric
              label={t("report.avgLength")}
              value={report.cycleSummary.averageLengthDays != null ? `${report.cycleSummary.averageLengthDays}d` : "—"}
            />
            <Metric
              label={t("report.variability")}
              value={report.cycleSummary.variabilityDays != null ? `±${report.cycleSummary.variabilityDays}d` : "—"}
            />
            <Metric
              label={t("report.typicalPain")}
              value={report.pain.typicalLevel != null ? `${report.pain.typicalLevel}/10` : "—"}
            />
            <Metric label={t("report.highPainDays")} value={`${report.pain.highPainDays}`} />
            <Metric label={t("report.heavyDays")} value={`${report.bleeding.heavyDays}`} />
          </Card>

          <div>
            <SectionLabel>{t("report.changesToDiscuss")}</SectionLabel>
            <Card inset>
              <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-snug text-ink">
                {report.changesToDiscuss.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Button block onClick={() => setPreview(true)}>
            {t("report.previewReport")}
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="quiet" onClick={() => saveReport(report)}>
              {t("report.save")}
            </Button>
            <Button
              size="sm"
              variant="quiet"
              icon={gated ? <IconLock size={14} /> : <IconDownload size={15} />}
              onClick={() => (gated ? navigate("/profile/subscription") : setPrinting(true))}
            >
              PDF
            </Button>
            <Button
              size="sm"
              variant="quiet"
              icon={gated ? <IconLock size={14} /> : <IconShare size={15} />}
              onClick={() => (gated ? navigate("/profile/subscription") : share())}
            >
              {t("report.share")}
            </Button>
          </div>
          {gated && <p className="text-center text-[11px] text-muted">{t("report.premiumNote")}</p>}

          <p className="text-[11px] leading-relaxed text-faint">
            {t("disclaimer.reportAttribution")} {t("disclaimer.reportDisclaimer")}
          </p>
        </Stack>
      </Screen>

      <Sheet open={preview} onClose={() => setPreview(false)} title={t("report.previewTitle")}>
        <div className="-mx-2 rounded-xl bg-white shadow-inner">
          <ReportDocument report={report} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            block
            icon={gated ? <IconLock size={16} /> : <IconDownload size={18} />}
            onClick={() => {
              setPreview(false);
              if (gated) navigate("/profile/subscription");
              else setPrinting(true);
            }}
          >
            {gated ? t("report.premiumToDownload") : t("report.downloadPdf")}
          </Button>
        </div>
      </Sheet>

      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title={t("report.shareTitle")}>
        <div className="space-y-3">
          <p className="text-sm text-muted">{t("report.shareBody")}</p>
          <Button
            block
            onClick={() => {
              addSharedReport({
                id: uid("grant"),
                reportId: report.id,
                createdAt: new Date().toISOString(),
                label: `${t("report.heading")} · ${range.label}`,
                revoked: false,
              });
              setShareOpen(false);
            }}
          >
            {t("report.createLink")}
          </Button>
          <p className="text-xs text-faint">{t("report.manageShared")}</p>
        </div>
      </Sheet>

      {printing &&
        createPortal(
          <div className="pm-print-portal">
            <ReportDocument report={report} />
          </div>,
          document.body,
        )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-[17px] text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}
