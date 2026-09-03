import type { CyclePhase } from "@/models";

/** CSS colour for each cycle phase (matches the design tokens). */
export const PHASE_COLOR: Record<CyclePhase, string> = {
  menstrual: "rgb(var(--pm-phase-menstrual))",
  follicular: "rgb(var(--pm-phase-follicular))",
  ovulatory: "rgb(var(--pm-phase-ovulation))",
  luteal: "rgb(var(--pm-phase-luteal))",
};

export const PHASE_ORDER: CyclePhase[] = [
  "menstrual",
  "follicular",
  "ovulatory",
  "luteal",
];

export interface PhaseSpan {
  phase: CyclePhase;
  /** 1-based inclusive cycle-day range. */
  startDay: number;
  endDay: number;
}

/**
 * Approximate day ranges for each phase given a cycle + period length.
 * Ovulation is placed ~14 days before the next period.
 */
export function phaseSpans(cycleLength: number, periodLength: number): PhaseSpan[] {
  const len = Math.max(20, Math.round(cycleLength));
  const period = Math.min(len - 8, Math.max(2, Math.round(periodLength)));
  const ovulation = Math.max(period + 3, len - 14);
  return [
    { phase: "menstrual", startDay: 1, endDay: period },
    { phase: "follicular", startDay: period + 1, endDay: ovulation - 2 },
    { phase: "ovulatory", startDay: ovulation - 1, endDay: ovulation + 1 },
    { phase: "luteal", startDay: ovulation + 2, endDay: len },
  ];
}
