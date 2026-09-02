import { describe, expect, it } from "vitest";
import { buildDemoSnapshot } from "@/demo/demoData";
import { deriveCycles, completedCycles } from "@/engine/cycles";
import { buildBaseline } from "@/engine/baseline/baselineEngine";
import { compareCurrentCycle } from "@/engine/baseline/comparison";
import { buildInsights } from "@/engine/insights/insightEngine";
import { evaluateCheckInText } from "@/engine/safety/safetyEngine";
import {
  linearSlope,
  mean,
  median,
  percentChange,
  stdDev,
} from "@/utils/statistics";

describe("statistics helpers", () => {
  it("mean / median / stdDev", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(stdDev([4, 4, 4])).toBe(0);
    expect(stdDev([2, 4])).toBeCloseTo(1.4142, 3);
  });

  it("percentChange guards divide-by-zero", () => {
    expect(percentChange(8, 4)).toBe(100);
    expect(percentChange(4, 0)).toBeNull();
  });

  it("linearSlope detects an upward trend", () => {
    expect(linearSlope([0, 1, 2, 3], [28, 30, 32, 34])).toBeCloseTo(2, 5);
    expect(linearSlope([0, 1, 2], [5, 5, 5])).toBe(0);
  });
});

describe("demo dataset shape", () => {
  const snapshot = buildDemoSnapshot();
  const cycles = deriveCycles(snapshot.entries);

  it("has an ongoing current cycle plus >= 4 completed cycles", () => {
    expect(cycles.length).toBeGreaterThanOrEqual(6);
    expect(cycles[cycles.length - 1].isOngoing).toBe(true);
    expect(completedCycles(cycles).length).toBeGreaterThanOrEqual(4);
  });

  it("current cycle records higher Day 1-3 pain than earlier cycles", () => {
    const current = cycles[cycles.length - 1];
    const day1 = snapshot.entries[current.startDate];
    expect(day1?.pain?.level).toBeGreaterThanOrEqual(7);
  });
});

describe("personal baseline engine", () => {
  const snapshot = buildDemoSnapshot();
  const baseline = buildBaseline(snapshot.entries, snapshot.user);

  it("reports a usable baseline for the demo profile", () => {
    expect(["improving", "ready"]).toContain(baseline.readiness.level);
    expect(baseline.cycleLength.mean).toBeGreaterThan(27);
    expect(baseline.cycleLength.mean).toBeLessThan(34);
    expect(baseline.earlyPeriodPain.n).toBeGreaterThanOrEqual(4);
    expect(baseline.earlyPeriodPain.mean).toBeGreaterThan(2);
    expect(baseline.earlyPeriodPain.mean).toBeLessThan(6.5);
  });

  it("surfaces a gradual increase in cycle length as a trend", () => {
    const trend = baseline.trends.find((t) => t.metric === "cycle_length");
    expect(trend).toBeDefined();
    expect(trend?.direction).toBe("increasing");
  });
});

describe("current-cycle comparison + insights", () => {
  const snapshot = buildDemoSnapshot();
  const baseline = buildBaseline(snapshot.entries, snapshot.user);
  const comparisons = compareCurrentCycle(snapshot.entries, snapshot.user, baseline);
  const insights = buildInsights(comparisons, baseline);

  it("flags higher early-period pain this cycle", () => {
    const pain = comparisons.find((c) => c.metric === "early_period_pain");
    expect(pain).toBeDefined();
    expect(pain?.direction).toBe("higher");
    expect(["notable", "marked"]).toContain(pain?.severity);
    expect(pain?.currentValue ?? 0).toBeGreaterThan(pain?.baselineValue ?? 0);
    // Explanation must be transparent about the numbers used.
    expect(pain?.explanation).toMatch(/Days 1–3/);
  });

  it("produces a NOTICE insight with non-diagnostic guidance", () => {
    const notice = insights.find(
      (i) => i.category === "NOTICE" && i.metric === "early_period_pain",
    );
    expect(notice).toBeDefined();
    expect(notice?.guidance).toMatch(/healthcare professional/);
    expect(notice?.title.toLowerCase()).not.toMatch(/diagnos|disease|endometriosis/);
  });

  it("includes a cycle-length TREND insight", () => {
    expect(insights.some((i) => i.category === "TREND" && i.metric === "cycle_length")).toBe(true);
  });
});

describe("safety engine", () => {
  it("returns a proportionate notice for emergency-adjacent wording", () => {
    const notice = evaluateCheckInText("I fainted this morning and feel very dizzy", "2026-09-02");
    expect(notice).not.toBeNull();
    expect(notice?.message).toMatch(/emergency service/);
  });

  it("stays silent for ordinary symptoms", () => {
    expect(
      evaluateCheckInText("Mild cramps and a bit bloated today", "2026-09-02"),
    ).toBeNull();
  });
});
