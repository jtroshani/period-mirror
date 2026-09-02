/**
 * Personal Baseline Engine — "what is usual for THIS person".
 *
 * Transparent statistics only (mean / median / SD / least-squares slope).
 * No population comparison, no risk score, no diagnosis. Every number it
 * produces can be traced back to recorded entries and explained to the user.
 */

import type {
  BaselineReadiness,
  BaselineTrend,
  BleedingLevel,
  Cycle,
  CyclePhase,
  DailyHealthEntry,
  IsoDate,
  PersonalBaseline,
  SymptomFrequency,
  SymptomType,
  User,
} from "@/models";
import { label } from "@/utils/format";
import {
  linearSlope,
  mean,
  round,
  summarize,
} from "@/utils/statistics";
import {
  CYCLES_FOR_READY_BASELINE,
  averageCycleLength,
  completedCycles,
  cycleDayOf,
  deriveCycles,
  entriesForCycle,
  getCyclePosition,
  isBleedingDay,
} from "@/engine/cycles";

const EMPTY_SUMMARY = { n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 };
const BLEEDING_LEVELS: BleedingLevel[] = ["none", "spotting", "light", "medium", "heavy"];

function readiness(cyclesHave: number): BaselineReadiness {
  const progress = Math.min(cyclesHave / CYCLES_FOR_READY_BASELINE, 1);
  if (cyclesHave >= CYCLES_FOR_READY_BASELINE) {
    return {
      level: "ready",
      cyclesHave,
      cyclesNeeded: CYCLES_FOR_READY_BASELINE,
      progress,
      message:
        "Your Mirror is ready. Comparisons now use a stable picture of your usual pattern.",
    };
  }
  if (cyclesHave === 3) {
    return {
      level: "improving",
      cyclesHave,
      cyclesNeeded: CYCLES_FOR_READY_BASELINE,
      progress,
      message:
        "Your personal baseline is becoming more useful. One more cycle and comparisons will be solid.",
    };
  }
  if (cyclesHave === 2) {
    return {
      level: "learning",
      cyclesHave,
      cyclesNeeded: CYCLES_FOR_READY_BASELINE,
      progress,
      message:
        "We're beginning to understand your patterns. A couple more cycles will sharpen this.",
    };
  }
  return {
    level: "starting",
    cyclesHave,
    cyclesNeeded: CYCLES_FOR_READY_BASELINE,
    progress,
    message:
      "Your first cycle gives us a starting point. Keep logging and your Mirror will take shape.",
  };
}

function earlyPeriodPainPerCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  cycles: Cycle[],
): number[] {
  return cycles
    .map((cycle) => {
      const vals = entriesForCycle(entries, cycle)
        .filter((e) => {
          const d = cycleDayOf(cycle, e.date);
          return d >= 1 && d <= 3 && e.pain?.level != null;
        })
        .map((e) => e.pain!.level);
      return vals.length ? mean(vals) : NaN;
    })
    .filter((v) => Number.isFinite(v));
}

function periodSleepPerCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  cycles: Cycle[],
): number[] {
  return cycles
    .map((cycle) => {
      const vals = entriesForCycle(entries, cycle)
        .filter((e) => isBleedingDay(e) && e.sleep?.hours != null)
        .map((e) => e.sleep!.hours!);
      return vals.length ? mean(vals) : NaN;
    })
    .filter((v) => Number.isFinite(v));
}

function energyPerCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  cycles: Cycle[],
): number[] {
  return cycles
    .map((cycle) => {
      const vals = entriesForCycle(entries, cycle)
        .filter((e) => e.energy?.level != null)
        .map((e) => e.energy!.level);
      return vals.length ? mean(vals) : NaN;
    })
    .filter((v) => Number.isFinite(v));
}

function heavyDaysPerCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  cycles: Cycle[],
): number[] {
  return cycles.map(
    (cycle) =>
      entriesForCycle(entries, cycle).filter((e) => e.bleeding?.level === "heavy")
        .length,
  );
}

function buildTrends(
  cycleLengths: number[],
  earlyPain: number[],
  periodSleep: number[],
  energy: number[],
): BaselineTrend[] {
  const trends: BaselineTrend[] = [];
  const window = 4;

  const check = (
    metric: BaselineTrend["metric"],
    values: number[],
    unitLabel: string,
    threshold: number,
    verb: { up: string; down: string },
  ) => {
    const recent = values.slice(-window);
    if (recent.length < 3) return;
    const slope = linearSlope(
      recent.map((_, i) => i),
      recent,
    );
    if (Math.abs(slope) < threshold) return;
    const direction = slope > 0 ? "increasing" : "decreasing";
    const changePerCycle = round(Math.abs(slope), 2);
    const totalChange = round(Math.abs(slope) * (recent.length - 1), 1);
    trends.push({
      id: `trend_${metric}`,
      metric,
      label: label(metric),
      direction,
      changePerCycle,
      windowCycles: recent.length,
      summary: `Over your last ${recent.length} recorded cycles, ${unitLabel} has ${
        direction === "increasing" ? verb.up : verb.down
      } by about ${totalChange} ${
        metric === "period_sleep" ? "hours" : metric === "cycle_length" ? "days" : "points"
      } in total.`,
    });
  };

  check("cycle_length", cycleLengths, "your cycle length", 0.4, {
    up: "gradually increased",
    down: "gradually decreased",
  });
  check("early_period_pain", earlyPain, "your Day 1–3 pain", 0.3, {
    up: "gradually increased",
    down: "gradually eased",
  });
  check("period_sleep", periodSleep, "your sleep during your period", 0.12, {
    up: "gradually increased",
    down: "gradually decreased",
  });
  check("energy", energy, "your average energy", 0.15, {
    up: "gradually increased",
    down: "gradually decreased",
  });

  return trends;
}

export function buildBaseline(
  entries: Record<IsoDate, DailyHealthEntry>,
  user: User | null,
): PersonalBaseline {
  const allCycles = deriveCycles(entries);
  const done = completedCycles(allCycles);
  const analysisCycles = done.slice(-6);

  // Pain by cycle day (across analysis cycles).
  const painByDayBuckets: Record<number, number[]> = {};
  const phaseSleepBuckets: Partial<Record<CyclePhase, number[]>> = {};
  const symptomDayCount: Partial<Record<SymptomType, number>> = {};
  const symptomCycleCount: Partial<Record<SymptomType, Set<string>>> = {};
  const bleedingCount: Record<BleedingLevel, number> = {
    none: 0, spotting: 0, light: 0, medium: 0, heavy: 0,
  };
  const allEnergy: number[] = [];

  for (const cycle of analysisCycles) {
    for (const e of entriesForCycle(entries, cycle)) {
      const d = cycleDayOf(cycle, e.date);
      if (e.pain?.level != null && d >= 1 && d <= 40) {
        (painByDayBuckets[d] ??= []).push(e.pain.level);
      }
      if (e.energy?.level != null) allEnergy.push(e.energy.level);
      if (e.sleep?.hours != null) {
        const pos = getCyclePosition(entries, user, e.date);
        if (pos) (phaseSleepBuckets[pos.phase] ??= []).push(e.sleep.hours);
      }
      for (const s of e.symptoms) {
        symptomDayCount[s.type] = (symptomDayCount[s.type] ?? 0) + 1;
        (symptomCycleCount[s.type] ??= new Set()).add(cycle.id);
      }
      if (isBleedingDay(e) && e.bleeding) bleedingCount[e.bleeding.level] += 1;
    }
  }

  const painByCycleDay: Record<number, number> = {};
  for (const [day, vals] of Object.entries(painByDayBuckets)) {
    painByCycleDay[Number(day)] = round(mean(vals), 1);
  }

  const sleepByPhase: Partial<Record<CyclePhase, number>> = {};
  for (const [phase, vals] of Object.entries(phaseSleepBuckets)) {
    if (vals && vals.length) sleepByPhase[phase as CyclePhase] = round(mean(vals), 2);
  }

  const totalBleedingDays =
    BLEEDING_LEVELS.reduce((acc, l) => acc + bleedingCount[l], 0) || 1;
  const bleedingDistribution = BLEEDING_LEVELS.reduce(
    (acc, l) => {
      acc[l] = round(bleedingCount[l] / totalBleedingDays, 3);
      return acc;
    },
    {} as Record<BleedingLevel, number>,
  );

  const symptomFrequency: SymptomFrequency[] = Object.entries(symptomDayCount)
    .map(([type, occ]) => ({
      type: type as SymptomType,
      label: label(type as SymptomType),
      occurrences: occ ?? 0,
      cyclesWithSymptom: symptomCycleCount[type as SymptomType]?.size ?? 0,
      ratePerCycle: analysisCycles.length
        ? round((occ ?? 0) / analysisCycles.length, 2)
        : 0,
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 8);

  const cycleLengths = analysisCycles.map((c) => c.lengthDays!);
  const periodDurations = analysisCycles
    .map((c) => c.periodLengthDays)
    .filter((v): v is number => v != null);
  const earlyPain = earlyPeriodPainPerCycle(entries, analysisCycles);
  const periodSleep = periodSleepPerCycle(entries, analysisCycles);
  const energyByCycle = energyPerCycle(entries, analysisCycles);
  const heavyDays = heavyDaysPerCycle(entries, analysisCycles);

  const daysOfData = Object.keys(entries).length;

  return {
    generatedAt: new Date().toISOString(),
    cyclesAnalyzed: analysisCycles.length,
    daysOfData,
    readiness: readiness(done.length),
    cycleLength: cycleLengths.length ? summarize(cycleLengths) : { ...EMPTY_SUMMARY },
    periodDuration: periodDurations.length
      ? summarize(periodDurations)
      : { ...EMPTY_SUMMARY },
    painByCycleDay,
    earlyPeriodPain: earlyPain.length ? summarize(earlyPain) : { ...EMPTY_SUMMARY },
    sleepByPhase,
    periodSleep: periodSleep.length ? summarize(periodSleep) : { ...EMPTY_SUMMARY },
    energyOverall: allEnergy.length ? summarize(allEnergy) : { ...EMPTY_SUMMARY },
    symptomFrequency,
    bleedingDistribution,
    heavyDaysPerCycle: heavyDays.length ? summarize(heavyDays) : { ...EMPTY_SUMMARY },
    trends: buildTrends(cycleLengths, earlyPain, periodSleep, energyByCycle),
  };
}

/** Convenience for screens that only need the "typical variation" numbers. */
export function typicalVariationDays(baseline: PersonalBaseline): number {
  return round(baseline.cycleLength.sd || 0, 1);
}

export { averageCycleLength };
