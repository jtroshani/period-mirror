import { useNavigate } from "react-router-dom";
import type { CyclePhase, IsoDate } from "@/models";
import { addDays, todayIso } from "@/utils/date";
import { PHASE_COLOR, PHASE_ORDER } from "@/features/cycle/phases";
import { useT } from "@/i18n";
import { IconCheck } from "@/components/ui/icons";

/** Horizontal cycle-day strip. Logged past days get a check; today a ring. */
export function DaySelector({
  cycleStart,
  cycleDay,
  isLogged,
}: {
  cycleStart: IsoDate;
  cycleDay: number;
  isLogged: (date: IsoDate) => boolean;
}) {
  const navigate = useNavigate();
  const t = useT();
  const today = todayIso();
  const first = Math.max(1, cycleDay - 2);
  const days = Array.from({ length: 7 }, (_, i) => first + i);

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {days.map((d) => {
        const date = addDays(cycleStart, d - 1);
        const isToday = date === today;
        const isFuture = date > today;
        const logged = !isFuture && isLogged(date);
        return (
          <button
            key={d}
            onClick={() => !isFuture && navigate(`/log?date=${date}`)}
            disabled={isFuture}
            className={`pm-pressable flex w-[62px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 ${
              isToday ? "bg-primary text-white" : "bg-surface text-ink"
            } ${isFuture ? "opacity-45" : ""}`}
          >
            <span className="text-[12px] font-medium">
              {isToday ? t("common.today") : t("today.cycleDay", { n: d })}
            </span>
            <span
              className={`grid h-6 w-6 place-items-center rounded-full border ${
                isToday
                  ? "border-white/60"
                  : logged
                    ? "border-normal bg-normal-soft text-normal"
                    : "border-line text-transparent"
              }`}
            >
              {isToday ? (
                <span className="h-2 w-2 rounded-full bg-white" />
              ) : (
                <IconCheck size={13} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Legend of the four cycle phases. */
export function PhaseLegend() {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {PHASE_ORDER.map((p) => (
        <span key={p} className="flex items-center gap-1.5 text-[11px] text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: PHASE_COLOR[p as CyclePhase] }}
          />
          {t.enum("phase", p)}
        </span>
      ))}
    </div>
  );
}
