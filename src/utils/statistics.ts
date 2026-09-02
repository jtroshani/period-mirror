/**
 * Small, transparent statistics helpers used by the baseline engine.
 * Deliberately plain so the maths behind every insight can be explained.
 */

import type { MetricSummary } from "@/models";

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Sample standard deviation (n - 1). Returns 0 for < 2 values. */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function summarize(values: number[]): MetricSummary {
  const clean = values.filter((v) => Number.isFinite(v));
  return {
    n: clean.length,
    mean: round(mean(clean), 2),
    median: round(median(clean), 2),
    sd: round(stdDev(clean), 2),
    min: clean.length ? Math.min(...clean) : 0,
    max: clean.length ? Math.max(...clean) : 0,
  };
}

/** Percentage change from `base` to `current`. Null when base is ~0. */
export function percentChange(current: number, base: number): number | null {
  if (Math.abs(base) < 1e-9) return null;
  return round(((current - base) / base) * 100, 1);
}

/**
 * Slope of a simple least-squares line fit — used for trend direction over the
 * last N cycles. `xs` is typically [0, 1, 2, ...] (cycle index).
 */
export function linearSlope(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function round(value: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** z-score of `value` against a distribution; 0 when sd is 0. */
export function zScore(value: number, distMean: number, distSd: number): number {
  if (distSd < 1e-9) return 0;
  return (value - distMean) / distSd;
}
