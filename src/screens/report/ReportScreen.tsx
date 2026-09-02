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
import { brand } from "@/branding/brand";
import { addMonths, todayIso } from "@/utils/date";
import { uid } from "@/utils/id";
import type { ReportRangeKey } from "@/models";

export function ReportScreen() {
  const navigate = useNavigate();
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
    () => resolveRange(rangeKey, { from: customFrom, to: customTo }),
    [rangeKey, customFrom, customTo],
  );
  const report = useMemo(
    () => generateReport(entries, user, range),
    [entries, user, range],
  );

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => {
      window.print();
    }, 60);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const gated = !isPremium;

  const share = async () => {
    const text = `${brand.name} — ${brand.reportName} (${range.label}). ${report.changesToDiscuss[0] ?? ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: brand.reportName, text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    setShareOpen(true);
  };

  return (
    <>
      <AppBar title="Report" />
      <Screen>
        <Stack>
          <div>
            <h1 className="font-display text-2xl text-ink">{brand.reportName}</h1>
            <p className="mt-1 text-sm text-muted">
              A one-page summary you can bring to an appointment — built from what
              you've recorded, compared with your own history.
            </p>
          </div>

          <div>
            <SectionLabel>Time range</SectionLabel>
            <SegmentedControl<ReportRangeKey>
              value={rangeKey}
              onChange={setRangeKey}
              options={[
                { value: "3m", label: "3 mo" },
                { value: "6m", label: "6 mo" },
                { value: "12m", label: "12 mo" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {rangeKey === "custom" && (
              <div className="mt-3 flex gap-2">
                <label className="flex-1 text-xs text-muted">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-line bg-surface px-2 text-sm text-ink"
                  />
                </label>
                <label className="flex-1 text-xs text-muted">
                  To
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

          {/* Snapshot */}
          <Card className="grid grid-cols-3 gap-y-4 text-center">
            <Metric label="Cycles" value={`${report.cycleSummary.recordedCycles}`} />
            <Metric
              label="Avg length"
              value={
                report.cycleSummary.averageLengthDays != null
                  ? `${report.cycleSummary.averageLengthDays}d`
                  : "—"
              }
            />
            <Metric
              label="Variability"
              value={
                report.cycleSummary.variabilityDays != null
                  ? `±${report.cycleSummary.variabilityDays}d`
                  : "—"
              }
            />
            <Metric
              label="Typical pain"
              value={report.pain.typicalLevel != null ? `${report.pain.typicalLevel}/10` : "—"}
            />
            <Metric label="High-pain days" value={`${report.pain.highPainDays}`} />
            <Metric label="Heavy days" value={`${report.bleeding.heavyDays}`} />
          </Card>

          <Card inset>
            <p className="pm-label mb-2">Changes worth discussing</p>
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-ink">
              {report.changesToDiscuss.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setPreview(true)}>
              Preview report
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                saveReport(report);
              }}
            >
              Save to my reports
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              icon={gated ? <IconLock size={16} /> : <IconDownload size={18} />}
              onClick={() =>
                gated ? navigate("/profile/subscription") : setPrinting(true)
              }
            >
              Download PDF
            </Button>
            <Button
              variant="quiet"
              icon={gated ? <IconLock size={16} /> : <IconShare size={18} />}
              onClick={() => (gated ? navigate("/profile/subscription") : share())}
            >
              Share
            </Button>
          </div>
          {gated && (
            <p className="text-center text-xs text-muted">
              Professional PDF export and sharing are part of Premium. Preview is
              always free.
            </p>
          )}

          <p className="text-xs leading-relaxed text-faint">{brand.reportAttribution} {brand.reportDisclaimer}</p>
        </Stack>
      </Screen>

      {/* Full preview */}
      <Sheet open={preview} onClose={() => setPreview(false)} title="Report preview">
        <div className="-mx-2 rounded-xl bg-white shadow-inner">
          <ReportDocument report={report} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            block
            icon={gated ? <IconLock size={16} /> : <IconDownload size={18} />}
            onClick={() => {
              setPreview(false);
              gated ? navigate("/profile/subscription") : setPrinting(true);
            }}
          >
            {gated ? "Premium to download" : "Download PDF"}
          </Button>
        </div>
      </Sheet>

      {/* Share fallback */}
      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Share report">
        <div className="space-y-3">
          <p className="text-sm text-muted">
            In the prototype, sharing creates a revocable link record you can
            manage in the Privacy Center. No file leaves your device.
          </p>
          <Button
            block
            onClick={() => {
              addSharedReport({
                id: uid("grant"),
                reportId: report.id,
                createdAt: new Date().toISOString(),
                label: `${brand.reportName} · ${range.label}`,
                revoked: false,
              });
              setShareOpen(false);
            }}
          >
            Create shareable link
          </Button>
          <p className="text-xs text-faint">
            Manage or revoke shared reports under Profile → Data &amp; Privacy.
          </p>
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
      <p className="font-display text-xl text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
