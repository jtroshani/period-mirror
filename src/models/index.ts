/**
 * Period Mirror — domain model.
 *
 * These types are deliberately framework-free so the same domain logic can be
 * reused by a future React Native / Expo app. Dates are ISO calendar strings
 * (`YYYY-MM-DD`) unless the field name ends in `At` (full ISO timestamp).
 */

// ---------------------------------------------------------------------------
// Primitive vocab
// ---------------------------------------------------------------------------

export type IsoDate = string; // YYYY-MM-DD
export type IsoTimestamp = string; // 2026-09-02T08:15:00.000Z

export type BleedingLevel = "none" | "spotting" | "light" | "medium" | "heavy";

export type PainLocation =
  | "lower_abdomen"
  | "left_side"
  | "right_side"
  | "lower_back"
  | "headache"
  | "breasts"
  | "other";

export type Mood =
  | "calm"
  | "happy"
  | "low"
  | "anxious"
  | "irritable"
  | "emotional";

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type SleepQuality = "poor" | "fair" | "good" | "great";

export type ActivityLevel = "low" | "moderate" | "high";

export type SymptomType =
  | "cramps"
  | "headache"
  | "bloating"
  | "nausea"
  | "breast_tenderness"
  | "acne"
  | "fatigue"
  | "dizziness"
  | "digestive_changes"
  | "cravings"
  | "back_pain"
  | "other";

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export type RegularitySelfReport = "regular" | "irregular" | "not_sure";

/** Supported UI languages. */
export type Lang = "en" | "it";

export type SubscriptionTier = "free" | "premium" | "professional";

export type DataSource =
  | "manual"
  | "checkin"
  | "demo"
  | "demo_wearable"
  | "apple_health"
  | "health_connect"
  | "wearable";

export type VitalType =
  | "resting_hr"
  | "hrv"
  | "body_temp"
  | "weight"
  | "respiratory_rate";

// ---------------------------------------------------------------------------
// Daily entry + its parts
// ---------------------------------------------------------------------------

export interface BleedingEntry {
  level: BleedingLevel;
  clots?: boolean;
}

export interface PainEntry {
  /** 0–10 self-reported intensity. */
  level: number;
  locations: PainLocation[];
  note?: string;
}

export interface MoodEntry {
  moods: Mood[];
  note?: string;
}

export interface EnergyEntry {
  /** 1 (very low) – 5 (very high). */
  level: EnergyLevel;
}

export interface SleepEntry {
  hours?: number;
  quality?: SleepQuality;
}

export interface ActivityEntry {
  level: ActivityLevel;
  minutes?: number;
  source?: DataSource;
}

export interface Symptom {
  type: SymptomType;
  /** Free-text label when `type === "other"`. */
  label?: string;
  /** Optional 0–10 intensity if the user offered one. */
  severity?: number;
}

export interface VitalReading {
  id: string;
  date: IsoDate;
  type: VitalType;
  value: number;
  unit: string;
  source: DataSource;
  recordedAt: IsoTimestamp;
}

export interface MedicationEntry {
  id: string;
  date: IsoDate;
  name: string;
  dose?: string;
  note?: string;
}

export interface NutritionEntry {
  id: string;
  date: IsoDate;
  summary: string;
  hydrationGlasses?: number;
  note?: string;
}

/** One calendar day of recorded information. All fields optional — partial
 *  logging is a first-class expectation, never a form to "complete". */
export interface DailyHealthEntry {
  date: IsoDate;
  bleeding?: BleedingEntry;
  pain?: PainEntry;
  mood?: MoodEntry;
  energy?: EnergyEntry;
  sleep?: SleepEntry;
  symptoms: Symptom[];
  activity?: ActivityEntry;
  medications: MedicationEntry[];
  nutrition?: NutritionEntry;
  vitals: VitalReading[];
  notes?: string;
  /** Where this day's data came from (provenance for the report + trust). */
  sources: DataSource[];
  updatedAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Cycle structures (mostly derived from entries)
// ---------------------------------------------------------------------------

export interface PeriodDay {
  date: IsoDate;
  bleeding: BleedingLevel;
  cycleId: string;
  dayOfPeriod: number; // 1-based
}

export interface Cycle {
  id: string;
  /** Day 1 = first day of recorded bleeding for this cycle. */
  startDate: IsoDate;
  /** Last day belonging to this cycle (day before the next cycle's start). */
  endDate?: IsoDate;
  lengthDays?: number; // undefined while ongoing
  periodLengthDays?: number;
  isOngoing: boolean;
  /** 1 = oldest known cycle. */
  ordinal: number;
  /** True for the forward-looking predicted next cycle. */
  predicted?: boolean;
}

export interface CyclePosition {
  cycleDay: number; // 1-based
  phase: CyclePhase;
  isPeriod: boolean;
  periodDay?: number;
  cycle: Cycle;
  predictedNextPeriodStart: IsoDate | null;
  predictedFertileWindow: { start: IsoDate; end: IsoDate } | null;
  daysUntilNextPeriod: number | null;
}

// ---------------------------------------------------------------------------
// User + onboarding + consent
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  displayName?: string;
  createdAt: IsoTimestamp;
  onboardedAt?: IsoTimestamp;
  birthYear?: number;
  lastPeriodStartDate?: IsoDate;
  typicalPeriodLengthDays?: number;
  typicalCycleLengthDays?: number;
  regularitySelfReport?: RegularitySelfReport;
  isDemo: boolean;
}

export interface ConsentPreference {
  healthDataProcessing: boolean;
  aiProcessing: boolean;
  wearableSync: boolean;
  analytics: boolean;
  reportSharing: boolean;
  crashDiagnostics: boolean;
  updatedAt: IsoTimestamp;
}

export interface SharedReportGrant {
  id: string;
  reportId: string;
  createdAt: IsoTimestamp;
  label: string;
  revoked: boolean;
}

export interface AppSettings {
  language: Lang;
  theme: "light" | "dark" | "system";
  showFertileWindow: boolean;
  weekStartsOn: 0 | 1;
  units: { weight: "kg" | "lb"; temperature: "c" | "f" };
}

// ---------------------------------------------------------------------------
// "How do I feel today?" — free text -> structured
// ---------------------------------------------------------------------------

export interface FreeTextCheckIn {
  id: string;
  date: IsoDate;
  createdAt: IsoTimestamp;
  text: string;
  structuredId?: string;
}

export type ExtractedField =
  | "pain"
  | "bleeding"
  | "energy"
  | "mood"
  | "sleep"
  | "symptom"
  | "activity"
  | "note";

export interface ExtractedItem {
  id: string;
  field: ExtractedField;
  /** Human-readable one-liner shown in the confirmation list. */
  label: string;
  detail?: string;
  /** Structured payload merged into the DailyHealthEntry on confirm. */
  value: unknown;
  /** 0–1 model/heuristic confidence. */
  confidence: number;
  /** Interface should prompt for a 0–10 severity before saving. */
  needsSeverity?: boolean;
  sourcePhrase?: string;
  accepted: boolean;
}

export interface StructuredCheckIn {
  id: string;
  checkInId: string;
  date: IsoDate;
  createdAt: IsoTimestamp;
  items: ExtractedItem[];
  status: "proposed" | "confirmed" | "dismissed";
  /** Non-diagnostic safety notice, if the text warranted one. */
  safetyNotice?: SafetyNotice;
}

// ---------------------------------------------------------------------------
// Baseline engine outputs ("Me vs. Me")
// ---------------------------------------------------------------------------

export interface MetricSummary {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
}

export type BaselineReadinessLevel =
  | "starting"
  | "learning"
  | "improving"
  | "ready";

export interface BaselineReadiness {
  level: BaselineReadinessLevel;
  cyclesHave: number;
  cyclesNeeded: number;
  progress: number; // 0–1
  message: string;
}

export interface SymptomFrequency {
  type: SymptomType;
  label: string;
  occurrences: number;
  cyclesWithSymptom: number;
  ratePerCycle: number;
}

export interface BaselineTrend {
  id: string;
  metric: "cycle_length" | "early_period_pain" | "period_sleep" | "energy";
  label: string;
  direction: "increasing" | "decreasing" | "stable";
  changePerCycle: number;
  windowCycles: number;
  summary: string;
}

export interface PersonalBaseline {
  generatedAt: IsoTimestamp;
  cyclesAnalyzed: number;
  daysOfData: number;
  readiness: BaselineReadiness;
  cycleLength: MetricSummary;
  periodDuration: MetricSummary;
  /** Average recorded pain keyed by cycle day (1-based). */
  painByCycleDay: Record<number, number>;
  /** Per-cycle average of Day 1–3 pain — the headline "Me vs. Me" metric. */
  earlyPeriodPain: MetricSummary;
  sleepByPhase: Partial<Record<CyclePhase, number>>;
  /** Per-cycle average sleep hours on period nights. */
  periodSleep: MetricSummary;
  energyOverall: MetricSummary;
  symptomFrequency: SymptomFrequency[];
  bleedingDistribution: Record<BleedingLevel, number>;
  heavyDaysPerCycle: MetricSummary;
  trends: BaselineTrend[];
}

export type ComparisonDirection = "higher" | "lower" | "similar" | "unknown";
export type ComparisonConfidence =
  | "insufficient"
  | "low"
  | "moderate"
  | "high";
export type DeviationSeverity = "none" | "slight" | "notable" | "marked";

export interface MetricComparison {
  id: string;
  metric: string;
  label: string;
  unit?: string;
  currentValue: number | null;
  baselineValue: number | null;
  absoluteDifference: number | null;
  percentageDifference: number | null;
  direction: ComparisonDirection;
  confidence: ComparisonConfidence;
  severity: DeviationSeverity;
  basisCycles: number;
  /** Plain-language, fully transparent account of the numbers used. */
  explanation: string;
  /** When true a lower value is the "better"/expected direction. */
  betterWhenLower?: boolean;
}

// ---------------------------------------------------------------------------
// Insight system
// ---------------------------------------------------------------------------

export type InsightCategory =
  | "NORMAL"
  | "NOTICE"
  | "TREND"
  | "INSUFFICIENT_DATA";

export interface InsightEvidenceRow {
  label: string;
  value: string;
}

export interface PatternInsight {
  id: string;
  category: InsightCategory;
  title: string;
  summary: string;
  /** Answers "Why am I seeing this?" — shows the exact recorded data used. */
  detail: string;
  evidence: InsightEvidenceRow[];
  /** Optional non-diagnostic prompt to consider a conversation with a clinician. */
  guidance?: string;
  metric?: string;
  generatedAt: IsoTimestamp;
  severity: DeviationSeverity;
}

// ---------------------------------------------------------------------------
// Safety layer (never diagnostic)
// ---------------------------------------------------------------------------

export type SafetySeverity = "info" | "attention";

export interface SafetyNotice {
  id: string;
  triggeredBy: string[];
  severity: SafetySeverity;
  message: string;
  date: IsoDate;
}

// ---------------------------------------------------------------------------
// Health report
// ---------------------------------------------------------------------------

export type ReportRangeKey = "3m" | "6m" | "12m" | "custom";

export interface ReportSignal {
  label: string;
  value: string;
  trend?: string;
  source: string;
}

export interface ReportTimelineEntry {
  cycleOrdinal: number;
  startDate: IsoDate;
  lengthDays?: number;
  periodLengthDays?: number;
  peakPain?: number;
  markers: string[];
}

export interface HealthReport {
  id: string;
  generatedAt: IsoTimestamp;
  range: { from: IsoDate; to: IsoDate; label: string };
  subjectLabel: string;
  cycleSummary: {
    recordedCycles: number;
    averageLengthDays: number | null;
    shortestLengthDays: number | null;
    longestLengthDays: number | null;
    variabilityDays: number | null;
    averagePeriodDurationDays: number | null;
  };
  pain: {
    typicalLevel: number | null;
    highestRecorded: number | null;
    highPainDays: number;
    trend: string;
  };
  bleeding: {
    recorded: boolean;
    typicalPattern: string;
    heavyDays: number;
    changeNote: string;
  };
  symptoms: { label: string; daysLogged: number; note?: string }[];
  energy: { average: number | null; trend: string };
  sleep: { averageHours: number | null; trend: string };
  otherSignals: ReportSignal[];
  changesToDiscuss: string[];
  timeline: ReportTimelineEntry[];
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Device / platform integrations
// ---------------------------------------------------------------------------

export type IntegrationProvider =
  | "apple_health"
  | "health_connect"
  | "apple_watch"
  | "fitbit"
  | "garmin"
  | "oura"
  | "sample";

export interface DeviceIntegration {
  id: string;
  provider: IntegrationProvider;
  displayName: string;
  connected: boolean;
  lastSync?: IsoTimestamp;
  scopes: string[];
  isMock: boolean;
}

// ---------------------------------------------------------------------------
// Persisted app snapshot
// ---------------------------------------------------------------------------

export interface AppSnapshot {
  schemaVersion: number;
  mode: "empty" | "demo" | "user";
  user: User | null;
  entries: Record<IsoDate, DailyHealthEntry>;
  checkIns: FreeTextCheckIn[];
  structuredCheckIns: StructuredCheckIn[];
  integrations: DeviceIntegration[];
  consent: ConsentPreference;
  settings: AppSettings;
  subscriptionTier: SubscriptionTier;
  sharedReports: SharedReportGrant[];
  savedReports: HealthReport[];
}
