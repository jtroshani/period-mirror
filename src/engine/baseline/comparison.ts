/**
 * "This cycle vs. your usual" — builds MetricComparison rows from the current
 * cycle's recorded data against the PersonalBaseline. Still transparent stats;
 * still no diagnosis. `explanation` always states the exact numbers used.
 */

import type {
  Cycle,
  ComparisonConfidence,
  ComparisonDirection,
  DailyHealthEntry,
  DeviationSeverity,
  IsoDate,
  MetricComparison,
  MetricSummary,
  PersonalBaseline,
  User,
} from "@/models";
import { formatHours } from "@/utils/format";
import { mean, percentChange, round } from "@/utils/statistics";
import {
  completedCycles,
  cycleDayOf,
  deriveCycles,
  entriesForCycle,
  isBleedingDay,
} from "@/engine/cycles";

interface Thresholds {
  slight: number;
  notable: number;
  marked: number;
}

function confidenceFrom(n: number): ComparisonConfidence {
  if (n < 2) return "insufficient";
  if (n === 2) return "low";
  if (n === 3) return "moderate";
  return "high";
}

function severityFrom(absDiff: number, t: Thresholds): DeviationSeverity {
  if (absDiff >= t.marked) return "marked";
  if (absDiff >= t.notable) return "notable";
  if (absDiff >= t.slight) return "slight";
  return "none";
}

function directionFrom(
  current: number,
  baseline: number,
  slight: number,
): ComparisonDirection {
  const diff = current - baseline;
  if (Math.abs(diff) < slight) return "similar";
  return diff > 0 ? "higher" : "lower";
}

interface BuildArgs {
  id: string;
  metric: string;
  label: string;
  unit?: string;
  current: number | null;
  baseline: MetricSummary;
  thresholds: Thresholds;
  betterWhenLower?: boolean;
  format?: (v: number) => string;
  explain: (current: number, baselineMean: number, n: number) => string;
  insufficientExplain: (n: number) => string;
}

function build(args: BuildArgs): MetricComparison {
  const { baseline, thresholds } = args;
  const n = baseline.n;
  const confidence = confidenceFrom(n);

  if (args.current == null || confidence === "insufficient") {
    return {
      id: args.id,
      metric: args.metric,
      label: args.label,
      unit: args.unit,
      currentValue: args.current,
      baselineValue: n > 0 ? baseline.mean : null,
      absoluteDifference: null,
      percentageDifference: null,
      direction: "unknown",
      confidence: "insufficient",
      severity: "none",
      basisCycles: n,
      explanation: args.insufficientExplain(n),
      betterWhenLower: args.betterWhenLower,
    };
  }

  const current = args.current;
  const base = baseline.mean;
  const absDiff = round(current - base, 2);
  const severity = severityFrom(Math.abs(absDiff), thresholds);
  const direction = directionFrom(current, base, thresholds.slight);

  return {
    id: args.id,
    metric: args.metric,
    label: args.label,
    unit: args.unit,
    currentValue: round(current, 2),
    baselineValue: round(base, 2),
    absoluteDifference: absDiff,
    percentageDifference: percentChange(current, base),
    direction,
    confidence,
    severity: direction === "similar" ? "none" : severity,
    basisCycles: n,
    explanation: args.explain(current, base, n),
    betterWhenLower: args.betterWhenLower,
  };
}

/**
 * @param entries all recorded days
 * @param baseline output of buildBaseline (already excludes the current cycle
 *   because it only analyses completed cycles)
 */
export function compareCurrentCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  _user: User | null,
  baseline: PersonalBaseline,
): MetricComparison[] {
  const cycles = deriveCycles(entries);
  if (cycles.length === 0) return [];
  const currentCycle = cycles[cycles.length - 1];
  const currentEntries = entriesForCycle(entries, currentCycle);

  const out: MetricComparison[] = [];

  // 1) Day 1–3 pain — the headline "Me vs. Me" metric.
  const earlyPainVals = currentEntries
    .filter((e) => {
      const d = cycleDayOf(currentCycle, e.date);
      return d >= 1 && d <= 3 && e.pain?.level != null;
    })
    .map((e) => e.pain!.level);
  out.push(
    build({
      id: "cmp_early_pain",
      metric: "early_period_pain",
      label: "Pain during this period",
      unit: "/10",
      current: earlyPainVals.length ? round(mean(earlyPainVals), 1) : null,
      baseline: baseline.earlyPeriodPain,
      thresholds: { slight: 0.8, notable: 1.5, marked: 2.5 },
      betterWhenLower: true,
      format: (v) => `${round(v, 1)}/10`,
      explain: (c, b, n) =>
        `Across your previous ${n} cycles, your average recorded pain during Days 1–3 was ${round(
          b,
          1,
        )}/10. During this cycle, the average of the Days 1–3 you recorded is ${round(c, 1)}/10.`,
      insufficientExplain: (n) =>
        `We have Day 1–3 pain for ${n} earlier ${
          n === 1 ? "cycle" : "cycles"
        }. Two or more are needed before comparing this reliably.`,
    }),
  );

  // 2) Sleep during period nights.
  const sleepVals = currentEntries
    .filter((e) => isBleedingDay(e) && e.sleep?.hours != null)
    .map((e) => e.sleep!.hours!);
  out.push(
    build({
      id: "cmp_period_sleep",
      metric: "period_sleep",
      label: "Sleep during your period",
      current: sleepVals.length ? round(mean(sleepVals), 2) : null,
      baseline: baseline.periodSleep,
      thresholds: { slight: 0.25, notable: 0.5, marked: 0.75 },
      format: (v) => formatHours(v),
      explain: (c, b, n) =>
        `Your period-night sleep across your last ${n} cycles averaged ${formatHours(
          b,
        )}. This cycle it is averaging ${formatHours(c)}.`,
      insufficientExplain: (n) =>
        `Sleep on period nights is recorded for ${n} earlier ${
          n === 1 ? "cycle" : "cycles"
        } so far — a little more history is needed here.`,
    }),
  );

  // 3) Overall energy this cycle.
  const energyVals = currentEntries
    .filter((e) => e.energy?.level != null)
    .map((e) => e.energy!.level);
  out.push(
    build({
      id: "cmp_energy",
      metric: "energy",
      label: "Energy this cycle",
      unit: "/5",
      current: energyVals.length ? round(mean(energyVals), 1) : null,
      baseline: baseline.energyOverall,
      thresholds: { slight: 0.3, notable: 0.6, marked: 1.0 },
      betterWhenLower: false,
      format: (v) => `${round(v, 1)}/5`,
      explain: (c, b, n) =>
        `Your typical recorded energy is ${round(b, 1)}/5 (from ${n} cycles of data). This cycle you are averaging ${round(
          c,
          1,
        )}/5.`,
      insufficientExplain: () =>
        `We need a bit more energy history before this comparison is meaningful.`,
    }),
  );

  // 4) Heavy-bleeding days this cycle.
  const heavyDays = currentEntries.filter((e) => e.bleeding?.level === "heavy").length;
  const anyBleedingRecorded = currentEntries.some(isBleedingDay);
  out.push(
    build({
      id: "cmp_heavy_days",
      metric: "heavy_days",
      label: "Heavy days this period",
      unit: " days",
      current: anyBleedingRecorded ? heavyDays : null,
      baseline: baseline.heavyDaysPerCycle,
      thresholds: { slight: 0.6, notable: 1.2, marked: 2 },
      betterWhenLower: true,
      format: (v) => `${round(v, 1)} ${round(v, 1) === 1 ? "day" : "days"}`,
      explain: (c, b, n) =>
        `Your last ${n} cycles had on average ${round(
          b,
          1,
        )} day(s) recorded as heavy. This cycle you have recorded ${round(c, 0)} so far.`,
      insufficientExplain: () =>
        `Heavy-day counts need a couple more recorded cycles before comparing.`,
    }),
  );

  // 5) Length of the most recent COMPLETED cycle vs the ones before it.
  const done = completedCycles(cycles);
  if (done.length >= 3) {
    const lastCompleted = done[done.length - 1];
    const priorLengths = done.slice(0, -1).map((c) => c.lengthDays!);
    out.push(
      buildCycleLength(lastCompleted, priorLengths),
    );
  }

  return out;
}

function buildCycleLength(last: Cycle, priorLengths: number[]): MetricComparison {
  const priorMean = mean(priorLengths);
  return build({
    id: "cmp_cycle_length",
    metric: "cycle_length",
    label: "Most recent cycle length",
    unit: " days",
    current: last.lengthDays ?? null,
    baseline: {
      n: priorLengths.length,
      mean: priorMean,
      median: priorMean,
      sd: 0,
      min: Math.min(...priorLengths),
      max: Math.max(...priorLengths),
    },
    thresholds: { slight: 1.5, notable: 2.5, marked: 4 },
    format: (v) => `${round(v, 0)} days`,
    explain: (c, b, n) =>
      `Your previous ${n} cycles averaged ${round(b, 1)} days. Your most recent completed cycle was ${round(
        c,
        0,
      )} days.`,
    insufficientExplain: () =>
      `At least three completed cycles are needed before comparing cycle length.`,
  });
}
