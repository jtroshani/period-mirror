import { describe, expect, it } from "vitest";
import type { DailyHealthEntry, User } from "@/models";
import {
  ageBand,
  ageCycleProfile,
  averageCycleLength,
  cyclePredictionModel,
  deriveCycles,
} from "@/engine/cycles";
import { ageFromBirthYear } from "@/utils/age";
import { buildDemoSnapshot } from "@/demo/demoData";

const NOW_YEAR = new Date().getFullYear();

function user(overrides: Partial<User> = {}): User {
  return {
    id: "u",
    createdAt: new Date().toISOString(),
    isDemo: false,
    ...overrides,
  };
}

describe("age → cycle prior", () => {
  it("bands ages the way clinical patterns describe", () => {
    expect(ageBand(15)).toBe("adolescent");
    expect(ageBand(21)).toBe("young_adult");
    expect(ageBand(32)).toBe("adult");
    expect(ageBand(42)).toBe("late_reproductive");
    expect(ageBand(48)).toBe("perimenopausal");
  });

  it("gives a wider window for adolescent and perimenopausal ranges", () => {
    expect(ageCycleProfile(16)?.widerWindow).toBe(true);
    expect(ageCycleProfile(47)?.widerWindow).toBe(true);
    expect(ageCycleProfile(30)?.widerWindow).toBe(false);
    // ignores implausible values
    expect(ageCycleProfile(5)).toBeNull();
    expect(ageCycleProfile(undefined)).toBeNull();
  });

  it("uses age for the fallback cycle length when there is no history", () => {
    const noHistory: Record<string, DailyHealthEntry> = {};
    const cycles = deriveCycles(noHistory);
    const teen = averageCycleLength(cycles, user({ birthYear: NOW_YEAR - 15 }));
    const midAdult = averageCycleLength(cycles, user({ birthYear: NOW_YEAR - 32 }));
    expect(teen).toBeGreaterThan(midAdult);
    // an explicit onboarding value still wins over the age prior
    expect(
      averageCycleLength(cycles, user({ birthYear: NOW_YEAR - 15, typicalCycleLengthDays: 27 })),
    ).toBe(27);
  });
});

describe("cyclePredictionModel", () => {
  it("is age-driven with no history, personal-driven once cycles exist", () => {
    const young = cyclePredictionModel({}, user({ birthYear: NOW_YEAR - 16 }));
    expect(young.source).toBe("age");
    expect(young.ageWidensWindow).toBe(true);
    expect(young.variabilityDays).toBeGreaterThanOrEqual(4);

    const demo = buildDemoSnapshot();
    const demoModel = cyclePredictionModel(demo.entries, demo.user);
    expect(demoModel.source).toBe("personal");
    expect(demoModel.ageWidensWindow).toBe(false);
    expect(demoModel.cyclesUsed).toBeGreaterThanOrEqual(3);
  });

  it("defaults sensibly when age is unknown", () => {
    const m = cyclePredictionModel({}, user());
    expect(m.source).toBe("default");
    expect(m.variabilityDays).toBe(2);
    expect(m.ageBand).toBeNull();
  });
});

describe("ageFromBirthYear", () => {
  it("round-trips and rejects implausible values", () => {
    expect(ageFromBirthYear(NOW_YEAR - 28)).toBe(28);
    expect(ageFromBirthYear(1700)).toBeNull();
    expect(ageFromBirthYear(undefined)).toBeNull();
  });
});
