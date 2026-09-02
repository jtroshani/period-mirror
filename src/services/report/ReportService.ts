/**
 * Health Report generation. Produces a doctor-friendly one-page summary of
 * recorded information + neutral "changes worth discussing". Never diagnostic.
 *
 * This is a service (not a component) so the same output could feed a PDF
 * renderer, an email, or a clinician API later.
 */

import type {
  DailyHealthEntry,
  HealthReport,
  IsoDate,
  ReportRangeKey,
  ReportSignal,
  ReportTimelineEntry,
  User,
  VitalType,
} from "@/models";
import { brand } from "@/branding/brand";
import { addMonths, formatLongDate, todayIso } from "@/utils/date";
import { label } from "@/utils/format";
import { mean, median, round, stdDev } from "@/utils/statistics";
import { uid } from "@/utils/id";
import {
  completedCycles,
  cycleDayOf,
  deriveCycles,
  entriesForCycle,
} from "@/engine/cycles";
import { buildBaseline } from "@/engine/baseline/baselineEngine";
import { compareCurrentCycle } from "@/engine/baseline/comparison";
import { buildInsights } from "@/engine/insights/insightEngine";

export interface ReportRange {
  key: ReportRangeKey;
  from: IsoDate;
  to: IsoDate;
  label: string;
}

export function resolveRange(key: ReportRangeKey, custom?: { from: IsoDate; to: IsoDate }): ReportRange {
  const to = custom?.to ?? todayIso();
  if (key === "custom" && custom) {
    return { key, from: custom.from, to, label: `${formatLongDate(custom.from)} – ${formatLongDate(to)}` };
  }
  const months = key === "3m" ? 3 : key === "12m" ? 12 : 6;
  return {
    key,
    from: addMonths(to, -months),
    to,
    label: `Last ${months} months`,
  };
}

function trendWord(values: number[], invert = false): string {
  if (values.length < 4) return "Not enough data for a trend";
  const half = Math.floor(values.length / 2);
  const first = mean(values.slice(0, half));
  const second = mean(values.slice(half));
  const delta = second - first;
  const sig = Math.abs(delta) < 0.15 * (Math.abs(first) || 1);
  if (sig) return "Broadly stable";
  const up = delta > 0;
  const word = (up ? "higher" : "lower") + " in the more recent half";
  return invert ? `Slightly ${up ? "lower" : "higher"} in the more recent half` : `Slightly ${word}`;
}

function vitalSignal(
  entriesInRange: DailyHealthEntry[],
  type: VitalType,
  unit: string,
): ReportSignal | null {
  const readings = entriesInRange
    .flatMap((e) => e.vitals)
    .filter((v) => v.type === type);
  if (readings.length < 3) return null;
  const values = readings.map((v) => v.value);
  const avg = round(mean(values), type === "body_temp" ? 2 : 0);
  return {
    label: label(type),
    value: `${avg} ${unit}`,
    trend: trendWord(values),
    source: readings[0].source === "wearable" || readings[0].source === "demo_wearable"
      ? "Connected device (sample)"
      : "Recorded",
  };
}

export function generateReport(
  entries: Record<IsoDate, DailyHealthEntry>,
  user: User | null,
  range: ReportRange,
): HealthReport {
  const inRange = Object.values(entries)
    .filter((e) => e.date >= range.from && e.date <= range.to)
    .sort((a, b) => a.date.localeCompare(b.date));

  const allCycles = deriveCycles(entries);
  const cyclesInRange = allCycles.filter(
    (c) => c.startDate >= range.from && c.startDate <= range.to,
  );
  const doneInRange = completedCycles(cyclesInRange);

  const lengths = doneInRange.map((c) => c.lengthDays!);
  const periodDurations = cyclesInRange
    .map((c) => c.periodLengthDays)
    .filter((v): v is number => v != null);

  // --- Pain ---
  const painValues = inRange.filter((e) => e.pain?.level != null).map((e) => e.pain!.level);
  const perCycleEarlyPain = doneInRange
    .map((cycle) => {
      const v = entriesForCycle(entries, cycle)
        .filter((e) => {
          const d = cycleDayOf(cycle, e.date);
          return d <= 3 && e.pain?.level != null;
        })
        .map((e) => e.pain!.level);
      return v.length ? mean(v) : NaN;
    })
    .filter(Number.isFinite);

  // --- Bleeding ---
  const heavyDays = inRange.filter((e) => e.bleeding?.level === "heavy").length;
  const bleedingRecorded = inRange.some(
    (e) => e.bleeding && e.bleeding.level !== "none",
  );

  // --- Symptoms ---
  const symptomCount: Record<string, number> = {};
  for (const e of inRange) {
    for (const s of e.symptoms) {
      const key = s.type === "other" && s.label ? s.label : s.type;
      symptomCount[key] = (symptomCount[key] ?? 0) + 1;
    }
  }
  const symptoms = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, n]) => ({ label: label(k), daysLogged: n }));

  // --- Energy / sleep ---
  const energyValues = inRange.filter((e) => e.energy?.level != null).map((e) => e.energy!.level);
  const sleepValues = inRange.filter((e) => e.sleep?.hours != null).map((e) => e.sleep!.hours!);

  // --- Changes worth discussing (neutral, from the insight engine) ---
  const baseline = buildBaseline(entries, user);
  const comparisons = compareCurrentCycle(entries, user, baseline);
  const insights = buildInsights(comparisons, baseline);
  const changesToDiscuss = insights
    .filter((i) => i.category === "NOTICE" || i.category === "TREND")
    .map((i) => i.summary);
  if (changesToDiscuss.length === 0) {
    changesToDiscuss.push(
      "No changes stood out against this person's own recent history for the selected period.",
    );
  }

  // --- Timeline ---
  const timeline: ReportTimelineEntry[] = doneInRange.map((cycle) => {
    const cycleEntries = entriesForCycle(entries, cycle);
    const pains = cycleEntries.filter((e) => e.pain?.level != null).map((e) => e.pain!.level);
    const heavy = cycleEntries.filter((e) => e.bleeding?.level === "heavy").length;
    const markers: string[] = [];
    if (heavy >= 2) markers.push(`${heavy} heavy days`);
    if (pains.length && Math.max(...pains) >= 7) markers.push("High pain recorded");
    return {
      cycleOrdinal: cycle.ordinal,
      startDate: cycle.startDate,
      lengthDays: cycle.lengthDays,
      periodLengthDays: cycle.periodLengthDays,
      peakPain: pains.length ? Math.max(...pains) : undefined,
      markers,
    };
  });

  // --- Other signals ---
  const otherSignals = [
    vitalSignal(inRange, "resting_hr", "bpm"),
    vitalSignal(inRange, "hrv", "ms"),
    vitalSignal(inRange, "body_temp", "°C"),
    vitalSignal(inRange, "weight", "kg"),
  ].filter((s): s is ReportSignal => s !== null);

  return {
    id: uid("report"),
    generatedAt: new Date().toISOString(),
    range: { from: range.from, to: range.to, label: range.label },
    subjectLabel: user?.isDemo
      ? "Demo profile — fictional data"
      : user?.displayName || "Not specified",
    cycleSummary: {
      recordedCycles: doneInRange.length,
      averageLengthDays: lengths.length ? round(mean(lengths), 1) : null,
      shortestLengthDays: lengths.length ? Math.min(...lengths) : null,
      longestLengthDays: lengths.length ? Math.max(...lengths) : null,
      variabilityDays: lengths.length >= 2 ? round(stdDev(lengths), 1) : null,
      averagePeriodDurationDays: periodDurations.length
        ? round(mean(periodDurations), 1)
        : null,
    },
    pain: {
      typicalLevel: painValues.length ? round(median(painValues), 1) : null,
      highestRecorded: painValues.length ? Math.max(...painValues) : null,
      highPainDays: painValues.filter((p) => p >= 7).length,
      trend: trendWord(perCycleEarlyPain),
    },
    bleeding: {
      recorded: bleedingRecorded,
      typicalPattern: periodDurations.length
        ? `About ${round(mean(periodDurations), 0)} days per period`
        : "Not enough recorded",
      heavyDays,
      changeNote:
        heavyDays > 0
          ? `${heavyDays} day(s) recorded as heavy across the period.`
          : "No days recorded as heavy across the period.",
    },
    symptoms,
    energy: {
      average: energyValues.length ? round(mean(energyValues), 1) : null,
      trend: trendWord(energyValues),
    },
    sleep: {
      averageHours: sleepValues.length ? round(mean(sleepValues), 2) : null,
      trend: trendWord(sleepValues),
    },
    otherSignals,
    changesToDiscuss,
    timeline,
    disclaimer: brand.reportDisclaimer,
  };
}
