import type { DeviationSeverity } from "@/models";

interface ComparisonBarProps {
  currentLabel: string;
  usualLabel: string;
  current: number;
  usual: number;
  /** Upper bound of the scale (e.g. 10 for pain). */
  scaleMax: number;
  severity: DeviationSeverity;
}

const SEVERITY_TONE: Record<DeviationSeverity, string> = {
  none: "bg-normal",
  slight: "bg-notice/70",
  notable: "bg-notice",
  marked: "bg-notice",
};

/**
 * Two stacked horizontal bars — "this cycle" vs "your usual". Deliberately
 * understated: deviations use amber, never red. Values are always shown as text
 * so meaning never depends on colour.
 */
export function ComparisonBar({
  currentLabel,
  usualLabel,
  current,
  usual,
  scaleMax,
  severity,
}: ComparisonBarProps) {
  const pct = (v: number) => `${Math.max(2, Math.min(100, (v / scaleMax) * 100))}%`;
  return (
    <div className="space-y-2.5">
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-ink">This cycle</span>
          <span className="font-semibold text-ink">{currentLabel}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div className={`h-full rounded-full ${SEVERITY_TONE[severity]}`} style={{ width: pct(current) }} />
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted">Your usual</span>
          <span className="font-medium text-muted">{usualLabel}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-faint/50" style={{ width: pct(usual) }} />
        </div>
      </div>
    </div>
  );
}
