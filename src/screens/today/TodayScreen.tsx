import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Badge, Button } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/Chips";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { CycleRing } from "@/components/charts/CycleRing";
import { DaySelector, PhaseLegend } from "@/components/today/HomeBits";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SafetyBanner } from "@/components/ui/SafetyBanner";
import { IconSparkle, IconArrowRight, IconClock, IconHeart } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import {
  useBaseline,
  useComparisons,
  useCyclePosition,
  useEntries,
  useTodayEntry,
  useUser,
} from "@/store/selectors";
import { useFmt, useT } from "@/i18n";
import { todayMirrorLine } from "@/i18n/copy";
import { todayIso } from "@/utils/date";
import { evaluateEntry } from "@/engine/safety/safetyEngine";
import { BLEEDING_OPTIONS, MOOD_OPTIONS } from "@/features/logging/options";
import type { BleedingLevel, IsoDate, Mood } from "@/models";

export function TodayScreen() {
  const navigate = useNavigate();
  const t = useT();
  const user = useUser();
  const today = todayIso();
  const entry = useTodayEntry();
  const entries = useEntries();
  const position = useCyclePosition();
  const comparisons = useComparisons();
  const baseline = useBaseline();
  const upsertEntry = useAppStore((s) => s.upsertEntry);
  const showFertile = useAppStore((s) => s.settings.showFertileWindow);

  const safety = useMemo(() => (entry ? evaluateEntry(entry, today) : null), [entry, today]);
  const mirrorLine = useMemo(
    () => todayMirrorLine(t.lang, comparisons, baseline.trends),
    [t.lang, comparisons, baseline.trends],
  );

  const selectedMoods = entry?.mood?.moods ?? [];
  const name = user?.displayName?.split(" ")[0] ?? "there";
  const initials = (user?.displayName ?? "You")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const centerTop = position
    ? t(position.isPeriod && position.periodDay ? "today.periodDay" : "today.cycleDay", {
        n: position.isPeriod && position.periodDay ? position.periodDay : position.cycleDay,
      })
    : "—";
  const phaseWord = position ? t.enum("phase", position.phase) : "";
  const centerBottom = position
    ? position.isPeriod
      ? t("today.ofYourPeriod")
      : t("today.phaseLabel", { phase: phaseWord.toLowerCase() })
    : t("today.addPeriodToBegin");

  const isLogged = (d: IsoDate) => {
    const e = entries[d];
    return Boolean(e && (e.bleeding || e.pain || e.mood?.moods.length || e.energy || e.symptoms.length));
  };

  return (
    <Screen className="pt-2">
      {/* Header */}
      <div className="safe-top mb-3 mt-1 flex items-start justify-between">
        <div>
          <p className="text-[13px] text-muted">{t("today.hi", { name })}</p>
          <h1 className="mt-0.5 font-display text-[22px] font-semibold leading-tight text-ink">
            {t("today.readyLine")}
          </h1>
        </div>
        <button
          onClick={() => navigate("/profile")}
          aria-label={t("nav.profile")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-[15px] font-semibold text-primary"
        >
          {initials}
        </button>
      </div>

      <Stack>
        {safety && <SafetyBanner notice={safety} />}

        {position && (
          <DaySelector
            cycleStart={position.cycle.startDate}
            cycleDay={position.cycleDay}
            isLogged={isLogged}
          />
        )}

        {/* Cycle gauge */}
        <Card tint className="flex flex-col items-center gap-3 pb-5 pt-4">
          <CycleRing
            size={228}
            cycleLength={Math.round(
              position?.cycle.lengthDays ?? user?.typicalCycleLengthDays ?? 28,
            )}
            cycleDay={position?.cycleDay ?? 1}
            periodLength={position?.cycle.periodLengthDays ?? 5}
            fertileWindow={
              showFertile && position?.predictedFertileWindow ? { startDay: 10, endDay: 16 } : null
            }
            centerTop={centerTop}
            centerBottom={centerBottom}
          />
          <PhaseLegend />
          {position?.daysUntilNextPeriod != null && position.daysUntilNextPeriod > 0 && (
            <p className="text-[12px] text-muted">
              {t("today.nextPeriodIn")}{" "}
              <span className="font-semibold text-ink">
                {t("onboarding.daysN", { n: position.daysUntilNextPeriod })}
              </span>{" "}
              <Badge tone="neutral">{t("common.predicted")}</Badge>
            </p>
          )}
          <Button block size="lg" className="mt-1" onClick={() => navigate("/log")}>
            {t("today.logSymptoms")}
          </Button>
        </Card>

        {/* Check-in */}
        <button
          onClick={() => navigate("/checkin")}
          className="pm-pressable flex items-center gap-3 rounded-card bg-primary px-4 py-3.5 text-left text-white"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
            <IconHeart size={18} />
          </span>
          <span className="flex-1 text-[15px] font-semibold">{t("today.checkInCta")}</span>
          <IconArrowRight size={18} className="shrink-0 text-white/80" />
        </button>

        {/* Today's mirror */}
        <div>
          <SectionLabel>{t("today.mirrorSection")}</SectionLabel>
          <Card
            className="pm-pressable flex items-start gap-3 text-left"
            as="article"
            onClick={() => navigate("/mirror")}
            role="button"
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              {mirrorLine ? <IconSparkle size={16} /> : <IconClock size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              {mirrorLine ? (
                <>
                  <p className="text-[14px] leading-snug text-ink">{mirrorLine}</p>
                  <p className="mt-1 text-[13px] font-medium text-primary">{t("today.openMirror")} →</p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-medium text-ink">{t("today.learningLine")}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{t("today.learningBody")}</p>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Quick log */}
        <div>
          <SectionLabel
            action={
              <button className="text-[13px] font-medium text-primary" onClick={() => navigate("/log")}>
                {t("today.openFullLog")}
              </button>
            }
          >
            {t("today.quickLog")}
          </SectionLabel>
          <Card className="space-y-3.5">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-muted">{t("today.qlBleeding")}</p>
              <SegmentedControl<BleedingLevel | "">
                size="sm"
                label={t("today.qlBleeding")}
                value={(entry?.bleeding?.level as BleedingLevel) ?? ""}
                onChange={(v) => v && upsertEntry(today, { bleeding: { level: v as BleedingLevel } })}
                options={BLEEDING_OPTIONS.filter((o) => o.value !== "spotting").map((o) => ({
                  value: o.value,
                  label: t.enum("bleeding", o.value),
                }))}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-muted">{t("today.qlMood")}</p>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((o) => {
                  const on = selectedMoods.includes(o.value);
                  return (
                    <Chip
                      key={o.value}
                      size="sm"
                      selected={on}
                      onClick={() =>
                        upsertEntry(today, {
                          mood: {
                            moods: on
                              ? selectedMoods.filter((m) => m !== o.value)
                              : [...selectedMoods, o.value as Mood],
                          },
                        })
                      }
                    >
                      {t.enum("mood", o.value)}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[12px] font-semibold text-muted">{t("today.qlEnergy")}</p>
              <Slider
                label={t("today.qlEnergyQ")}
                min={1}
                max={5}
                value={entry?.energy?.level ?? 3}
                ends={[t("log.energyEndLow"), t("log.energyEndHigh")]}
                format={(v) => t.energy(v)}
                onChange={(v) => upsertEntry(today, { energy: { level: v as 1 | 2 | 3 | 4 | 5 } })}
              />
            </div>
          </Card>
        </div>

        {/* Today's history */}
        <div>
          <SectionLabel
            action={
              <button className="text-[13px] font-medium text-primary" onClick={() => navigate("/log")}>
                {t("common.edit")}
              </button>
            }
          >
            {t("today.historyTitle")}
          </SectionLabel>
          <Card>
            <TodaySummary entry={entry} />
          </Card>
        </div>

        <Disclaimer />
      </Stack>
    </Screen>
  );
}

function TodaySummary({ entry }: { entry: ReturnType<typeof useTodayEntry> }) {
  const t = useT();
  const fmt = useFmt();
  if (!entry) return <p className="text-[13px] text-muted">{t("today.historyEmpty")}</p>;
  const rows: { k: string; v: string }[] = [];
  if (entry.bleeding) rows.push({ k: t("today.rowBleeding"), v: t.enum("bleeding", entry.bleeding.level) });
  if (entry.pain)
    rows.push({
      k: t("today.rowPain"),
      v: `${entry.pain.level}/10${
        entry.pain.locations.length
          ? ` · ${entry.pain.locations.map((l) => t.enum("painLocation", l)).join(", ")}`
          : ""
      }`,
    });
  if (entry.mood?.moods.length)
    rows.push({ k: t("today.rowMood"), v: entry.mood.moods.map((m) => t.enum("mood", m)).join(", ") });
  if (entry.energy) rows.push({ k: t("today.rowEnergy"), v: t.energy(entry.energy.level) });
  if (entry.sleep?.hours != null) rows.push({ k: t("today.rowSleep"), v: fmt.hours(entry.sleep.hours) });
  if (entry.symptoms.length)
    rows.push({
      k: t("today.rowSymptoms"),
      v: entry.symptoms.map((s) => t.enum("symptom", s.type)).join(", "),
    });
  if (entry.notes) rows.push({ k: t("today.rowNote"), v: entry.notes });

  if (rows.length === 0) return <p className="text-[13px] text-muted">{t("today.historyEmpty")}</p>;
  return (
    <dl className="divide-y divide-line/70">
      {rows.map((r) => (
        <div key={r.k} className="flex gap-3 py-1.5 text-[13px] first:pt-0 last:pb-0">
          <dt className="w-[88px] shrink-0 leading-tight text-muted">{r.k}</dt>
          <dd className="min-w-0 flex-1 text-ink">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
