/**
 * Derived-state hooks. Keep expensive engine calls memoised on the raw inputs
 * (`entries`, `user`) so screens can consume them freely.
 */

import { useMemo } from "react";
import type { IsoDate } from "@/models";
import { useAppStore } from "./useAppStore";
import { todayIso } from "@/utils/date";
import {
  averageCycleLength,
  averagePeriodLength,
  deriveCycles,
  getCyclePosition,
  predictNextCycle,
} from "@/engine/cycles";
import { buildBaseline } from "@/engine/baseline/baselineEngine";
import { compareCurrentCycle } from "@/engine/baseline/comparison";
import { buildInsights, pickTodayInsight } from "@/engine/insights/insightEngine";

export function useEntries() {
  return useAppStore((s) => s.entries);
}

export function useUser() {
  return useAppStore((s) => s.user);
}

export function useEntry(date: IsoDate) {
  return useAppStore((s) => s.entries[date]);
}

export function useTodayEntry() {
  return useEntry(todayIso());
}

export function useCycles() {
  const entries = useEntries();
  return useMemo(() => deriveCycles(entries), [entries]);
}

export function useCyclePosition(date: IsoDate = todayIso()) {
  const entries = useEntries();
  const user = useUser();
  return useMemo(
    () => getCyclePosition(entries, user, date),
    [entries, user, date],
  );
}

export function useCycleAverages() {
  const entries = useEntries();
  const cycles = useCycles();
  const user = useUser();
  return useMemo(
    () => ({
      cycleLength: averageCycleLength(cycles, user),
      periodLength: averagePeriodLength(cycles, user),
      predictedNext: predictNextCycle(entries, user),
    }),
    [entries, cycles, user],
  );
}

export function useBaseline() {
  const entries = useEntries();
  const user = useUser();
  return useMemo(() => buildBaseline(entries, user), [entries, user]);
}

export function useComparisons() {
  const entries = useEntries();
  const user = useUser();
  const baseline = useBaseline();
  return useMemo(
    () => compareCurrentCycle(entries, user, baseline),
    [entries, user, baseline],
  );
}

export function useInsights() {
  const comparisons = useComparisons();
  const baseline = useBaseline();
  return useMemo(() => buildInsights(comparisons, baseline), [comparisons, baseline]);
}

export function useTodayInsight() {
  const insights = useInsights();
  return useMemo(() => pickTodayInsight(insights), [insights]);
}

export function useIsPremium() {
  return useAppStore((s) => s.subscriptionTier !== "free");
}
