/**
 * Demo Mode dataset — realistic but clearly fictional.
 *
 * ~6 months of history for one fictional profile ("Sam Rivera"):
 *  - six broadly consistent cycles that establish a baseline
 *  - a gentle upward trend in cycle length over the last few cycles
 *  - a gradual decrease in sleep during the period
 *  - a CURRENT cycle with clearly higher Day 1–3 pain (8 / 9 / 7),
 *    lower energy, and an extra heavy-bleeding day
 * All deviations are meaningful but non-alarming.
 */

import type {
  AppSnapshot,
  BleedingLevel,
  DailyHealthEntry,
  IsoDate,
  MedicationEntry,
  Mood,
  Symptom,
  SymptomType,
  User,
  VitalReading,
} from "@/models";
import { addDays, addMonths, daysBetween, todayIso } from "@/utils/date";
import { deterministicId } from "@/utils/id";
import { clamp, round } from "@/utils/statistics";
import { createRng } from "./seededRandom";

const DEMO_SEED = 20260902;

/** Gaps (in days) between successive period starts, oldest → newest. The rising
 *  sequence is what produces the "cycle length gradually increasing" trend. */
const CYCLE_GAPS = [28, 29, 30, 31, 32, 33];
const NORMAL_PERIOD_LENGTH = 5;
const NORMAL_PAIN_BY_DAY = [4, 5, 3, 2, 1];
const NORMAL_BLEEDING: BleedingLevel[] = ["medium", "heavy", "medium", "light", "spotting"];
const CURRENT_PAIN_BY_DAY = [8, 9, 7];
const CURRENT_BLEEDING: BleedingLevel[] = ["heavy", "heavy", "medium"];

/** Per-cycle average sleep on period nights — trending down over recent cycles. */
const PERIOD_SLEEP_BY_CYCLE = [6.8, 6.8, 6.7, 6.5, 6.3, 6.1];
const CURRENT_PERIOD_SLEEP = 6.0;

type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

function phaseOf(dayOfCycle: number, cycleLen: number): Phase {
  if (dayOfCycle <= NORMAL_PERIOD_LENGTH) return "menstrual";
  const ovulation = cycleLen - 14;
  if (dayOfCycle < ovulation - 1) return "follicular";
  if (dayOfCycle <= ovulation + 1) return "ovulatory";
  return "luteal";
}

const rng = createRng(DEMO_SEED);

function makeEntry(date: IsoDate, partial: Partial<DailyHealthEntry>): DailyHealthEntry {
  return {
    date,
    symptoms: [],
    medications: [],
    vitals: [],
    sources: ["demo"],
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

function vital(
  date: IsoDate,
  type: VitalReading["type"],
  value: number,
  unit: string,
): VitalReading {
  return {
    id: deterministicId("vital", date, type),
    date,
    type,
    value: round(value, type === "body_temp" ? 2 : 0),
    unit,
    source: "demo_wearable",
    recordedAt: new Date().toISOString(),
  };
}

function dayVitals(date: IsoDate, phase: Phase, dayOfCycle: number): VitalReading[] {
  const lutealShift = phase === "luteal" ? 1 : 0;
  const menstrualShift = phase === "menstrual" && dayOfCycle <= 2 ? 1.5 : 0;
  const out: VitalReading[] = [
    vital(date, "resting_hr", 59 + lutealShift * 2 + menstrualShift + rng.noise(1), "bpm"),
    vital(date, "hrv", 62 - lutealShift * 8 - menstrualShift * 3 + rng.noise(4), "ms"),
    vital(
      date,
      "body_temp",
      (phase === "luteal" ? 36.62 : phase === "ovulatory" ? 36.32 : phase === "menstrual" ? 36.4 : 36.36) +
        rng.noise(0.05),
      "°C",
    ),
  ];
  if (rng.chance(0.4)) {
    out.push(vital(date, "weight", 64 + lutealShift * 0.4 + rng.noise(0.3), "kg"));
  }
  return out;
}

function moodFor(phase: Phase, lutealLate: boolean, current: boolean): Mood[] {
  if (current) return [rng.pick<Mood>(["low", "emotional", "low", "calm"])];
  if (phase === "menstrual") return [rng.pick<Mood>(["low", "calm", "calm"])];
  if (phase === "follicular") return [rng.pick<Mood>(["calm", "happy", "happy"])];
  if (phase === "ovulatory") return [rng.pick<Mood>(["happy", "calm"])];
  // luteal
  return [
    rng.pick<Mood>(
      lutealLate
        ? ["irritable", "low", "anxious", "emotional"]
        : ["calm", "irritable", "low"],
    ),
  ];
}

function symptomsFor(
  phase: Phase,
  dayOfCycle: number,
  lutealLate: boolean,
  current: boolean,
): Symptom[] {
  const s: SymptomType[] = [];
  if (phase === "menstrual") {
    if (dayOfCycle <= 3) s.push("cramps");
    if (dayOfCycle <= 2) s.push("fatigue");
    if (dayOfCycle === 1) s.push("back_pain");
    if (current && dayOfCycle <= 2) s.push("nausea");
    if (current) s.push("fatigue");
  }
  if (phase === "luteal" && lutealLate) {
    s.push("bloating");
    if (rng.chance(0.6)) s.push("breast_tenderness");
    if (rng.chance(0.5)) s.push("cravings");
    if (rng.chance(0.25)) s.push("headache");
    if (rng.chance(0.3)) s.push("acne");
  }
  return Array.from(new Set(s)).map((type) => ({ type }));
}

function meds(date: IsoDate, phase: Phase, dayOfCycle: number, current: boolean): MedicationEntry[] {
  const takeForPain =
    phase === "menstrual" && (current ? dayOfCycle <= 3 : dayOfCycle <= 2 && rng.chance(0.8));
  if (!takeForPain) return [];
  return [
    {
      id: deterministicId("med", date, "ibuprofen"),
      date,
      name: "Ibuprofen",
      dose: current ? "400 mg" : "200 mg",
      note: "For cramps",
    },
  ];
}

function buildCycleEntries(
  cycleIndex: number,
  cycleStart: IsoDate,
  cycleLen: number,
  isCurrent: boolean,
  today: IsoDate,
): DailyHealthEntry[] {
  const entries: DailyHealthEntry[] = [];
  const lastDayToBuild = isCurrent ? daysBetween(cycleStart, today) : cycleLen - 1;
  const periodSleepBase = isCurrent
    ? CURRENT_PERIOD_SLEEP
    : PERIOD_SLEEP_BY_CYCLE[cycleIndex] ?? 6.7;

  for (let offset = 0; offset <= lastDayToBuild; offset++) {
    const date = addDays(cycleStart, offset);
    const dayOfCycle = offset + 1;
    const phase = phaseOf(dayOfCycle, cycleLen);
    const lutealLate = dayOfCycle > cycleLen - 5;
    const isPeriodDay = dayOfCycle <= NORMAL_PERIOD_LENGTH;

    // Skip some ordinary days entirely — partial logging is realistic.
    const alwaysLog = isPeriodDay || lutealLate || isCurrent;
    if (!alwaysLog && rng.chance(0.22)) continue;

    const partial: Partial<DailyHealthEntry> = {};

    // Bleeding
    if (isPeriodDay) {
      const table = isCurrent ? CURRENT_BLEEDING : NORMAL_BLEEDING;
      const level = table[offset] ?? "spotting";
      partial.bleeding = { level };
    }

    // Pain
    if (isPeriodDay && dayOfCycle <= (isCurrent ? CURRENT_PAIN_BY_DAY.length : 5)) {
      const base = isCurrent
        ? CURRENT_PAIN_BY_DAY[offset]
        : NORMAL_PAIN_BY_DAY[offset];
      const level = clamp(Math.round(base + (isCurrent ? 0 : rng.noise(0.8))), 0, 10);
      partial.pain = {
        level,
        locations: dayOfCycle === 1 ? ["lower_abdomen", "lower_back"] : ["lower_abdomen"],
      };
    } else if (phase === "luteal" && lutealLate && rng.chance(0.18)) {
      partial.pain = { level: rng.int(2, 3), locations: ["headache"] };
    }

    // Mood
    if (rng.chance(0.85)) {
      partial.mood = { moods: moodFor(phase, lutealLate, isCurrent) };
    }

    // Energy
    let energy: number;
    if (phase === "menstrual") energy = dayOfCycle <= 2 ? 2 : 3;
    else if (phase === "follicular") energy = rng.int(3, 4);
    else if (phase === "ovulatory") energy = 4;
    else energy = lutealLate ? rng.int(2, 3) : 3;
    if (isCurrent) energy = clamp(energy - 1, 1, 5);
    partial.energy = { level: clamp(energy, 1, 5) as 1 | 2 | 3 | 4 | 5 };

    // Sleep
    const sleepBase = isPeriodDay ? periodSleepBase : 6.95;
    const hours = round(clamp(sleepBase + rng.noise(0.35), 4.5, 9), 2);
    partial.sleep = {
      hours,
      quality: hours < 6.3 ? "poor" : hours < 6.8 ? "fair" : "good",
    };

    // Symptoms
    const sy = symptomsFor(phase, dayOfCycle, lutealLate, isCurrent);
    if (sy.length) partial.symptoms = sy;

    // Activity
    let activity: DailyHealthEntry["activity"];
    if (phase === "menstrual") activity = { level: rng.chance(0.7) ? "low" : "moderate" };
    else if (phase === "luteal") activity = { level: rng.pick(["low", "moderate", "moderate"]) };
    else activity = { level: rng.pick(["moderate", "moderate", "high"]) };
    if (activity.level !== "low") activity.minutes = rng.int(20, 55);
    partial.activity = activity;

    // Meds
    const m = meds(date, phase, dayOfCycle, isCurrent);
    if (m.length) partial.medications = m;

    // Vitals (connected device sample)
    partial.vitals = dayVitals(date, phase, dayOfCycle);

    // Occasional free-text note
    if (isCurrent && dayOfCycle === 2) {
      partial.notes = "Cramps worse than the last few months. Took ibuprofen twice.";
    }

    entries.push(makeEntry(date, partial));
  }
  return entries;
}

export function buildDemoSnapshot(): AppSnapshot {
  const today = todayIso();
  // Current cycle is on Day 3 today.
  const currentStart = addDays(today, -2);

  // Work backwards to place the six prior period starts.
  const starts: IsoDate[] = [currentStart];
  for (let i = CYCLE_GAPS.length - 1; i >= 0; i--) {
    starts.unshift(addDays(starts[0], -CYCLE_GAPS[i]));
  }
  // starts = [S1 .. S6, currentStart]

  const entriesArr: DailyHealthEntry[] = [];
  for (let i = 0; i < starts.length; i++) {
    const isCurrent = i === starts.length - 1;
    const cycleLen = isCurrent ? 30 : CYCLE_GAPS[i];
    entriesArr.push(...buildCycleEntries(i, starts[i], cycleLen, isCurrent, today));
  }

  const entries: Record<IsoDate, DailyHealthEntry> = {};
  for (const e of entriesArr) entries[e.date] = e;

  const user: User = {
    id: "demo_user",
    displayName: "Sam Rivera",
    createdAt: addMonths(today, -7) + "T09:00:00.000Z",
    onboardedAt: addMonths(today, -7) + "T09:05:00.000Z",
    birthYear: 1994,
    lastPeriodStartDate: currentStart,
    typicalPeriodLengthDays: 5,
    typicalCycleLengthDays: 29,
    regularitySelfReport: "regular",
    isDemo: true,
  };

  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    mode: "demo",
    user,
    entries,
    checkIns: [
      {
        id: "demo_checkin_1",
        date: addDays(today, -46),
        createdAt: addDays(today, -46) + "T20:12:00.000Z",
        text: "Really bloated today and craving chocolate. Bit irritable but slept ok.",
      },
      {
        id: "demo_checkin_2",
        date: addDays(today, -1),
        createdAt: addDays(today, -1) + "T07:40:00.000Z",
        text: "Strange pain on my right side and I'm exhausted. Bleeding is heavier than usual.",
      },
    ],
    structuredCheckIns: [],
    integrations: [
      {
        id: "oura",
        provider: "oura",
        displayName: "Oura Ring",
        connected: true,
        lastSync: now,
        scopes: ["sleep", "hrv", "temperature", "readiness"],
        isMock: true,
      },
      {
        id: "apple_health",
        provider: "apple_health",
        displayName: "Apple Health",
        connected: true,
        lastSync: now,
        scopes: ["cycle", "sleep", "heart_rate", "hrv", "temperature", "weight"],
        isMock: true,
      },
    ],
    consent: {
      healthDataProcessing: true,
      aiProcessing: true,
      wearableSync: true,
      analytics: false,
      reportSharing: true,
      crashDiagnostics: false,
      updatedAt: now,
    },
    settings: {
      theme: "system",
      showFertileWindow: false,
      weekStartsOn: 1,
      units: { weight: "kg", temperature: "c" },
    },
    subscriptionTier: "premium",
    sharedReports: [],
    savedReports: [],
  };
}
