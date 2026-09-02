/**
 * Calendar-date helpers. Everything works on `YYYY-MM-DD` strings interpreted
 * in local time so "today" matches the device. No external date library —
 * keeps the domain layer portable to React Native.
 */

import type { IsoDate } from "@/models";

export const MS_PER_DAY = 86_400_000;

export function todayIso(now: Date = new Date()): IsoDate {
  return toIso(now);
}

export function toIso(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse an ISO calendar date into a local-midnight Date. */
export function fromIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** Whole days from `a` to `b` (b - a). Negative if b is before a. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / MS_PER_DAY);
}

export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b;
}

export function isSameDay(a: IsoDate, b: IsoDate): boolean {
  return a === b;
}

export function clampIso(iso: IsoDate, min: IsoDate, max: IsoDate): IsoDate {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

export function startOfMonth(iso: IsoDate): IsoDate {
  const d = fromIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(iso: IsoDate): IsoDate {
  const d = fromIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const d = fromIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + months, d.getDate()));
}

/** Monday=1 style weekday index remapped so `weekStartsOn` is column 0. */
export function weekdayOffset(iso: IsoDate, weekStartsOn: 0 | 1): number {
  const dow = fromIso(iso).getDay(); // 0 Sun – 6 Sat
  return (dow - weekStartsOn + 7) % 7;
}

const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const SHORT_DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatLongDate(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${LONG_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatMediumDate(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatDowMedium(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${SHORT_DOW[d.getDay()]} ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatMonthYear(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeDayLabel(iso: IsoDate, ref: IsoDate = todayIso()): string {
  const diff = daysBetween(ref, iso);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

export { SHORT_DOW, SHORT_MONTHS };
