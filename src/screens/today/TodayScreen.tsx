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
  useCyclePosition,
  useTodayEntry,
  useTodayInsight,
  useUser,
} from "@/store/selectors";
import { todayIso, formatLongDate } from "@/utils/date";
import { label, energyWord } from "@/utils/format";
import { evaluateEntry } from "@/engine/safety/safetyEngine";
import { MOOD_OPTIONS, BLEEDING_OPTIONS } from "@/features/logging/options";
import type { BleedingLevel, Mood } from "@/models";

function greeting(name?: string) {
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name.split(" ")[0]}` : base;
}

const INSIGHT_ICON = {
  NORMAL: IconLeaf,
  NOTICE: IconSparkle,
  TREND: IconArrowRight,
  INSUFFICIENT_DATA: IconClock,
} as const;

export function TodayScreen() {
  const navigate = useNavigate();
  const user = useUser();
  const today = todayIso();
  const entry = useTodayEntry();
  const position = useCyclePosition();
  const insight = useTodayInsight();
  const upsertEntry = useAppStore((s) => s.upsertEntry);
  const showFertile = useAppStore((s) => s.settings.showFertileWindow);

  const safety = useMemo(
    () => (entry ? evaluateEntry(entry, today) : null),
    [entry, today],
  );

  const selectedMoods = entry?.mood?.moods ?? [];
  const InsightIcon = insight ? INSIGHT_ICON[insight.category] : IconLeaf;

  const centerTop = position
    ? position.isPeriod && position.periodDay
      ? `Day ${position.periodDay}`
      : `Day ${position.cycleDay}`
    : "—";
  const centerBottom = position
    ? position.isPeriod
      ? "of your period"
      : `${label(position.phase)} phase`
    : "Add a period to begin";

  return (
    <>
      <AppBar greeting={greeting(user?.displayName)} title={formatLongDate(today)} />
      <Screen>
        <Stack>
          {safety && <SafetyBanner notice={safety} />}

          {/* Current cycle */}
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
                    Next period in about{" "}
                    <span className="font-semibold text-ink">
                      {position.daysUntilNextPeriod} days
                    </span>{" "}
                    <Badge tone="neutral">predicted</Badge>
                  </>
                ) : (
                  <>A new period may be due — log it when it starts.</>
                )}
              </p>
            )}
          </Card>

          {/* Today's check-in */}
          <Card className="bg-primary text-white">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-white/15 p-2">
                <IconHeart size={20} />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg">Today's check-in</h2>
                <p className="mt-1 text-sm text-white/80">
                  Tell me how you feel in your own words. I'll help turn it into
                  something you can save.
                </p>
                <button
                  onClick={() => navigate("/checkin")}
                  className="pm-pressable mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary"
                >
                  How do I feel today?
                  <IconArrowRight size={18} />
                </button>
              </div>
            </div>
          </Card>

          {/* Quick log */}
          <div>
            <SectionLabel
              action={
                <button
                  className="text-sm font-medium text-primary"
                  onClick={() => navigate("/log")}
                >
                  Open full log
                </button>
              }
            >
              Quick log
            </SectionLabel>
            <Card padded className="space-y-4">
              <QuickBlock icon={<IconDrop size={16} />} title="Bleeding">
                <div className="flex flex-wrap gap-2">
                  {BLEEDING_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      selected={entry?.bleeding?.level === o.value}
                      onClick={() =>
                        upsertEntry(today, {
                          bleeding: { level: o.value as BleedingLevel },
                        })
                      }
                    >
                      {o.label}
                    </Chip>
                  ))}
                </div>
              </QuickBlock>

              <QuickBlock icon={<IconHeart size={16} />} title="Mood">
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
                        {o.label}
                      </Chip>
                    );
                  })}
                </div>
              </QuickBlock>

              <QuickBlock icon={<IconLeaf size={16} />} title="Energy">
                <Slider
                  label="How's your energy?"
                  min={1}
                  max={5}
                  value={entry?.energy?.level ?? 3}
                  ends={["Very low", "Very high"]}
                  format={(v) => energyWord(v)}
                  onChange={(v) =>
                    upsertEntry(today, { energy: { level: v as 1 | 2 | 3 | 4 | 5 } })
                  }
                />
              </QuickBlock>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <MiniLink label="Pain" onClick={() => navigate("/log#pain")} />
                <MiniLink label="Sleep" onClick={() => navigate("/log#sleep")} />
                <MiniLink label="Symptoms" onClick={() => navigate("/log#symptoms")} />
              </div>
            </Card>
          </div>

          {/* Today's mirror */}
          <div>
            <SectionLabel>Today's Mirror</SectionLabel>
            <Card
              className="pm-pressable text-left"
              as="article"
              onClick={() => navigate("/mirror")}
              role="button"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-primary-soft p-2 text-primary">
                  <InsightIcon size={18} />
                </span>
                <div className="flex-1">
                  {insight ? (
                    <>
                      <p className="text-[15px] font-medium text-ink">
                        {insight.summary}
                      </p>
                      <p className="mt-1.5 text-sm text-primary">Open My Mirror →</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-medium text-ink">
                        We're still learning your pattern.
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Keep logging and your Mirror will start comparing this cycle
                        with your usual.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Today's history */}
          <div>
            <SectionLabel
              action={
                <button
                  className="text-sm font-medium text-primary"
                  onClick={() => navigate("/log")}
                >
                  Edit
                </button>
              }
            >
              Today's history
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

function MiniLink({ label: l, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pm-pressable rounded-xl bg-surface-2 py-2.5 text-sm font-medium text-ink"
    >
      + {l}
    </button>
  );
}

function TodaySummary({ entry }: { entry: ReturnType<typeof useTodayEntry> }) {
  if (!entry) {
    return (
      <p className="text-sm text-muted">
        Nothing logged yet today. Use Quick log above or the check-in — partial is
        completely fine.
      </p>
    );
  }
  const rows: { k: string; v: string }[] = [];
  if (entry.bleeding) rows.push({ k: "Bleeding", v: label(entry.bleeding.level) });
  if (entry.pain)
    rows.push({
      k: "Pain",
      v: `${entry.pain.level}/10${
        entry.pain.locations.length
          ? ` · ${entry.pain.locations.map(label).join(", ")}`
          : ""
      }`,
    });
  if (entry.mood?.moods.length)
    rows.push({ k: "Mood", v: entry.mood.moods.map(label).join(", ") });
  if (entry.energy) rows.push({ k: "Energy", v: energyWord(entry.energy.level) });
  if (entry.sleep?.hours != null)
    rows.push({ k: "Sleep", v: `${entry.sleep.hours}h` });
  if (entry.symptoms.length)
    rows.push({ k: "Symptoms", v: entry.symptoms.map((s) => label(s.type)).join(", ") });
  if (entry.notes) rows.push({ k: "Note", v: entry.notes });

  if (rows.length === 0) {
    return <p className="text-sm text-muted">Nothing logged yet today.</p>;
  }
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
