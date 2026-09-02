import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Button } from "@/components/ui/primitives";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { MiniBars } from "@/components/charts/MiniBars";
import { Sheet } from "@/components/ui/Sheet";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { IconLock, IconInfo, IconChevronRight } from "@/components/ui/icons";
import { useBaseline, useComparisons, useIsPremium } from "@/store/selectors";
import { useFmt, useT, type TFn } from "@/i18n";
import {
  comparisonCategory,
  comparisonExplanation,
  comparisonGuidance,
  comparisonSummary,
  readinessMessage,
  trendDetail,
  trendGuidance,
  trendSummary,
  trendTitle,
} from "@/i18n/copy";
import { round } from "@/utils/statistics";
import type { BaselineTrend, MetricComparison } from "@/models";

interface Why {
  title: string;
  body: string;
  rows: { label: string; value: string }[];
  guidance?: string;
}

export function MirrorScreen() {
  const navigate = useNavigate();
  const t = useT();
  const fmt = useFmt();
  const baseline = useBaseline();
  const comparisons = useComparisons();
  const isPremium = useIsPremium();
  const [why, setWhy] = useState<Why | null>(null);

  const { readiness } = baseline;
  const ready = readiness.level === "ready" || readiness.level === "improving";

  const usable = comparisons.filter((c) => c.confidence !== "insufficient");
  const notices = usable.filter((c) => comparisonCategory(c) === "NOTICE");
  const topNotice =
    usable.find((c) => c.metric === "early_period_pain" && c.severity !== "none") ?? notices[0];

  const valueOf = (c: MetricComparison, v: number | null) => {
    if (v == null) return "—";
    if (c.metric === "period_sleep") return fmt.hours(v);
    return `${round(v, c.metric === "cycle_length" || c.metric === "heavy_days" ? 0 : 1)}${c.unit ?? ""}`;
  };

  const whyFromCmp = (c: MetricComparison): Why => ({
    title: cmpMetricLabel(t, c.metric),
    body: comparisonExplanation(t.lang, c),
    rows: cmpRows(t, fmt, c),
    guidance: comparisonGuidance(t.lang, c),
  });
  const whyFromTrend = (tr: BaselineTrend): Why => ({
    title: trendTitle(t.lang, tr),
    body: trendDetail(t.lang, tr),
    rows: [{ label: t("mirror.evBasedOn"), value: `${tr.windowCycles} ${t("common.days")}` }],
    guidance: trendGuidance(t.lang, tr),
  });

  return (
    <>
      <AppBar title={t("mirror.title")} />
      <Screen>
        <Stack>
          {/* Readiness */}
          <Card className="flex items-center gap-3.5">
            <ProgressRing
              progress={readiness.progress}
              size={64}
              stroke={6}
              label={`${readiness.cyclesHave}/${readiness.cyclesNeeded}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink">
                {ready ? t("mirror.readyTitle") : t("mirror.learningTitle")}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">
                {readinessMessage(t.lang, readiness)}
              </p>
            </div>
          </Card>

          {/* Usual pattern */}
          <div>
            <SectionLabel>{t("mirror.usualPattern")}</SectionLabel>
            <Card className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              <Usual label={t("mirror.avgCycle")}
                value={baseline.cycleLength.n ? t("onboarding.daysN", { n: round(baseline.cycleLength.mean, 0) }) : "—"}
                sub={baseline.cycleLength.n ? t("mirror.typicalVariation", { n: round(baseline.cycleLength.sd || 1, 1) }) : t("mirror.needs2Cycles")}
              />
              <Usual label={t("mirror.typicalPeriod")}
                value={baseline.periodDuration.n ? t("onboarding.daysN", { n: round(baseline.periodDuration.mean, 0) }) : "—"}
              />
              <Usual label={t("mirror.day13Pain")}
                value={baseline.earlyPeriodPain.n ? `${round(baseline.earlyPeriodPain.mean, 1)} / 10` : "—"}
                sub={baseline.earlyPeriodPain.n ? t("mirror.overNCycles", { n: baseline.earlyPeriodPain.n }) : t("mirror.needsMoreData")}
              />
              <Usual label={t("mirror.sleepDuringPeriod")}
                value={baseline.periodSleep.n ? fmt.hours(baseline.periodSleep.mean) : "—"}
              />
              <Usual label={t("mirror.typicalEnergy")}
                value={baseline.energyOverall.n ? `${round(baseline.energyOverall.mean, 1)} / 5` : "—"}
              />
              <Usual label={t("mirror.heavyDaysPerPeriod")}
                value={baseline.heavyDaysPerCycle.n ? `${round(baseline.heavyDaysPerCycle.mean, 1)}` : "—"}
              />
            </Card>

            {Object.keys(baseline.painByCycleDay).length > 2 && (
              <Card className="mt-2.5">
                <p className="mb-2.5 text-[12px] font-semibold text-muted">{t("mirror.painAcrossPeriod")}</p>
                <MiniBars
                  ariaLabel={t("mirror.painAcrossPeriod")}
                  unit={t("mirror.painChartUnit")}
                  height={80}
                  data={Array.from({ length: 7 }, (_, i) => ({
                    label: `${i + 1}`,
                    value: baseline.painByCycleDay[i + 1] ?? 0,
                    highlight: i < 3,
                  }))}
                />
              </Card>
            )}
          </div>

          {/* This cycle vs usual — one consolidated list */}
          {!isPremium ? (
            <Card className="text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
                <IconLock size={18} />
              </span>
              <p className="mt-2.5 text-[15px] font-semibold text-ink">{t("mirror.lockedTitle")}</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{t("mirror.lockedBody")}</p>
              <Button className="mt-3" size="sm" onClick={() => navigate("/profile/subscription")}>
                {t("mirror.seePremium")}
              </Button>
            </Card>
          ) : (
            <div>
              <SectionLabel>{t("mirror.thisCycleVsUsual")}</SectionLabel>
              <Card padded={false} className="overflow-hidden">
                {topNotice && (
                  <div className="border-b border-line/70 bg-notice-soft/40 px-3.5 py-3">
                    <p className="text-[13px] leading-snug text-ink">{comparisonSummary(t.lang, topNotice)}</p>
                  </div>
                )}
                {usable.length === 0 ? (
                  <p className="p-3.5 text-[13px] text-muted">{t("mirror.notEnoughYet")}</p>
                ) : (
                  <ul className="divide-y divide-line/70">
                    {usable.map((c) => {
                      const notice = comparisonCategory(c) === "NOTICE";
                      return (
                        <li key={c.id}>
                          <button
                            onClick={() => setWhy(whyFromCmp(c))}
                            className="pm-pressable flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-2/50"
                          >
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${notice ? "bg-notice" : "bg-normal"}`}
                            />
                            <span className="min-w-0 flex-1 text-[14px] font-medium text-ink">
                              {cmpMetricLabel(t, c.metric)}
                            </span>
                            <span className="shrink-0 text-right text-[13px]">
                              <span className="font-semibold text-ink">{valueOf(c, c.currentValue)}</span>
                              <span className="text-faint"> · {valueOf(c, c.baselineValue)}</span>
                            </span>
                            <IconChevronRight size={16} className="shrink-0 text-faint" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {/* Trends */}
          {isPremium && baseline.trends.length > 0 && (
            <div>
              <SectionLabel>{t("mirror.catTrend")}</SectionLabel>
              <Card padded={false} className="overflow-hidden">
                <ul className="divide-y divide-line/70">
                  {baseline.trends.map((tr) => (
                    <li key={tr.id}>
                      <button
                        onClick={() => setWhy(whyFromTrend(tr))}
                        className="pm-pressable flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-surface-2/50"
                      >
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-info" />
                        <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
                          {trendSummary(t.lang, tr)}
                        </span>
                        <IconChevronRight size={16} className="mt-0.5 shrink-0 text-faint" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Symptom frequency */}
          {isPremium && baseline.symptomFrequency.length > 0 && (
            <div>
              <SectionLabel>{t("mirror.mostLoggedSymptoms")}</SectionLabel>
              <Card className="space-y-2">
                {baseline.symptomFrequency.slice(0, 4).map((s) => (
                  <div key={s.type} className="flex items-center gap-2.5">
                    <span className="w-28 shrink-0 truncate text-[13px] text-ink">{t.enum("symptom", s.type)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary/50"
                        style={{ width: `${Math.min(100, (s.ratePerCycle / 5) * 100)}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-[11px] text-muted">
                      {t("mirror.perCycle", { n: s.ratePerCycle })}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          <Disclaimer />
        </Stack>
      </Screen>

      <Sheet open={!!why} onClose={() => setWhy(null)} title={t("mirror.whyTitle")} subtitle={why?.title}>
        {why && (
          <div className="space-y-3.5">
            <p className="text-[14px] leading-relaxed text-ink">{why.body}</p>
            <dl className="divide-y divide-line/70 rounded-xl bg-surface-2 px-3.5">
              {why.rows.map((r) => (
                <div key={r.label} className="flex justify-between py-2.5 text-[13px]">
                  <dt className="text-muted">{r.label}</dt>
                  <dd className="font-medium text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
            {why.guidance && (
              <p className="flex items-start gap-2 rounded-xl bg-notice-soft/60 p-3 text-[13px] leading-snug text-ink">
                <IconInfo size={15} className="mt-0.5 shrink-0 text-notice" />
                {why.guidance}
              </p>
            )}
            <p className="text-[11px] leading-snug text-faint">{t("mirror.whyFootnote")}</p>
          </div>
        )}
      </Sheet>
    </>
  );
}

function Usual({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-h-[3.5rem]">
      <p className="text-[11px] font-semibold text-faint">{label}</p>
      <p className="mt-0.5 font-display text-[17px] text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-faint">{sub ?? " "}</p>
    </div>
  );
}

function cmpRows(t: TFn, fmt: ReturnType<typeof useFmt>, c: MetricComparison): { label: string; value: string }[] {
  const f = (v: number | null) => {
    if (v == null) return "—";
    if (c.metric === "period_sleep") return fmt.hours(v);
    return `${round(v, 1)}${c.unit ?? ""}`;
  };
  const rows = [
    { label: t("mirror.evThisCycle"), value: f(c.currentValue) },
    { label: t("mirror.evYourUsual"), value: f(c.baselineValue) },
  ];
  if (c.percentageDifference != null) {
    rows.push({
      label: t("mirror.evDifference"),
      value: `${c.percentageDifference > 0 ? "+" : ""}${Math.round(c.percentageDifference)}%`,
    });
  }
  rows.push({ label: t("mirror.evBasedOn"), value: t("common.basedOnCycles", { n: c.basisCycles }) });
  rows.push({
    label: t("mirror.evConfidence"),
    value: t(
      `mirror.${
        c.confidence === "insufficient"
          ? "confLowShort"
          : c.confidence === "low"
            ? "confLow"
            : c.confidence === "moderate"
              ? "confModerate"
              : "confHigh"
      }`,
    ),
  });
  return rows;
}

function cmpMetricLabel(t: TFn, metric: string): string {
  const map: Record<string, string> = {
    early_period_pain: t("mirror.day13Pain"),
    period_sleep: t("mirror.sleepDuringPeriod"),
    energy: t("mirror.typicalEnergy"),
    heavy_days: t("mirror.heavyDaysPerPeriod"),
    cycle_length: t("mirror.avgCycle"),
  };
  return map[metric] ?? metric;
}
