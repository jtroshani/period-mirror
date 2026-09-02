import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Badge } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/Chips";
import { Slider } from "@/components/ui/Slider";
import { CycleRing } from "@/components/charts/CycleRing";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SafetyBanner } from "@/components/ui/SafetyBanner";
import {
  IconSparkle,
  IconArrowRight,
  IconDrop,
  IconClock,
  IconLeaf,
  IconHeart,
} from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import {
  useBaseline,
  useComparisons,
  useCyclePosition,
  useTodayEntry,
  useUser,
} from "@/store/selectors";
import { useFmt, useT } from "@/i18n";
import { todayMirrorLine } from "@/i18n/copy";
import { todayIso } from "@/utils/date";
import { evaluateEntry } from "@/engine/safety/safetyEngine";
import { BLEEDING_OPTIONS, MOOD_OPTIONS } from "@/features/logging/options";
import type { BleedingLevel, Mood } from "@/models";

export function TodayScreen() {
  const navigate = useNavigate();
  const t = useT();
  const fmt = useFmt();
  const user = useUser();
  const today = todayIso();
  const entry = useTodayEntry();
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

  const hour = new Date().getHours();
  const greetingBase =
    hour < 12
      ? t("today.greetingMorning")
      : hour < 18
        ? t("today.greetingAfternoon")
        : t("today.greetingEvening");
  const greeting = user?.displayName
    ? t("today.greetingNamed", { greeting: greetingBase, name: user.displayName.split(" ")[0] })
    : greetingBase;

  const centerTop = position
    ? t(position.isPeriod && position.periodDay ? "today.periodDay" : "today.cycleDay", {
        n: position.isPeriod && position.periodDay ? position.periodDay : position.cycleDay,
      })
    : "—";
  const centerBottom = position
    ? position.isPeriod
      ? t("today.ofYourPeriod")
      : t("today.phaseLabel", { phase: t.enum("phase", position.phase).toLowerCase() })
    : t("today.addPeriodToBegin");

  return (
    <>
      <AppBar greeting={greeting} title={fmt.longDate(today)} />
      <Screen>
        <Stack>
          {safety && <SafetyBanner notice={safety} />}

          <Card className="flex flex-col items-center gap-3 pt-6">
            <CycleRing
              cycleLength={Math.round(
                position?.cycle.lengthDays ?? user?.typicalCycleLengthDays ?? 28,
              )}
              cycleDay={position?.cycleDay ?? 1}
              periodLength={position?.cycle.periodLengthDays ?? 5}
              fertileWindow={
                showFertile && position?.predictedFertileWindow
                  ? { startDay: 10, endDay: 16 }
                  : null
              }
              centerTop={centerTop}
              centerBottom={centerBottom}
            />
            {position?.daysUntilNextPeriod != null && (
              <p className="text-sm text-muted">
                {position.daysUntilNextPeriod > 0 ? (
                  <>
                    {t("today.nextPeriodIn")}{" "}
                    <span className="font-semibold text-ink">
                      {t("onboarding.daysN", { n: position.daysUntilNextPeriod })}
                    </span>{" "}
                    <Badge tone="neutral">{t("common.predicted")}</Badge>
                  </>
                ) : (
                  <>{t("today.nextPeriodDue")}</>
                )}
              </p>
            )}
          </Card>

          <Card className="bg-primary text-white">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-white/15 p-2">
                <IconHeart size={20} />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg">{t("today.checkInTitle")}</h2>
                <p className="mt-1 text-sm text-white/80">{t("today.checkInBody")}</p>
                <button
                  onClick={() => navigate("/checkin")}
                  className="pm-pressable mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary"
                >
                  {t("today.checkInCta")}
                  <IconArrowRight size={18} />
                </button>
              </div>
            </div>
          </Card>

          <div>
            <SectionLabel
              action={
                <button className="text-sm font-medium text-primary" onClick={() => navigate("/log")}>
                  {t("today.openFullLog")}
                </button>
              }
            >
              {t("today.quickLog")}
            </SectionLabel>
            <Card padded className="space-y-4">
              <QuickBlock icon={<IconDrop size={16} />} title={t("today.qlBleeding")}>
                <div className="flex flex-wrap gap-2">
                  {BLEEDING_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      selected={entry?.bleeding?.level === o.value}
                      onClick={() => upsertEntry(today, { bleeding: { level: o.value as BleedingLevel } })}
                    >
                      {t.enum("bleeding", o.value)}
                    </Chip>
                  ))}
                </div>
              </QuickBlock>

              <QuickBlock icon={<IconHeart size={16} />} title={t("today.qlMood")}>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((o) => {
                    const on = selectedMoods.includes(o.value);
                    return (
                      <Chip
                        key={o.value}
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
              </QuickBlock>

              <QuickBlock icon={<IconLeaf size={16} />} title={t("today.qlEnergy")}>
                <Slider
                  label={t("today.qlEnergyQ")}
                  min={1}
                  max={5}
                  value={entry?.energy?.level ?? 3}
                  ends={[t("log.energyEndLow"), t("log.energyEndHigh")]}
                  format={(v) => t.energy(v)}
                  onChange={(v) => upsertEntry(today, { energy: { level: v as 1 | 2 | 3 | 4 | 5 } })}
                />
              </QuickBlock>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <MiniLink label={t("today.qlPain")} onClick={() => navigate("/log#pain")} />
                <MiniLink label={t("today.qlSleep")} onClick={() => navigate("/log#sleep")} />
                <MiniLink label={t("today.qlSymptoms")} onClick={() => navigate("/log#symptoms")} />
              </div>
            </Card>
          </div>

          <div>
            <SectionLabel>{t("today.mirrorSection")}</SectionLabel>
            <Card
              className="pm-pressable text-left"
              as="article"
              onClick={() => navigate("/mirror")}
              role="button"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-primary-soft p-2 text-primary">
                  {mirrorLine ? <IconSparkle size={18} /> : <IconClock size={18} />}
                </span>
                <div className="flex-1">
                  {mirrorLine ? (
                    <>
                      <p className="text-[15px] font-medium text-ink">{mirrorLine}</p>
                      <p className="mt-1.5 text-sm text-primary">{t("today.openMirror")} →</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-medium text-ink">{t("today.learningLine")}</p>
                      <p className="mt-1 text-sm text-muted">{t("today.learningBody")}</p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <SectionLabel
              action={
                <button className="text-sm font-medium text-primary" onClick={() => navigate("/log")}>
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
    </>
  );
}

function QuickBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <span className="text-faint">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pm-pressable rounded-xl bg-surface-2 py-2.5 text-sm font-medium text-ink"
    >
      + {label}
    </button>
  );
}

function TodaySummary({ entry }: { entry: ReturnType<typeof useTodayEntry> }) {
  const t = useT();
  const fmt = useFmt();
  if (!entry) {
    return <p className="text-sm text-muted">{t("today.historyEmpty")}</p>;
  }
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

  if (rows.length === 0) return <p className="text-sm text-muted">{t("today.historyEmpty")}</p>;
  return (
    <dl className="divide-y divide-line">
      {rows.map((r) => (
        <div key={r.k} className="flex gap-4 py-2 text-sm first:pt-0 last:pb-0">
          <dt className="w-24 shrink-0 text-muted">{r.k}</dt>
          <dd className="text-ink">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
