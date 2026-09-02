/**
 * Central app store (Zustand). Holds the persisted AppSnapshot plus actions.
 * Business logic lives in `src/engine` + `src/services`; this file is glue and
 * state transitions only. Every mutation writes through the StorageService so
 * the persistence mechanism can be swapped without touching screens.
 */

import { create } from "zustand";
import type {
  AppSettings,
  AppSnapshot,
  ConsentPreference,
  DailyHealthEntry,
  DataSource,
  DeviceIntegration,
  ExtractedItem,
  FreeTextCheckIn,
  HealthReport,
  IsoDate,
  MedicationEntry,
  Mood,
  RegularitySelfReport,
  SharedReportGrant,
  StructuredCheckIn,
  Symptom,
  SymptomType,
  SubscriptionTier,
  User,
  VitalReading,
} from "@/models";
import { SNAPSHOT_KEY, storageService } from "@/services/storage";
import { buildDemoSnapshot } from "@/demo/demoData";
import { addDays, todayIso } from "@/utils/date";
import { uid } from "@/utils/id";

const SCHEMA_VERSION = 1;

export const DEFAULT_CONSENT: ConsentPreference = {
  healthDataProcessing: true,
  aiProcessing: true,
  wearableSync: false,
  analytics: false,
  reportSharing: false,
  crashDiagnostics: false,
  updatedAt: new Date(0).toISOString(),
};

function detectLanguage(): AppSettings["language"] {
  try {
    const nav = typeof navigator !== "undefined" ? navigator.language : "";
    return nav.toLowerCase().startsWith("it") ? "it" : "en";
  } catch {
    return "en";
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: detectLanguage(),
  theme: "system",
  showFertileWindow: false,
  weekStartsOn: 1,
  units: { weight: "kg", temperature: "c" },
};

function emptySnapshot(): AppSnapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    mode: "empty",
    user: null,
    entries: {},
    checkIns: [],
    structuredCheckIns: [],
    integrations: [],
    consent: { ...DEFAULT_CONSENT },
    settings: { ...DEFAULT_SETTINGS },
    subscriptionTier: "free",
    sharedReports: [],
    savedReports: [],
  };
}

export interface OnboardingData {
  displayName?: string;
  lastPeriodStartDate: IsoDate;
  typicalPeriodLengthDays?: number;
  typicalCycleLengthDays?: number;
  regularitySelfReport?: RegularitySelfReport;
}

export interface EntryPatch {
  bleeding?: DailyHealthEntry["bleeding"];
  pain?: Partial<NonNullable<DailyHealthEntry["pain"]>>;
  mood?: { moods: Mood[]; note?: string };
  energy?: DailyHealthEntry["energy"];
  sleep?: DailyHealthEntry["sleep"];
  activity?: DailyHealthEntry["activity"];
  notes?: string;
  appendNote?: string;
  symptomsSet?: Symptom[];
  addSymptoms?: Symptom[];
  removeSymptomTypes?: SymptomType[];
  addMedication?: MedicationEntry;
  addVitals?: VitalReading[];
  source?: DataSource;
}

interface AppActions {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startFresh: () => void;
  loadDemo: () => void;
  resetDemo: () => void;
  completeOnboarding: (data: OnboardingData) => void;
  upsertEntry: (date: IsoDate, patch: EntryPatch) => void;
  applyExtractedItems: (date: IsoDate, items: ExtractedItem[]) => void;
  addCheckIn: (checkIn: FreeTextCheckIn) => void;
  addStructuredCheckIn: (structured: StructuredCheckIn) => void;
  setConsent: (patch: Partial<ConsentPreference>) => void;
  setSettings: (patch: Partial<AppSettings>) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setIntegration: (integration: DeviceIntegration) => void;
  ingestVitals: (readings: VitalReading[]) => void;
  saveReport: (report: HealthReport) => void;
  addSharedReport: (grant: SharedReportGrant) => void;
  revokeSharedReport: (id: string) => void;
  exportData: () => Promise<string>;
  deleteAllData: () => Promise<void>;
}

export type AppStore = AppSnapshot & AppActions;

function blankEntry(date: IsoDate): DailyHealthEntry {
  return {
    date,
    symptoms: [],
    medications: [],
    vitals: [],
    sources: [],
    updatedAt: new Date().toISOString(),
  };
}

function withSource(sources: DataSource[], source?: DataSource): DataSource[] {
  if (!source) return sources;
  return sources.includes(source) ? sources : [...sources, source];
}

function applyPatch(entry: DailyHealthEntry, patch: EntryPatch): DailyHealthEntry {
  const next: DailyHealthEntry = {
    ...entry,
    symptoms: [...entry.symptoms],
    medications: [...entry.medications],
    vitals: [...entry.vitals],
    sources: [...entry.sources],
  };

  if (patch.bleeding !== undefined) next.bleeding = patch.bleeding;
  if (patch.energy !== undefined) next.energy = patch.energy;
  if (patch.sleep !== undefined) {
    next.sleep = { ...next.sleep, ...patch.sleep };
  }
  if (patch.activity !== undefined) next.activity = patch.activity;
  if (patch.mood !== undefined) {
    const merged = new Set<Mood>([...(next.mood?.moods ?? []), ...patch.mood.moods]);
    next.mood = { moods: [...merged], note: patch.mood.note ?? next.mood?.note };
  }
  if (patch.pain !== undefined) {
    const prev = next.pain ?? { level: 0, locations: [] };
    next.pain = {
      level: patch.pain.level ?? prev.level,
      locations: patch.pain.locations
        ? [...new Set([...prev.locations, ...patch.pain.locations])]
        : prev.locations,
      note: patch.pain.note ?? prev.note,
    };
  }
  if (patch.notes !== undefined) next.notes = patch.notes;
  if (patch.appendNote) {
    next.notes = next.notes ? `${next.notes}\n${patch.appendNote}` : patch.appendNote;
  }
  if (patch.symptomsSet) next.symptoms = dedupeSymptoms(patch.symptomsSet);
  if (patch.addSymptoms) {
    next.symptoms = dedupeSymptoms([...next.symptoms, ...patch.addSymptoms]);
  }
  if (patch.removeSymptomTypes) {
    next.symptoms = next.symptoms.filter(
      (s) => !patch.removeSymptomTypes!.includes(s.type),
    );
  }
  if (patch.addMedication) next.medications = [...next.medications, patch.addMedication];
  if (patch.addVitals) next.vitals = [...next.vitals, ...patch.addVitals];

  next.sources = withSource(next.sources, patch.source ?? "manual");
  next.updatedAt = new Date().toISOString();
  return next;
}

function dedupeSymptoms(list: Symptom[]): Symptom[] {
  const map = new Map<string, Symptom>();
  for (const s of list) {
    const key = s.type === "other" ? `other:${s.label ?? ""}` : s.type;
    map.set(key, s);
  }
  return [...map.values()];
}

/** Translate a confirmed ExtractedItem into an EntryPatch. */
function itemToPatch(item: ExtractedItem): EntryPatch | null {
  const v = item.value as Record<string, unknown>;
  switch (item.field) {
    case "pain":
      return {
        pain: {
          level: typeof v.level === "number" ? v.level : undefined,
          locations: Array.isArray(v.locations) ? (v.locations as never) : [],
          note: typeof v.note === "string" ? v.note : undefined,
        },
        source: "checkin",
      };
    case "bleeding":
      return {
        bleeding: {
          level: v.level as never,
          clots: v.clots === true ? true : undefined,
        },
        source: "checkin",
      };
    case "energy":
      return { energy: { level: v.level as never }, source: "checkin" };
    case "mood":
      return { mood: { moods: (v.moods as Mood[]) ?? [] }, source: "checkin" };
    case "sleep":
      return {
        sleep: {
          hours: typeof v.hours === "number" ? v.hours : undefined,
          quality: v.quality as never,
        },
        source: "checkin",
      };
    case "symptom":
      return { addSymptoms: [{ type: v.type as SymptomType }], source: "checkin" };
    case "activity":
      return { activity: { level: v.level as never }, source: "checkin" };
    case "note":
      return typeof item.value === "string"
        ? { appendNote: item.value, source: "checkin" }
        : null;
    default:
      return null;
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...emptySnapshot(),
  hydrated: false,

  hydrate: async () => {
    const saved = await storageService.read<AppSnapshot>(SNAPSHOT_KEY);
    if (saved && saved.schemaVersion === SCHEMA_VERSION) {
      set({ ...saved, hydrated: true });
    } else {
      set({ ...emptySnapshot(), hydrated: true });
    }
  },

  startFresh: () => {
    const language = get().settings.language;
    const base = emptySnapshot();
    set({ ...base, settings: { ...base.settings, language }, mode: "empty", hydrated: true });
  },

  loadDemo: () => {
    const language = get().settings.language;
    const demo = buildDemoSnapshot();
    set({ ...demo, settings: { ...demo.settings, language }, hydrated: true });
  },

  resetDemo: () => {
    const language = get().settings.language;
    const demo = buildDemoSnapshot();
    set({ ...demo, settings: { ...demo.settings, language }, hydrated: true });
  },

  completeOnboarding: (data) => {
    const now = new Date().toISOString();
    const user: User = {
      id: uid("user"),
      displayName: data.displayName?.trim() || undefined,
      createdAt: now,
      onboardedAt: now,
      lastPeriodStartDate: data.lastPeriodStartDate,
      typicalPeriodLengthDays: data.typicalPeriodLengthDays,
      typicalCycleLengthDays: data.typicalCycleLengthDays,
      regularitySelfReport: data.regularitySelfReport,
      isDemo: false,
    };
    // Seed the reported period so there's an initial cycle to build on.
    const entries: Record<IsoDate, DailyHealthEntry> = {};
    const periodLen = data.typicalPeriodLengthDays ?? 5;
    for (let i = 0; i < periodLen; i++) {
      const date = addDays(data.lastPeriodStartDate, i);
      entries[date] = {
        ...blankEntry(date),
        bleeding: { level: i === 0 || i === periodLen - 1 ? "light" : "medium" },
        sources: ["manual"],
      };
    }
    const base = emptySnapshot();
    set({
      ...base,
      settings: { ...base.settings, language: get().settings.language },
      hydrated: true,
      mode: "user",
      user,
      entries,
    });
  },

  upsertEntry: (date, patch) => {
    const entries = { ...get().entries };
    const existing = entries[date] ?? blankEntry(date);
    entries[date] = applyPatch(existing, patch);
    set({ entries });
  },

  applyExtractedItems: (date, items) => {
    let entries = { ...get().entries };
    for (const item of items) {
      if (!item.accepted) continue;
      const patch = itemToPatch(item);
      if (!patch) continue;
      const existing = entries[date] ?? blankEntry(date);
      entries = { ...entries, [date]: applyPatch(existing, patch) };
    }
    set({ entries });
  },

  addCheckIn: (checkIn) => set({ checkIns: [checkIn, ...get().checkIns] }),

  addStructuredCheckIn: (structured) =>
    set({ structuredCheckIns: [structured, ...get().structuredCheckIns] }),

  setConsent: (patch) =>
    set({
      consent: { ...get().consent, ...patch, updatedAt: new Date().toISOString() },
    }),

  setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

  setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),

  setIntegration: (integration) => {
    const others = get().integrations.filter((i) => i.provider !== integration.provider);
    set({ integrations: [...others, integration] });
  },

  ingestVitals: (readings) => {
    const entries = { ...get().entries };
    for (const r of readings) {
      const existing = entries[r.date] ?? blankEntry(r.date);
      const already = existing.vitals.some(
        (v) => v.type === r.type && v.date === r.date && v.source === r.source,
      );
      if (already) continue;
      entries[r.date] = {
        ...existing,
        vitals: [...existing.vitals, r],
        sources: withSource(existing.sources, r.source),
        updatedAt: new Date().toISOString(),
      };
    }
    set({ entries });
  },

  saveReport: (report) =>
    set({ savedReports: [report, ...get().savedReports].slice(0, 10) }),

  addSharedReport: (grant) => set({ sharedReports: [grant, ...get().sharedReports] }),

  revokeSharedReport: (id) =>
    set({
      sharedReports: get().sharedReports.map((g) =>
        g.id === id ? { ...g, revoked: true } : g,
      ),
    }),

  exportData: async () => {
    const s = get();
    const snapshot = toSnapshot(s);
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), app: "Period Mirror", data: snapshot },
      null,
      2,
    );
  },

  deleteAllData: async () => {
    await storageService.clearAll();
    const base = emptySnapshot();
    set({
      ...base,
      settings: { ...base.settings, language: get().settings.language },
      hydrated: true,
    });
  },
}));

export function toSnapshot(s: AppStore): AppSnapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    mode: s.mode,
    user: s.user,
    entries: s.entries,
    checkIns: s.checkIns,
    structuredCheckIns: s.structuredCheckIns,
    integrations: s.integrations,
    consent: s.consent,
    settings: s.settings,
    subscriptionTier: s.subscriptionTier,
    sharedReports: s.sharedReports,
    savedReports: s.savedReports,
  };
}

// Persist on every change once hydrated.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
useAppStore.subscribe((state) => {
  if (!state.hydrated) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void storageService.write(SNAPSHOT_KEY, toSnapshot(state));
  }, 120);
});

export { todayIso };
