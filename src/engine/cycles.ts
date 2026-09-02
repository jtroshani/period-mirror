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
import { clamp, mean, stdDev } from "@/utils/statistics";
import { ageFromBirthYear } from "@/utils/age";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const DEFAULT_VARIABILITY_DAYS = 2;
/** Completed cycles required before "Me vs. Me" comparisons are shown. */
export const CYCLES_FOR_READY_BASELINE = 4;
/** Completed cycles after which predictions rely on personal data alone. */
export const CYCLES_FOR_PERSONAL_PREDICTION = 3;

// ---------------------------------------------------------------------------
// Age → cycle prior
// ---------------------------------------------------------------------------
//
// Menstrual cycles tend to be longer and more variable in the first years
// after menarche and in the years approaching menopause, and most regular
// roughly between the mid-20s and late 30s. We use age ONLY as a starting
// assumption for predictions until enough of the person's own history exists
// — it is never a comparison or a judgement about their body.

export type AgeBand =
  | "adolescent"
  | "young_adult"
  | "adult"
  | "late_reproductive"
  | "perimenopausal";

export interface AgeCycleProfile {
  band: AgeBand;
  typicalCycleLength: number;
  variabilityDays: number;
  /** True when this age range is commonly associated with a wider spread. */
  widerWindow: boolean;
}

export function ageBand(age: number): AgeBand {
  if (age <= 17) return "adolescent";
  if (age <= 24) return "young_adult";
  if (age <= 39) return "adult";
  if (age <= 44) return "late_reproductive";
  return "perimenopausal";
}

const AGE_TABLE: Record<AgeBand, { len: number; v: number }> = {
  adolescent: { len: 30, v: 5 },
  young_adult: { len: 29, v: 3 },
  adult: { len: 28, v: 2 },
  late_reproductive: { len: 28, v: 3 },
  perimenopausal: { len: 30, v: 6 },
};

export function ageCycleProfile(age: number | null | undefined): AgeCycleProfile | null {
  if (age == null || !Number.isFinite(age) || age < 9 || age > 60) return null;
  const band = ageBand(age);
  const { len, v } = AGE_TABLE[band];
  return { band, typicalCycleLength: len, variabilityDays: v, widerWindow: v >= 4 };
}

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
    if (user?.typicalCycleLengthDays) return user.typicalCycleLengthDays;
    const age = ageFromBirthYear(user?.birthYear);
    return ageCycleProfile(age)?.typicalCycleLength ?? DEFAULT_CYCLE_LENGTH;
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
  const model = cyclePredictionModel(entries, user);
  const avgLen = model.lengthDays;
  const avgPeriod = averagePeriodLength(cycles, user);

  const cycleDay = clamp(cycleDayOf(containing, date), 1, 400);
  const entry = entries[date];
  const isPeriod = Boolean(entry?.bleeding && BLEEDING_DAY.has(entry.bleeding.level));
  const withinPeriodWindow =
    cycleDay <= Math.round(containing.periodLengthDays ?? avgPeriod);

  const phase = phaseFor(cycleDay, containing.lengthDays ?? avgLen, avgPeriod, isPeriod);
  const predictedNextPeriodStart = containing.isOngoing
    ? addDays(containing.startDate, avgLen)
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

export type PredictionSource = "personal" | "age" | "typical" | "default";

export interface CyclePredictionModel {
  /** Expected cycle length used for forward predictions. */
  lengthDays: number;
  /** ± days of expected spread around a predicted period start. */
  variabilityDays: number;
  source: PredictionSource;
  /** How many completed cycles fed the estimate. */
  cyclesUsed: number;
  ageBand: AgeBand | null;
  /** Age range commonly associated with a wider spread AND not yet personal. */
  ageWidensWindow: boolean;
}

/**
 * The estimate the calendar uses for predictions. Personal history wins once
 * there are enough completed cycles; before that, age (if known) sets the
 * assumed length + spread, then the user's onboarding typicals, then defaults.
 */
export function cyclePredictionModel(
  entries: Record<IsoDate, DailyHealthEntry>,
  user: User | null,
): CyclePredictionModel {
  const cycles = deriveCycles(entries);
  const done = completedCycles(cycles);
  const age = ageFromBirthYear(user?.birthYear);
  const ageProf = ageCycleProfile(age);
  const band = ageProf?.band ?? null;

  if (done.length >= CYCLES_FOR_PERSONAL_PREDICTION) {
    const lengths = done.slice(-6).map((c) => c.lengthDays!);
    return {
      lengthDays: Math.round(mean(lengths)),
      variabilityDays: Math.max(1, Math.round(stdDev(lengths))),
      source: "personal",
      cyclesUsed: lengths.length,
      ageBand: band,
      ageWidensWindow: false,
    };
  }

  if (ageProf) {
    // 1–2 completed cycles: nudge the age prior toward what we've seen.
    const seen = done.length
      ? mean(done.map((c) => c.lengthDays!))
      : user?.typicalCycleLengthDays ?? ageProf.typicalCycleLength;
    return {
      lengthDays: Math.round((seen + ageProf.typicalCycleLength) / 2),
      variabilityDays: ageProf.variabilityDays,
      source: done.length ? "personal" : "age",
      cyclesUsed: done.length,
      ageBand: band,
      ageWidensWindow: ageProf.widerWindow && done.length === 0,
    };
  }

  return {
    lengthDays: Math.round(averageCycleLength(cycles, user)),
    variabilityDays: user?.regularitySelfReport === "irregular" ? 4 : DEFAULT_VARIABILITY_DAYS,
    source: user?.typicalCycleLengthDays ? "typical" : "default",
    cyclesUsed: done.length,
    ageBand: band,
    ageWidensWindow: false,
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
  const model = cyclePredictionModel(entries, user);
  const start = addDays(last.startDate, model.lengthDays);
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
