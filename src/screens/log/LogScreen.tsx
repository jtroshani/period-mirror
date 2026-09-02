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
import { useFmt, useT } from "@/i18n";
import { todayIso } from "@/utils/date";
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
  const t = useT();
  const fmt = useFmt();
  const date = params.get("date") ?? todayIso();
  const entry = useEntry(date);
  const upsertEntry = useAppStore((s) => s.upsertEntry);

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const painLevel = entry?.pain?.level ?? 0;
  const painLocations = entry?.pain?.locations ?? [];
  const moods = entry?.mood?.moods ?? [];
  const symptomTypes = entry?.symptoms.map((s) => s.type) ?? [];

  return (
    <>
      <AppBar
        title={date === todayIso() ? t("log.titleToday") : t("log.titleEdit")}
        back={-1}
        action={<Badge tone="neutral">{t("common.autoSaved")}</Badge>}
      />
      <Screen>
        <p className="mb-3 mt-1 text-sm text-muted">
          {t("log.intro", { date: fmt.longDate(date), rel: fmt.relativeDay(date) })}
        </p>
        <Stack>
          <section id="bleeding">
            <SectionLabel>{t("log.period")}</SectionLabel>
            <Card>
              <div className="flex flex-wrap gap-2">
                {BLEEDING_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    selected={entry?.bleeding?.level === o.value}
                    onClick={() => upsertEntry(date, { bleeding: { level: o.value as BleedingLevel } })}
                  >
                    {t.enum("bleeding", o.value)}
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
                  {t("log.noticedClots")}
                </label>
              )}
            </Card>
          </section>

          <section id="pain">
            <SectionLabel>{t("log.pain")}</SectionLabel>
            <Card className="space-y-4">
              <Slider
                label={t("log.painLevel")}
                value={painLevel}
                min={0}
                max={10}
                ends={[t("log.painEndLow"), t("log.painEndHigh")]}
                format={(v) => `${v}/10`}
                onChange={(v) => upsertEntry(date, { pain: { level: v, locations: painLocations } })}
              />
              <div>
                <p className="mb-2 text-sm font-semibold text-muted">{t("log.whereOptional")}</p>
                <ChipGroup<PainLocation>
                  options={PAIN_LOCATION_OPTIONS.map((o) => ({
                    value: o.value,
                    label: t.enum("painLocation", o.value),
                  }))}
                  value={painLocations}
                  onChange={(next) => upsertEntry(date, { pain: { level: painLevel, locations: next } })}
                />
              </div>
            </Card>
          </section>

          <section id="mood">
            <SectionLabel>{t("log.mood")}</SectionLabel>
            <Card>
              <ChipGroup<Mood>
                options={MOOD_OPTIONS.map((o) => ({ value: o.value, label: t.enum("mood", o.value) }))}
                value={moods}
                onChange={(next) => upsertEntry(date, { mood: { moods: next } })}
              />
            </Card>
          </section>

          <section id="energy">
            <SectionLabel>{t("log.energy")}</SectionLabel>
            <Card>
              <Slider
                label={t("log.energy")}
                min={1}
                max={5}
                value={entry?.energy?.level ?? 3}
                ends={[t("log.energyEndLow"), t("log.energyEndHigh")]}
                format={(v) => t.energy(v)}
                onChange={(v) => upsertEntry(date, { energy: { level: v as 1 | 2 | 3 | 4 | 5 } })}
              />
            </Card>
          </section>

          <section id="sleep">
            <SectionLabel>{t("log.sleep")}</SectionLabel>
            <Card className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-ink">{t("log.hoursSlept")}</span>
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
                <p className="mb-2 text-sm font-semibold text-muted">{t("log.quality")}</p>
                <ChipGroup<SleepQuality>
                  single
                  options={SLEEP_QUALITY_OPTIONS.map((o) => ({
                    value: o.value,
                    label: t.enum("sleepQuality", o.value),
                  }))}
                  value={entry?.sleep?.quality ? [entry.sleep.quality] : []}
                  onChange={(next) =>
                    upsertEntry(date, { sleep: { hours: entry?.sleep?.hours, quality: next[0] } })
                  }
                />
              </div>
            </Card>
          </section>

          <section id="symptoms">
            <SectionLabel>{t("log.symptoms")}</SectionLabel>
            <Card>
              <ChipGroup<SymptomType>
                options={SYMPTOM_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t.enum("symptom", o.value),
                }))}
                value={symptomTypes}
                onChange={(next) => upsertEntry(date, { symptomsSet: next.map((type) => ({ type })) })}
              />
            </Card>
          </section>

          <section id="activity">
            <SectionLabel>{t("log.activity")}</SectionLabel>
            <Card>
              <ChipGroup<ActivityLevel>
                single
                options={ACTIVITY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t.enum("activity", o.value),
                }))}
                value={entry?.activity ? [entry.activity.level] : []}
                onChange={(next) =>
                  upsertEntry(date, { activity: next[0] ? { level: next[0] } : undefined })
                }
              />
            </Card>
          </section>

          <section id="notes">
            <SectionLabel>{t("log.notes")}</SectionLabel>
            <Card>
              <textarea
                rows={4}
                value={entry?.notes ?? ""}
                onChange={(e) => upsertEntry(date, { notes: e.target.value })}
                placeholder={t("log.notesPlaceholder")}
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
