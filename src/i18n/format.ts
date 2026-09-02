/**
 * Locale-aware presentation formatting. Wraps `Intl` so components don't hand-
 * roll month names, and keeps relative-day wording translatable.
 */
import type { IsoDate, Lang } from "@/models";
import { daysBetween, fromIso, todayIso } from "@/utils/date";
import { translate } from "./core";

const LOCALE: Record<Lang, string> = { en: "en-GB", it: "it-IT" };

const cache = new Map<string, Intl.DateTimeFormat>();
function dtf(lang: Lang, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = lang + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE[lang], opts);
    cache.set(key, f);
  }
  return f;
}

export function fmtLongDate(lang: Lang, iso: IsoDate): string {
  return dtf(lang, { day: "numeric", month: "long", year: "numeric" }).format(fromIso(iso));
}

export function fmtMediumDate(lang: Lang, iso: IsoDate): string {
  return dtf(lang, { day: "numeric", month: "short" }).format(fromIso(iso));
}

export function fmtMonthYear(lang: Lang, iso: IsoDate): string {
  const s = dtf(lang, { month: "long", year: "numeric" }).format(fromIso(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtDowMedium(lang: Lang, iso: IsoDate): string {
  return dtf(lang, { weekday: "short", day: "numeric", month: "short" }).format(fromIso(iso));
}

export function fmtRelativeDay(lang: Lang, iso: IsoDate, ref: IsoDate = todayIso()): string {
  const diff = daysBetween(ref, iso);
  if (diff === 0) return translate(lang, "common.today");
  if (diff === -1) return translate(lang, "common.yesterday");
  if (diff === 1) return translate(lang, "common.tomorrow");
  if (diff < 0) return translate(lang, "common.daysAgo", { n: Math.abs(diff) });
  return translate(lang, "common.inDays", { n: diff });
}

export function fmtHours(lang: Lang, hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours)) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const mUnit = lang === "it" ? "min" : "m";
  if (m === 0) return `${h}h`;
  return `${h}h ${`${m}`.padStart(2, "0")}${mUnit}`;
}

/** Single-letter weekday headers for the calendar, ordered from `weekStartsOn`. */
export function dowLetters(lang: Lang, weekStartsOn: 0 | 1): string[] {
  const base: string[] = [];
  // 2023-01-01 is a Sunday.
  for (let i = 0; i < 7; i++) {
    const d = new Date(2023, 0, 1 + i);
    base.push(dtf(lang, { weekday: "narrow" }).format(d).toUpperCase());
  }
  return [...base.slice(weekStartsOn), ...base.slice(0, weekStartsOn)];
}
