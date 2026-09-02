/** Shared option lists for logging surfaces (Log screen, Check-in, Day detail). */

import type {
  ActivityLevel,
  BleedingLevel,
  Mood,
  PainLocation,
  SleepQuality,
  SymptomType,
} from "@/models";

export const BLEEDING_OPTIONS: { value: BleedingLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

export const PAIN_LOCATION_OPTIONS: { value: PainLocation; label: string }[] = [
  { value: "lower_abdomen", label: "Lower abdomen" },
  { value: "left_side", label: "Left side" },
  { value: "right_side", label: "Right side" },
  { value: "lower_back", label: "Lower back" },
  { value: "headache", label: "Headache" },
  { value: "breasts", label: "Breasts" },
  { value: "other", label: "Other" },
];

export const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "calm", label: "Calm" },
  { value: "happy", label: "Happy" },
  { value: "low", label: "Low" },
  { value: "anxious", label: "Anxious" },
  { value: "irritable", label: "Irritable" },
  { value: "emotional", label: "Emotional" },
];

export const SYMPTOM_OPTIONS: { value: SymptomType; label: string }[] = [
  { value: "cramps", label: "Cramps" },
  { value: "headache", label: "Headache" },
  { value: "bloating", label: "Bloating" },
  { value: "nausea", label: "Nausea" },
  { value: "breast_tenderness", label: "Breast tenderness" },
  { value: "acne", label: "Acne" },
  { value: "fatigue", label: "Fatigue" },
  { value: "dizziness", label: "Dizziness" },
  { value: "digestive_changes", label: "Digestive changes" },
  { value: "cravings", label: "Cravings" },
  { value: "back_pain", label: "Back pain" },
  { value: "other", label: "Other" },
];

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

export const SLEEP_QUALITY_OPTIONS: { value: SleepQuality; label: string }[] = [
  { value: "poor", label: "Poor" },
  { value: "fair", label: "Fair" },
  { value: "good", label: "Good" },
  { value: "great", label: "Great" },
];

export const ENERGY_ENDS: [string, string] = ["Very low", "Very high"];
