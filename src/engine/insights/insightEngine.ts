/**
 * Insight system — converts MetricComparison rows + baseline trends into
 * user-facing PatternInsights with categories NORMAL / NOTICE / TREND /
 * INSUFFICIENT_DATA.
 *
 * Language rules (enforced here):
 *  - never diagnostic, never alarming
 *  - "different from your usual", "trend", "change", "consider discussing"
 *  - every insight can explain itself via `detail` + `evidence`
 */

import type {
  BaselineTrend,
  InsightCategory,
  InsightEvidenceRow,
  MetricComparison,
  PatternInsight,
  PersonalBaseline,
} from "@/models";
import { formatHours, formatPercent } from "@/utils/format";
import { round } from "@/utils/statistics";

const CONSIDER_DISCUSSING =
  "If this change continues, becomes severe, or concerns you, consider discussing it with a healthcare professional.";

const SEVERITY_RANK: Record<string, number> = {
  marked: 0,
  notable: 1,
  slight: 2,
  none: 3,
};
const CATEGORY_RANK: Record<InsightCategory, number> = {
  NOTICE: 0,
  TREND: 1,
  NORMAL: 2,
  INSUFFICIENT_DATA: 3,
};

function fmtValue(cmp: MetricComparison, value: number | null): string {
  if (value == null) return "—";
  if (cmp.metric === "period_sleep") return formatHours(value);
  if (cmp.unit === "/10" || cmp.unit === "/5") return `${round(value, 1)}${cmp.unit}`;
  if (cmp.unit) return `${round(value, cmp.metric === "cycle_length" ? 0 : 1)}${cmp.unit}`;
  return `${round(value, 1)}`;
}

function evidenceFor(cmp: MetricComparison): InsightEvidenceRow[] {
  const rows: InsightEvidenceRow[] = [
    { label: "This cycle", value: fmtValue(cmp, cmp.currentValue) },
    { label: "Your usual", value: fmtValue(cmp, cmp.baselineValue) },
  ];
  if (cmp.percentageDifference != null) {
    rows.push({ label: "Difference", value: formatPercent(cmp.percentageDifference) });
  }
  rows.push({
    label: "Based on",
    value: `${cmp.basisCycles} previous ${cmp.basisCycles === 1 ? "cycle" : "cycles"}`,
  });
  return rows;
}

function directionWord(cmp: MetricComparison): string {
  if (cmp.direction === "higher") return "higher than";
  if (cmp.direction === "lower") return "lower than";
  return "close to";
}

function noticeSummary(cmp: MetricComparison): string {
  const dir = directionWord(cmp);
  switch (cmp.metric) {
    case "early_period_pain":
      return `Your recorded pain during the first days of this period is ${dir} your recent pattern.`;
    case "period_sleep":
      return `Your sleep during this period has been ${dir} your recent average.`;
    case "energy":
      return `Your recorded energy this cycle is ${dir} your usual level.`;
    case "heavy_days":
      return `You've recorded more days as heavy this period than your recent cycles.`;
    case "cycle_length":
      return `Your most recent cycle was ${dir} your recent average length.`;
    default:
      return `This is ${dir} your usual pattern.`;
  }
}

function comparisonToInsight(cmp: MetricComparison): PatternInsight {
  const generatedAt = new Date().toISOString();
  const evidence = evidenceFor(cmp);

  if (cmp.confidence === "insufficient") {
    return {
      id: `insight_${cmp.id}`,
      category: "INSUFFICIENT_DATA",
      title: `Still learning your ${cmp.label.toLowerCase()}`,
      summary: "We need a little more history before comparing this reliably.",
      detail: cmp.explanation,
      evidence: evidence.filter((r) => r.label === "Based on"),
      metric: cmp.metric,
      generatedAt,
      severity: "none",
    };
  }

  if (cmp.direction === "similar" || cmp.severity === "none") {
    return {
      id: `insight_${cmp.id}`,
      category: "NORMAL",
      title: `${cmp.label} is within your usual range`,
      summary: noticeSummary(cmp),
      detail: cmp.explanation,
      evidence,
      metric: cmp.metric,
      generatedAt,
      severity: "none",
    };
  }

  const guidanceMetrics = ["early_period_pain", "heavy_days", "cycle_length"];
  return {
    id: `insight_${cmp.id}`,
    category: "NOTICE",
    title: `Different from your usual — ${cmp.label.toLowerCase()}`,
    summary: noticeSummary(cmp),
    detail: cmp.explanation,
    evidence,
    guidance: guidanceMetrics.includes(cmp.metric) ? CONSIDER_DISCUSSING : undefined,
    metric: cmp.metric,
    generatedAt,
    severity: cmp.severity,
  };
}

function trendToInsight(trend: BaselineTrend): PatternInsight {
  const guidanceMetrics = ["cycle_length", "early_period_pain"];
  return {
    id: `insight_${trend.id}`,
    category: "TREND",
    title: `A trend in ${trend.label.toLowerCase()}`,
    summary: trend.summary,
    detail: `${trend.summary} This is measured as a least-squares trend line across your last ${trend.windowCycles} recorded cycles (about ${trend.changePerCycle} per cycle).`,
    evidence: [
      { label: "Direction", value: trend.direction === "increasing" ? "Gradually up" : "Gradually down" },
      { label: "Per cycle", value: `${trend.changePerCycle}` },
      { label: "Window", value: `${trend.windowCycles} cycles` },
    ],
    guidance: guidanceMetrics.includes(trend.metric) ? CONSIDER_DISCUSSING : undefined,
    metric: trend.metric,
    generatedAt: new Date().toISOString(),
    severity: "slight",
  };
}

export function buildInsights(
  comparisons: MetricComparison[],
  baseline: PersonalBaseline,
): PatternInsight[] {
  const fromComparisons = comparisons.map(comparisonToInsight);
  const trendMetrics = new Set(baseline.trends.map((t) => t.metric));
  // Avoid double-reporting: if a metric already has a NOTICE, keep the trend
  // too (they say different things) but drop a NORMAL when a trend exists.
  const filtered = fromComparisons.filter(
    (i) => !(i.category === "NORMAL" && trendMetrics.has(i.metric as BaselineTrend["metric"])),
  );
  const fromTrends = baseline.trends.map(trendToInsight);

  return [...filtered, ...fromTrends].sort((a, b) => {
    const byCat = CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category];
    if (byCat !== 0) return byCat;
    return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  });
}

/** One short line for the Today screen's "Today's Mirror" card. */
export function pickTodayInsight(insights: PatternInsight[]): PatternInsight | null {
  const notice = insights.find((i) => i.category === "NOTICE");
  if (notice) return notice;
  const trend = insights.find((i) => i.category === "TREND");
  if (trend) return trend;
  return insights.find((i) => i.category === "NORMAL") ?? insights[0] ?? null;
}

export { CONSIDER_DISCUSSING };
