/**
 * Framework-free i18n core. `t("area.key", { var })` with `{var}` interpolation
 * and English fallback for missing Italian keys. No React, no store imports —
 * safe for services and the engine-copy layer.
 */
import type { Lang } from "@/models";
import { en, it } from "./dict";

const DICTS: Record<Lang, unknown> = { en, it };

function lookup(dict: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, dict);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`,
  );
}

export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = lookup(DICTS[lang], key) ?? lookup(en, key);
  if (typeof raw === "string") return interpolate(raw, vars);
  return key;
}

export function translateRaw<T = unknown>(lang: Lang, key: string): T {
  return (lookup(DICTS[lang], key) ?? lookup(en, key)) as T;
}

export type EnumKind =
  | "bleeding"
  | "mood"
  | "painLocation"
  | "symptom"
  | "activity"
  | "sleepQuality"
  | "phase"
  | "vital"
  | "regularity";

export type TFn = ((key: string, vars?: Record<string, string | number>) => string) & {
  lang: Lang;
  raw: <T = unknown>(key: string) => T;
  enum: (kind: EnumKind, value: string) => string;
  energy: (level: number | null | undefined) => string;
};

export function makeT(lang: Lang): TFn {
  const fn = ((key: string, vars?: Record<string, string | number>) =>
    translate(lang, key, vars)) as TFn;
  fn.lang = lang;
  fn.raw = <T,>(key: string) => translateRaw<T>(lang, key);
  fn.enum = (kind, value) => {
    const v =
      lookup(DICTS[lang], `enums.${kind}.${value}`) ??
      lookup(en, `enums.${kind}.${value}`);
    return typeof v === "string" ? v : value;
  };
  fn.energy = (level) => {
    if (level == null) return "—";
    const words = translateRaw<string[]>(lang, "enums.energy");
    return words[Math.round(level) - 1] ?? "—";
  };
  return fn;
}

export const LOCALES: Record<Lang, string> = { en: "en-GB", it: "it-IT" };
