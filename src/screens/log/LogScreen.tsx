import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Badge } from "@/components/ui/primitives";
import { Chip, ChipGroup } from "@/components/ui/Chips";
import { Slider } from "@/components/ui/Slider";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { useAppStore } from "@/store/useAppStore";
import { useEntry } from "@/store/selectors";
import { todayIso, formatLongDate, relativeDayLabel } from "@/utils/date";
import { energyWord } from "@/utils/format";
import {
  ACTIVITY_OPTIONS,
  BLEEDING_OPTIONS,
  MOOD_OPTIONS,
  PAIN_LOCATION_OPTIONS,
  SLEEP_QUALITY_OPTIONS,
  SYMPTOM_OPTIONS,
} from "@/features/logging/options";
import type {
  ActivityLevel,
  BleedingLevel,
  Mood,
  PainLocation,
  SleepQuality,
  SymptomType,
} from "@/models";

export function LogScreen() {
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const date = params.get("date") ?? todayIso();
  const entry = useEntry(date);
  const upsertEntry = useAppStore((s) => s.upsertEntry);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const painLevel = entry?.pain?.level ?? 0;
  const painLocations = entry?.pain?.locations ?? [];
  const moods = entry?.mood?.moods ?? [];
  const symptomTypes = entry?.symptoms.map((s) => s.type) ?? [];

  return (
    <>
      <AppBar
        title={date === todayIso() ? "Log today" : "Edit entry"}
        back={-1}
        action={<Badge tone="neutral">Auto-saved</Badge>}
      />
      <Screen>
        <p className="mb-3 mt-1 text-sm text-muted">
          {formatLongDate(date)} · {relativeDayLabel(date)}. Fill in only what's
          relevant — partial entries are fine.
        </p>
        <Stack>
          {/* Period */}
          <section id="bleeding">
            <SectionLabel>Period</SectionLabel>
            <Card>
              <div className="flex flex-wrap gap-2">
                {BLEEDING_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    selected={entry?.bleeding?.level === o.value}
                    onClick={() =>
                      upsertEntry(date, { bleeding: { level: o.value as BleedingLevel } })
                    }
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
              {entry?.bleeding && entry.bleeding.level !== "none" && (
                <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={entry.bleeding.clots ?? false}
                    onChange={(e) =>
                      upsertEntry(date, {
                        bleeding: { level: entry.bleeding!.level, clots: e.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-[rgb(var(--pm-primary))]"
                  />
                  Noticed clots
                </label>
              )}
            </Card>
          </section>

          {/* Pain */}
          <section id="pain">
            <SectionLabel>Pain</SectionLabel>
            <Card className="space-y-4">
              <Slider
                label="Pain level"
                value={painLevel}
                min={0}
                max={10}
                ends={["None", "Worst imaginable"]}
                format={(v) => `${v}/10`}
                onChange={(v) =>
                  upsertEntry(date, { pain: { level: v, locations: painLocations } })
                }
              />
              <div>
                <p className="mb-2 text-sm font-semibold text-muted">Where? (optional)</p>
                <ChipGroup<PainLocation>
                  options={PAIN_LOCATION_OPTIONS}
                  value={painLocations}
                  onChange={(next) =>
                    upsertEntry(date, {
                      pain: { level: painLevel, locations: next },
                    })
                  }
                />
              </div>
            </Card>
          </section>

          {/* Mood */}
          <section id="mood">
            <SectionLabel>Mood</SectionLabel>
            <Card>
              <ChipGroup<Mood>
                options={MOOD_OPTIONS}
                value={moods}
                onChange={(next) => upsertEntry(date, { mood: { moods: next } })}
              />
            </Card>
          </section>

          {/* Energy */}
          <section id="energy">
            <SectionLabel>Energy</SectionLabel>
            <Card>
              <Slider
                label="Energy"
                min={1}
                max={5}
                value={entry?.energy?.level ?? 3}
                ends={["Very low", "Very high"]}
                format={(v) => energyWord(v)}
                onChange={(v) =>
                  upsertEntry(date, { energy: { level: v as 1 | 2 | 3 | 4 | 5 } })
                }
              />
            </Card>
          </section>

          {/* Sleep */}
          <section id="sleep">
            <SectionLabel>Sleep</SectionLabel>
            <Card className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-ink">Hours slept</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={16}
                  step={0.5}
                  value={entry?.sleep?.hours ?? ""}
                  onChange={(e) =>
                    upsertEntry(date, {
                      sleep: {
                        hours: e.target.value === "" ? undefined : Number(e.target.value),
                        quality: entry?.sleep?.quality,
                      },
                    })
                  }
                  className="w-24 rounded-xl border border-line bg-surface px-3 py-2 text-right text-[15px] text-ink"
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-semibold text-muted">Quality</p>
                <ChipGroup<SleepQuality>
                  single
                  options={SLEEP_QUALITY_OPTIONS}
                  value={entry?.sleep?.quality ? [entry.sleep.quality] : []}
                  onChange={(next) =>
                    upsertEntry(date, {
                      sleep: { hours: entry?.sleep?.hours, quality: next[0] },
                    })
                  }
                />
              </div>
            </Card>
          </section>

          {/* Symptoms */}
          <section id="symptoms">
            <SectionLabel>Symptoms</SectionLabel>
            <Card>
              <ChipGroup<SymptomType>
                options={SYMPTOM_OPTIONS}
                value={symptomTypes}
                onChange={(next) =>
                  upsertEntry(date, {
                    symptomsSet: next.map((type) => ({ type })),
                  })
                }
              />
            </Card>
          </section>

          {/* Activity */}
          <section id="activity">
            <SectionLabel>Activity</SectionLabel>
            <Card>
              <ChipGroup<ActivityLevel>
                single
                options={ACTIVITY_OPTIONS}
                value={entry?.activity ? [entry.activity.level] : []}
                onChange={(next) =>
                  upsertEntry(date, {
                    activity: next[0] ? { level: next[0] } : undefined,
                  })
                }
              />
            </Card>
          </section>

          {/* Notes */}
          <section id="notes">
            <SectionLabel>Notes</SectionLabel>
            <Card>
              <textarea
                rows={4}
                value={entry?.notes ?? ""}
                onChange={(e) => upsertEntry(date, { notes: e.target.value })}
                placeholder="Anything else worth remembering about today…"
                className="w-full rounded-xl border border-line bg-surface p-3 text-[15px] leading-relaxed text-ink placeholder:text-faint"
              />
            </Card>
          </section>

          <Disclaimer />
        </Stack>
      </Screen>
    </>
  );
}
