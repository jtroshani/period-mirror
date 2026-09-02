/** Presentation-only formatting helpers. */

import type {
  BleedingLevel,
  CyclePhase,
  Mood,
  PainLocation,
  SymptomType,
  VitalType,
} from "@/models";

export function formatHours(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours)) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${`${m}`.padStart(2, "0")}m`;
}

export function formatSigned(value: number, dp = 1): string {
  const rounded = Number(value.toFixed(dp));
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

export function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
}

const TITLES: Record<string, string> = {
  // bleeding
  none: "None",
  spotting: "Spotting",
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
  // pain location
  lower_abdomen: "Lower abdomen",
  left_side: "Left side",
  right_side: "Right side",
  lower_back: "Lower back",
  headache: "Headache",
  breasts: "Breasts",
  other: "Other",
  // mood
  calm: "Calm",
  happy: "Happy",
  low: "Low",
  anxious: "Anxious",
  irritable: "Irritable",
  emotional: "Emotional",
  // symptoms
  cramps: "Cramps",
  bloating: "Bloating",
  nausea: "Nausea",
  breast_tenderness: "Breast tenderness",
  acne: "Acne",
  fatigue: "Fatigue",
  dizziness: "Dizziness",
  digestive_changes: "Digestive changes",
  cravings: "Cravings",
  back_pain: "Back pain",
  // phases
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
  // vitals
  resting_hr: "Resting heart rate",
  hrv: "Heart rate variability",
  body_temp: "Body temperature",
  weight: "Weight",
  respiratory_rate: "Respiratory rate",
};

export function label(
  key:
    | BleedingLevel
    | PainLocation
    | Mood
    | SymptomType
    | CyclePhase
    | VitalType
    | string,
): string {
  return TITLES[key] ?? toTitleCase(key);
}

export function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function energyWord(level: number | null | undefined): string {
  if (level == null) return "—";
  return (
    ["Very low", "Low", "Moderate", "Good", "High"][
      Math.round(level) - 1
    ] ?? "—"
  );
}

export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
