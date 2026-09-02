/** React bindings for the i18n core. */
import { useMemo } from "react";
import type { IsoDate, Lang } from "@/models";
import { useAppStore } from "@/store/useAppStore";
import { makeT, type TFn } from "./core";
import {
  fmtDowMedium,
  fmtHours,
  fmtLongDate,
  fmtMediumDate,
  fmtMonthYear,
  fmtRelativeDay,
} from "./format";

export * from "./core";

export function useT(): TFn {
  const lang = useAppStore((s) => s.settings.language);
  return useMemo(() => makeT(lang), [lang]);
}

export function useLang(): Lang {
  return useAppStore((s) => s.settings.language);
}

/** Formatters bound to the current language. */
export function useFmt() {
  const lang = useAppStore((s) => s.settings.language);
  return useMemo(
    () => ({
      lang,
      longDate: (iso: IsoDate) => fmtLongDate(lang, iso),
      mediumDate: (iso: IsoDate) => fmtMediumDate(lang, iso),
      monthYear: (iso: IsoDate) => fmtMonthYear(lang, iso),
      dow: (iso: IsoDate) => fmtDowMedium(lang, iso),
      relativeDay: (iso: IsoDate, ref?: IsoDate) => fmtRelativeDay(lang, iso, ref),
      hours: (h: number | null | undefined) => fmtHours(lang, h),
    }),
    [lang],
  );
}
