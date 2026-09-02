import { useMemo, useState } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { Screen } from "@/components/layout/Screen";
import { Card, IconButton } from "@/components/ui/primitives";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { DayDetailSheet } from "./DayDetailSheet";
import { useAppStore } from "@/store/useAppStore";
import { useCycles, useEntries, useUser } from "@/store/selectors";
import {
  addDays,
  addMonths,
  formatMonthYear,
  fromIso,
  startOfMonth,
  todayIso,
  toIso,
  weekdayOffset,
} from "@/utils/date";
import { averageCycleLength, isBleedingDay, predictNextCycle } from "@/engine/cycles";
import type { IsoDate } from "@/models";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarScreen() {
  const entries = useEntries();
  const cycles = useCycles();
  const user = useUser();
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn);
  const showFertile = useAppStore((s) => s.settings.showFertileWindow);

  const [cursor, setCursor] = useState(() => startOfMonth(todayIso()));
  const [selected, setSelected] = useState<IsoDate | null>(null);

  const today = todayIso();

  // Predicted period windows (next two projected cycles).
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

  const orderedDow = [...DOW.slice(weekStartsOn), ...DOW.slice(0, weekStartsOn)];

  return (
    <>
      <AppBar title="Calendar" />
      <Screen>
        <div className="mb-3 mt-1 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{formatMonthYear(cursor)}</h2>
          <div className="flex gap-1">
            <IconButton label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}>
              <IconChevronLeft />
            </IconButton>
            <IconButton label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}>
              <IconChevronRight />
            </IconButton>
          </div>
        </div>

        <Card padded={false} className="overflow-hidden p-3">
          <div className="grid grid-cols-7 text-center">
            {orderedDow.map((d, i) => (
              <span key={i} className="pb-2 text-xs font-semibold text-faint">
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
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm ${
                    inMonth ? "text-ink" : "text-faint/50"
                  } ${isToday ? "ring-1 ring-primary" : ""} pm-pressable`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isPeriod
                        ? "bg-primary font-semibold text-white"
                        : isPredicted
                          ? "border border-dashed border-primary text-primary"
                          : ""
                    }`}
                  >
                    {fromIso(date).getDate()}
                  </span>
                  <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                    {hasPain && <span className="h-1.5 w-1.5 rounded-full bg-notice" />}
                    {hasSymptoms && <span className="h-1.5 w-1.5 rounded-full bg-info" />}
                  </span>
                  {isFertile && (
                    <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-accent/70" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="mt-4">
          <p className="pm-label mb-2">Legend</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted">
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-primary" /> Recorded period
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-dashed border-primary" />{" "}
              Predicted period
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-notice" /> Pain recorded (≥4)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-info" /> Symptoms logged
            </li>
            {showFertile && (
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-4 rounded-full bg-accent/70" /> Predicted fertile
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs text-faint">
            Predicted days are estimates from your recent cycles — they are not
            certain and may shift as you log more.
          </p>
        </Card>
      </Screen>

      <DayDetailSheet
        date={selected}
        entry={selected ? entries[selected] : undefined}
        predictedPeriod={selected ? predictedPeriodDays.has(selected) && !isBleedingDay(entries[selected]) : false}
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
    for (let d = 0; d < 7; d++) {
      row.push(toIso(fromIso(addDays(first, w * 7 + d))));
    }
    weeks.push(row);
  }
  return weeks;
}
