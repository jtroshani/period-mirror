/**
 * Health Report generation. Produces a doctor-friendly one-page summary of
 * recorded information + neutral "changes worth discussing". Never diagnostic.
 *
 * Output text is localised via `lang` so the report can be handed to an
 * Italian clinician. Structure is otherwise language-independent.
 */

import type {
  DailyHealthEntry,
  HealthReport,
  IsoDate,
  Lang,
  ReportRangeKey,
  ReportSignal,
  ReportTimelineEntry,
  User,
  VitalType,
} from "@/models";
import { addMonths, todayIso } from "@/utils/date";
import { mean, median, round, stdDev } from "@/utils/statistics";
import { uid } from "@/utils/id";
import { translate } from "@/i18n/core";
import { fmtLongDate } from "@/i18n/format";
import { ageFromBirthYear } from "@/utils/age";
import { changesToDiscuss as buildChanges } from "@/i18n/copy";
import {
  completedCycles,
  cycleDayOf,
  deriveCycles,
  entriesForCycle,
} from "@/engine/cycles";
import { buildBaseline } from "@/engine/baseline/baselineEngine";
import { compareCurrentCycle } from "@/engine/baseline/comparison";

export interface ReportRange {
  key: ReportRangeKey;
  from: IsoDate;
  to: IsoDate;
  label: string;
}

export function resolveRange(
  key: ReportRangeKey,
  custom?: { from: IsoDate; to: IsoDate },
  lang: Lang = "en",
): ReportRange {
  const to = custom?.to ?? todayIso();
  if (key === "custom" && custom) {
    return {
      key,
      from: custom.from,
      to,
      label: `${fmtLongDate(lang, custom.from)} – ${fmtLongDate(lang, to)}`,
    };
  }
  const months = key === "3m" ? 3 : key === "12m" ? 12 : 6;
  return {
    key,
    from: addMonths(to, -months),
    to,
    label: translate(lang, "report.rangeLastMonths", { n: months }),
  };
}

function trendWord(lang: Lang, values: number[]): string {
  if (values.length < 4) return translate(lang, "trendWord.notEnough");
  const half = Math.floor(values.length / 2);
  const first = mean(values.slice(0, half));
  const second = mean(values.slice(half));
  const delta = second - first;
  if (Math.abs(delta) < 0.15 * (Math.abs(first) || 1)) return translate(lang, "trendWord.stable");
  return translate(lang, delta > 0 ? "trendWord.higherRecent" : "trendWord.lowerRecent");
}

function vitalSignal(
  lang: Lang,
  entriesInRange: DailyHealthEntry[],
  type: VitalType,
  unit: string,
): ReportSignal | null {
  const readings = entriesInRange.flatMap((e) => e.vitals).filter((v) => v.type === type);
  if (readings.length < 3) return null;
  const values = readings.map((v) => v.value);
  const avg = round(mean(values), type === "body_temp" ? 2 : 0);
  const src = readings[0].source;
  return {
    label: translate(lang, `enums.vital.${type}`),
    value: `${avg} ${unit}`,
    trend: trendWord(lang, values),
    source:
      src === "wearable" || src === "demo_wearable"
        ? translate(lang, "report.signalConnected")
        : translate(lang, "report.signalRecorded"),
  };
}

export function generateReport(
  entries: Record<IsoDate, DailyHealthEntry>,
  user: User | null,
  range: ReportRange,
  lang: Lang = "en",
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

  const painValues = inRange.filter((e) => e.pain?.level != null).map((e) => e.pain!.level);
  const perCycleEarlyPain = doneInRange
    .map((cycle) => {
      const v = entriesForCycle(entries, cycle)
        .filter((e) => cycleDayOf(cycle, e.date) <= 3 && e.pain?.level != null)
        .map((e) => e.pain!.level);
      return v.length ? mean(v) : NaN;
    })
    .filter(Number.isFinite);

  const heavyDays = inRange.filter((e) => e.bleeding?.level === "heavy").length;
  const bleedingRecorded = inRange.some((e) => e.bleeding && e.bleeding.level !== "none");

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
    .map(([k, n]) => ({
      label: translate(lang, `enums.symptom.${k}`) === `enums.symptom.${k}` ? k : translate(lang, `enums.symptom.${k}`),
      daysLogged: n,
    }));

  const energyValues = inRange.filter((e) => e.energy?.level != null).map((e) => e.energy!.level);
  const sleepValues = inRange.filter((e) => e.sleep?.hours != null).map((e) => e.sleep!.hours!);

  const baseline = buildBaseline(entries, user);
  const comparisons = compareCurrentCycle(entries, user, baseline);
  const changesToDiscuss = buildChanges(lang, comparisons, baseline.trends);

  const timeline: ReportTimelineEntry[] = doneInRange.map((cycle) => {
    const cycleEntries = entriesForCycle(entries, cycle);
    const pains = cycleEntries.filter((e) => e.pain?.level != null).map((e) => e.pain!.level);
    const heavy = cycleEntries.filter((e) => e.bleeding?.level === "heavy").length;
    const markers: string[] = [];
    if (heavy >= 2) markers.push(translate(lang, "report.tlHeavyDays", { n: heavy }));
    if (pains.length && Math.max(...pains) >= 7) markers.push(translate(lang, "report.tlHighPain"));
    return {
      cycleOrdinal: cycle.ordinal,
      startDate: cycle.startDate,
      lengthDays: cycle.lengthDays,
      periodLengthDays: cycle.periodLengthDays,
      peakPain: pains.length ? Math.max(...pains) : undefined,
      markers,
    };
  });

  const otherSignals = [
    vitalSignal(lang, inRange, "resting_hr", "bpm"),
    vitalSignal(lang, inRange, "hrv", "ms"),
    vitalSignal(lang, inRange, "body_temp", "°C"),
    vitalSignal(lang, inRange, "weight", "kg"),
  ].filter((s): s is ReportSignal => s !== null);

  return {
    id: uid("report"),
    generatedAt: new Date().toISOString(),
    range: { from: range.from, to: range.to, label: range.label },
    subjectLabel: user?.isDemo
      ? translate(lang, "report.subjectDemo")
      : user?.displayName || translate(lang, "report.subjectNone"),
    subjectAge: ageFromBirthYear(user?.birthYear),
    cycleSummary: {
      recordedCycles: doneInRange.length,
      averageLengthDays: lengths.length ? round(mean(lengths), 1) : null,
      shortestLengthDays: lengths.length ? Math.min(...lengths) : null,
      longestLengthDays: lengths.length ? Math.max(...lengths) : null,
      variabilityDays: lengths.length >= 2 ? round(stdDev(lengths), 1) : null,
      averagePeriodDurationDays: periodDurations.length ? round(mean(periodDurations), 1) : null,
    },
    pain: {
      typicalLevel: painValues.length ? round(median(painValues), 1) : null,
      highestRecorded: painValues.length ? Math.max(...painValues) : null,
      highPainDays: painValues.filter((p) => p >= 7).length,
      trend: trendWord(lang, perCycleEarlyPain),
    },
    bleeding: {
      recorded: bleedingRecorded,
      typicalPattern: periodDurations.length
        ? translate(lang, "report.aboutNDays", { n: round(mean(periodDurations), 0) })
        : translate(lang, "report.notEnoughRecorded"),
      heavyDays,
      changeNote: translate(
        lang,
        heavyDays > 0 ? "report.heavyChangeSome" : "report.heavyChangeNone",
        { n: heavyDays },
      ),
    },
    symptoms,
    energy: {
      average: energyValues.length ? round(mean(energyValues), 1) : null,
      trend: trendWord(lang, energyValues),
    },
    sleep: {
      averageHours: sleepValues.length ? round(mean(sleepValues), 2) : null,
      trend: trendWord(lang, sleepValues),
    },
    otherSignals,
    changesToDiscuss,
    timeline,
    disclaimer: translate(lang, "disclaimer.reportDisclaimer"),
  };
}
