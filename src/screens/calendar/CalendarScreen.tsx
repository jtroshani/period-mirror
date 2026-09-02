import { useMemo, useState } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { Screen } from "@/components/layout/Screen";
import { Card, IconButton } from "@/components/ui/primitives";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { DayDetailSheet } from "./DayDetailSheet";
import { useAppStore } from "@/store/useAppStore";
import { useCycles, useCyclePosition, useEntries, useUser } from "@/store/selectors";
import { useFmt, useT } from "@/i18n";
import { dowLetters } from "@/i18n/format";
import {
  addDays,
  addMonths,
  fromIso,
  startOfMonth,
  todayIso,
  toIso,
  weekdayOffset,
} from "@/utils/date";
import { averageCycleLength, isBleedingDay, predictNextCycle } from "@/engine/cycles";
import type { IsoDate } from "@/models";

export function CalendarScreen() {
  const entries = useEntries();
  const cycles = useCycles();
  const user = useUser();
  const t = useT();
  const fmt = useFmt();
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn);
  const showFertile = useAppStore((s) => s.settings.showFertileWindow);

  const [cursor, setCursor] = useState(() => startOfMonth(todayIso()));
  const [selected, setSelected] = useState<IsoDate | null>(null);

  const today = todayIso();

  const predictedPeriodDays = useMemo(() => {
    const set = new Set<IsoDate>();
    const next = predictNextCycle(entries, user);
    if (!next) return set;
    const avg = Math.round(averageCycleLength(cycles, user));
    const periodLen = next.periodLengthDays ?? 5;
    for (let cyc = 0; cyc < 3; cyc++) {
      const start = addDays(next.startDate, cyc * avg);
      for (let d = 0; d < periodLen; d++) set.add(addDays(start, d));
    }
    return set;
  }, [entries, user, cycles]);

  const fertileDays = useMemo(() => {
    const set = new Set<IsoDate>();
    if (!showFertile) return set;
    const next = predictNextCycle(entries, user);
    if (!next) return set;
    const avg = Math.round(averageCycleLength(cycles, user));
    for (let cyc = -1; cyc < 3; cyc++) {
      const periodStart = addDays(next.startDate, cyc * avg);
      const ov = addDays(periodStart, -14);
      for (let d = -3; d <= 1; d++) set.add(addDays(ov, d));
    }
    return set;
  }, [entries, user, cycles, showFertile]);

  const weeks = useMemo(() => buildGrid(cursor, weekStartsOn), [cursor, weekStartsOn]);
  const monthIndex = fromIso(cursor).getMonth();
  const orderedDow = dowLetters(t.lang, weekStartsOn);
  const position = useCyclePosition();

  return (
    <>
      <AppBar title={t("calendar.title")} />
      <Screen>
        <div className="mb-2 mt-1 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">{fmt.monthYear(cursor)}</h2>
          <div className="flex gap-0.5">
            <IconButton label={t("common.back")} className="h-9 w-9" onClick={() => setCursor(addMonths(cursor, -1))}>
              <IconChevronLeft size={20} />
            </IconButton>
            <IconButton label={t("common.continue")} className="h-9 w-9" onClick={() => setCursor(addMonths(cursor, 1))}>
              <IconChevronRight size={20} />
            </IconButton>
          </div>
        </div>

        <Card padded={false} className="overflow-hidden p-2">
          <div className="grid grid-cols-7 text-center">
            {orderedDow.map((d, i) => (
              <span key={i} className="pb-1.5 text-[11px] font-semibold text-faint">
                {d}
              </span>
            ))}
            {weeks.flat().map((date) => {
              const inMonth = fromIso(date).getMonth() === monthIndex;
              const entry = entries[date];
              const isPeriod = isBleedingDay(entry);
              const isPredicted = !isPeriod && date > today && predictedPeriodDays.has(date);
              const isFertile = fertileDays.has(date);
              const hasPain = (entry?.pain?.level ?? 0) >= 4;
              const hasSymptoms = (entry?.symptoms.length ?? 0) > 0;
              const isToday = date === today;

              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={`relative flex h-[42px] flex-col items-center justify-center rounded-lg text-[13px] ${
                    inMonth ? "text-ink" : "text-faint/40"
                  } ${isToday ? "ring-1 ring-primary" : ""} pm-pressable`}
                >
                  <span
                    className={`flex h-[26px] w-[26px] items-center justify-center rounded-full ${
                      isPeriod
                        ? "bg-primary font-semibold text-white"
                        : isPredicted
                          ? "border border-dashed border-primary text-primary"
                          : ""
                    }`}
                  >
                    {fromIso(date).getDate()}
                  </span>
                  <span className="mt-0.5 flex h-1 items-center gap-0.5">
                    {hasPain && <span className="h-1 w-1 rounded-full bg-notice" />}
                    {hasSymptoms && <span className="h-1 w-1 rounded-full bg-info" />}
                  </span>
                  {isFertile && <span className="absolute bottom-0.5 h-0.5 w-3.5 rounded-full bg-accent/70" />}
                </button>
              );
            })}
          </div>
        </Card>

        {position && (
          <Card className="mt-2.5 flex items-center justify-between px-3.5 py-3 text-[13px]">
            <span className="text-ink">
              {position.isPeriod && position.periodDay
                ? t("today.periodDay", { n: position.periodDay })
                : t("today.cycleDay", { n: position.cycleDay })}
              {position.isPeriod ? ` · ${t("today.ofYourPeriod")}` : ` · ${t.enum("phase", position.phase)}`}
            </span>
            {position.predictedNextPeriodStart && (
              <span className="text-muted">
                {t("calendar.nextPeriod")}{" "}
                <span className="font-semibold text-ink">{fmt.mediumDate(position.predictedNextPeriodStart)}</span>
              </span>
            )}
          </Card>
        )}

        <Card className="mt-2.5">
          <p className="mb-2 text-[12px] font-semibold text-muted">{t("calendar.legend")}</p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-muted">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full bg-primary" /> {t("calendar.legRecorded")}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full border border-dashed border-primary" />{" "}
              {t("calendar.legPredicted")}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-notice" /> {t("calendar.legPain")}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-info" /> {t("calendar.legSymptoms")}
            </li>
            {showFertile && (
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-4 rounded-full bg-accent/70" /> {t("calendar.legFertile")}
              </li>
            )}
          </ul>
          <p className="mt-2.5 text-[11px] leading-snug text-faint">{t("calendar.predictedNote")}</p>
        </Card>
      </Screen>

      <DayDetailSheet
        date={selected}
        entry={selected ? entries[selected] : undefined}
        predictedPeriod={
          selected ? predictedPeriodDays.has(selected) && !isBleedingDay(entries[selected]) : false
        }
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function buildGrid(monthStart: IsoDate, weekStartsOn: 0 | 1): IsoDate[][] {
  const lead = weekdayOffset(monthStart, weekStartsOn);
  const first = addDays(monthStart, -lead);
  const weeks: IsoDate[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: IsoDate[] = [];
    for (let d = 0; d < 7; d++) row.push(toIso(fromIso(addDays(first, w * 7 + d))));
    weeks.push(row);
  }
  return weeks;
}
