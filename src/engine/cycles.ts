/**
 * Cycle derivation + prediction.
 *
 * Cycles are computed from recorded bleeding days rather than stored, so
 * editing history stays consistent. Pure functions only — no browser APIs —
 * so this ports directly to a native app.
 */

import type {
  Cycle,
  CyclePhase,
  CyclePosition,
  DailyHealthEntry,
  IsoDate,
  User,
} from "@/models";
import { addDays, daysBetween, todayIso } from "@/utils/date";
import { deterministicId } from "@/utils/id";
import { clamp, mean } from "@/utils/statistics";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
/** Completed cycles required before "Me vs. Me" comparisons are shown. */
export const CYCLES_FOR_READY_BASELINE = 4;

const BLEEDING_DAY = new Set(["spotting", "light", "medium", "heavy"]);

interface PeriodGroup {
  startDate: IsoDate;
  lastDate: IsoDate;
  bleedingDays: IsoDate[];
}

/** Ordered list of dates that have any bleeding recorded. */
export function bleedingDates(entries: Record<IsoDate, DailyHealthEntry>): IsoDate[] {
  return Object.values(entries)
    .filter((e) => e.bleeding && BLEEDING_DAY.has(e.bleeding.level))
    .map((e) => e.date)
    .sort();
}

/** Group bleeding days into periods, tolerating a single dry day mid-period. */
export function groupPeriods(dates: IsoDate[]): PeriodGroup[] {
  const groups: PeriodGroup[] = [];
  for (const date of dates) {
    const current = groups[groups.length - 1];
    if (
      current &&
      daysBetween(current.lastDate, date) <= 2 &&
      daysBetween(current.startDate, date) < 10
    ) {
      current.lastDate = date;
      current.bleedingDays.push(date);
    } else {
      groups.push({ startDate: date, lastDate: date, bleedingDays: [date] });
    }
  }
  return groups;
}

export function deriveCycles(
  entries: Record<IsoDate, DailyHealthEntry>,
): Cycle[] {
  const groups = groupPeriods(bleedingDates(entries));
  return groups.map((g, i) => {
    const next = groups[i + 1];
    const periodLengthDays = daysBetween(g.startDate, g.lastDate) + 1;
    if (next) {
      return {
        id: deterministicId("cycle", g.startDate),
        startDate: g.startDate,
        endDate: addDays(next.startDate, -1),
        lengthDays: daysBetween(g.startDate, next.startDate),
        periodLengthDays,
        isOngoing: false,
        ordinal: i + 1,
      } satisfies Cycle;
    }
    return {
      id: deterministicId("cycle", g.startDate),
      startDate: g.startDate,
      periodLengthDays,
      isOngoing: true,
      ordinal: i + 1,
    } satisfies Cycle;
  });
}

export function completedCycles(cycles: Cycle[]): Cycle[] {
  return cycles.filter((c) => !c.isOngoing && c.lengthDays != null);
}

/** Mean length of up to the last `window` completed cycles. */
export function averageCycleLength(cycles: Cycle[], user?: User | null, window = 6): number {
  const done = completedCycles(cycles).slice(-window);
  if (done.length === 0) {
    return user?.typicalCycleLengthDays ?? DEFAULT_CYCLE_LENGTH;
  }
  return mean(done.map((c) => c.lengthDays!));
}

export function averagePeriodLength(cycles: Cycle[], user?: User | null, window = 6): number {
  const done = cycles.filter((c) => c.periodLengthDays).slice(-window);
  if (done.length === 0) {
    return user?.typicalPeriodLengthDays ?? DEFAULT_PERIOD_LENGTH;
  }
  return mean(done.map((c) => c.periodLengthDays!));
}

export function entriesForCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  cycle: Cycle,
  fallbackLength = DEFAULT_CYCLE_LENGTH,
): DailyHealthEntry[] {
  const end = cycle.endDate ?? addDays(cycle.startDate, Math.round(fallbackLength) + 20);
  return Object.values(entries)
    .filter((e) => e.date >= cycle.startDate && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function cycleDayOf(cycle: Cycle, date: IsoDate): number {
  return daysBetween(cycle.startDate, date) + 1;
}

function phaseFor(
  cycleDay: number,
  cycleLength: number,
  periodLength: number,
  isPeriod: boolean,
): CyclePhase {
  if (isPeriod || cycleDay <= Math.round(periodLength)) return "menstrual";
  const ovulation = Math.max(10, Math.round(cycleLength) - 14);
  if (cycleDay < ovulation - 1) return "follicular";
  if (cycleDay <= ovulation + 1) return "ovulatory";
  return "luteal";
}

/** Where the person is on `date` (defaults to today). Null if no cycles yet. */
export function getCyclePosition(
  entries: Record<IsoDate, DailyHealthEntry>,
  user: User | null,
  date: IsoDate = todayIso(),
): CyclePosition | null {
  const cycles = deriveCycles(entries);
  if (cycles.length === 0) return null;

  const containing =
    [...cycles].reverse().find((c) => c.startDate <= date) ?? cycles[0];
  const avgLen = averageCycleLength(cycles, user);
  const avgPeriod = averagePeriodLength(cycles, user);

  const cycleDay = clamp(cycleDayOf(containing, date), 1, 400);
  const entry = entries[date];
  const isPeriod = Boolean(entry?.bleeding && BLEEDING_DAY.has(entry.bleeding.level));
  const withinPeriodWindow =
    cycleDay <= Math.round(containing.periodLengthDays ?? avgPeriod);

  const phase = phaseFor(cycleDay, containing.lengthDays ?? avgLen, avgPeriod, isPeriod);
  const predictedNextPeriodStart = containing.isOngoing
    ? addDays(containing.startDate, Math.round(avgLen))
    : containing.endDate
      ? addDays(containing.endDate, 1)
      : null;

  const daysUntilNextPeriod = predictedNextPeriodStart
    ? daysBetween(date, predictedNextPeriodStart)
    : null;

  let predictedFertileWindow: CyclePosition["predictedFertileWindow"] = null;
  if (predictedNextPeriodStart) {
    const ov = addDays(predictedNextPeriodStart, -14);
    predictedFertileWindow = { start: addDays(ov, -3), end: addDays(ov, 1) };
  }

  return {
    cycleDay,
    phase,
    isPeriod: isPeriod || (withinPeriodWindow && phase === "menstrual"),
    periodDay: phase === "menstrual" ? cycleDay : undefined,
    cycle: containing,
    predictedNextPeriodStart,
    predictedFertileWindow,
    daysUntilNextPeriod,
  };
}

/** Forward-looking predicted next cycle (never shown as certain). */
export function predictNextCycle(
  entries: Record<IsoDate, DailyHealthEntry>,
  user: User | null,
): Cycle | null {
  const cycles = deriveCycles(entries);
  if (cycles.length === 0) return null;
  const last = cycles[cycles.length - 1];
  const avgLen = Math.round(averageCycleLength(cycles, user));
  const start = addDays(last.startDate, avgLen);
  return {
    id: deterministicId("cycle-predicted", start),
    startDate: start,
    periodLengthDays: Math.round(averagePeriodLength(cycles, user)),
    isOngoing: false,
    ordinal: last.ordinal + 1,
    predicted: true,
  };
}

/** Cycle-day pain map + a few helpers reused by the baseline engine. */
export function isBleedingDay(entry: DailyHealthEntry | undefined): boolean {
  return Boolean(entry?.bleeding && BLEEDING_DAY.has(entry.bleeding.level));
}
