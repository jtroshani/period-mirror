import type { IsoDate, ReportTimelineEntry } from "@/models";
import { daysBetween, fromIso } from "@/utils/date";
import { useFmt, useT, LOCALES } from "@/i18n";

interface TimelineProps {
  entries: ReportTimelineEntry[];
  from: IsoDate;
  to: IsoDate;
}

/** Six-month visual timeline of cycles + notable markers for the report. */
export function Timeline({ entries, from, to }: TimelineProps) {
  const t = useT();
  const fmt = useFmt();
  const monthFmt = new Intl.DateTimeFormat(LOCALES[t.lang], { month: "short" });
  const total = Math.max(1, daysBetween(from, to));
  const pctFor = (d: IsoDate) => (daysBetween(from, d) / total) * 100;

  // Month tick marks.
  const ticks: { pct: number; label: string }[] = [];
  const first = fromIso(from);
  const end = fromIso(to);
  let m = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  while (m <= end) {
    const iso = `${m.getFullYear()}-${`${m.getMonth() + 1}`.padStart(2, "0")}-01`;
    const p = pctFor(iso);
    if (p >= 0 && p <= 100) ticks.push({ pct: p, label: monthFmt.format(m) });
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
  }

  return (
    <div className="w-full">
      <div className="relative h-3 border-b border-line">
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute -bottom-0 top-0 w-px bg-line"
            style={{ left: `${t.pct}%` }}
          />
        ))}
      </div>
      <div className="relative mt-1 flex h-4 text-[10px] text-faint">
        {ticks.map((t, i) => (
          <span key={i} className="absolute" style={{ left: `${t.pct}%` }}>
            {t.label}
          </span>
        ))}
      </div>

      <div className="relative mt-2 space-y-2">
        {entries.map((e) => {
          const left = Math.max(0, pctFor(e.startDate));
          const width = Math.max(1.5, ((e.lengthDays ?? 5) / total) * 100);
          const periodWidth = Math.max(
            0.8,
            ((e.periodLengthDays ?? 4) / total) * 100,
          );
          const painTone =
            (e.peakPain ?? 0) >= 7
              ? "bg-notice"
              : (e.peakPain ?? 0) >= 4
                ? "bg-primary/60"
                : "bg-primary/30";
          return (
            <div key={e.cycleOrdinal} className="relative h-5">
              <div
                className="absolute top-1 h-3 rounded-full bg-surface-2"
                style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                title={`${e.cycleOrdinal} · ${fmt.mediumDate(e.startDate)}`}
              />
              <div
                className="absolute top-1 h-3 rounded-full bg-primary"
                style={{ left: `${left}%`, width: `${periodWidth}%` }}
              />
              {e.peakPain != null && (
                <span
                  className={`absolute top-1.5 h-2 w-2 rounded-full ${painTone}`}
                  style={{ left: `calc(${Math.min(left + periodWidth, 99)}% + 3px)` }}
                  title={`${e.peakPain}/10`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-primary" /> {t("report.tlPeriod")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-surface-2" /> {t("report.tlRest")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-notice" /> {t("report.tlPeak")}
        </span>
      </div>
    </div>
  );
}
