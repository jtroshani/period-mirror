import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Badge, Button, StatValue } from "@/components/ui/primitives";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ComparisonBar } from "@/components/charts/ComparisonBar";
import { MiniBars } from "@/components/charts/MiniBars";
import { Sheet } from "@/components/ui/Sheet";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { IconLock, IconArrowRight, IconInfo } from "@/components/ui/icons";
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
  const hero = usable.find((c) => c.metric === "early_period_pain" && c.severity !== "none");
  const noticeCmps = usable.filter((c) => comparisonCategory(c) === "NOTICE");

  const whyFromCmp = (c: MetricComparison): Why => ({
    title: t("mirror.whyTitle"),
    body: comparisonExplanation(t.lang, c),
    rows: cmpRows(t, fmt, c),
    guidance: comparisonGuidance(t.lang, c),
  });
  const whyFromTrend = (tr: BaselineTrend): Why => ({
    title: trendTitle(t.lang, tr),
    body: trendDetail(t.lang, tr),
    rows: [
      { label: t("mirror.evConfidence"), value: t(`mirror.${tr.direction === "increasing" ? "badgeHigher" : "badgeLower"}`) },
      { label: t("common.day"), value: `${tr.changePerCycle}` },
      { label: "Window", value: `${tr.windowCycles}` },
    ],
    guidance: trendGuidance(t.lang, tr),
  });

  return (
    <>
      <AppBar title={t("mirror.title")} />
      <Screen>
        <Stack>
          <Card className="flex items-center gap-4">
            <ProgressRing
              progress={readiness.progress}
              size={92}
              stroke={8}
              label={`${readiness.cyclesHave}/${readiness.cyclesNeeded}`}
            />
            <div className="flex-1">
              <p className="font-display text-lg text-ink">
                {ready ? t("mirror.readyTitle") : t("mirror.learningTitle")}
              </p>
              <p className="mt-1 text-sm text-muted">{readinessMessage(t.lang, readiness)}</p>
            </div>
          </Card>

          <div>
            <SectionLabel>{t("mirror.usualPattern")}</SectionLabel>
            <Card className="grid grid-cols-2 gap-y-5">
              <UsualStat
                label={t("mirror.avgCycle")}
                value={baseline.cycleLength.n ? t("onboarding.daysN", { n: round(baseline.cycleLength.mean, 0) }) : "—"}
                sub={
                  baseline.cycleLength.n
                    ? t("mirror.typicalVariation", { n: round(baseline.cycleLength.sd || 1, 1) })
                    : t("mirror.needs2Cycles")
                }
              />
              <UsualStat
                label={t("mirror.typicalPeriod")}
                value={baseline.periodDuration.n ? t("onboarding.daysN", { n: round(baseline.periodDuration.mean, 0) }) : "—"}
              />
              <UsualStat
                label={t("mirror.day13Pain")}
                value={baseline.earlyPeriodPain.n ? `${round(baseline.earlyPeriodPain.mean, 1)} / 10` : "—"}
                sub={
                  baseline.earlyPeriodPain.n
                    ? t("mirror.overNCycles", { n: baseline.earlyPeriodPain.n })
                    : t("mirror.needsMoreData")
                }
              />
              <UsualStat
                label={t("mirror.sleepDuringPeriod")}
                value={baseline.periodSleep.n ? fmt.hours(baseline.periodSleep.mean) : "—"}
              />
              <UsualStat
                label={t("mirror.typicalEnergy")}
                value={baseline.energyOverall.n ? `${round(baseline.energyOverall.mean, 1)} / 5` : "—"}
              />
              <UsualStat
                label={t("mirror.heavyDaysPerPeriod")}
                value={baseline.heavyDaysPerCycle.n ? `${round(baseline.heavyDaysPerCycle.mean, 1)}` : "—"}
              />
            </Card>

            {Object.keys(baseline.painByCycleDay).length > 2 && (
              <Card className="mt-3">
                <p className="pm-label mb-3">{t("mirror.painAcrossPeriod")}</p>
                <MiniBars
                  ariaLabel={t("mirror.painAcrossPeriod")}
                  unit={t("mirror.painChartUnit")}
                  max={10}
                  data={Array.from({ length: 7 }, (_, i) => {
                    const day = i + 1;
                    return {
                      label: `${day}`,
                      value: baseline.painByCycleDay[day] ?? 0,
                      highlight: day <= 3,
                    };
                  })}
                />
              </Card>
            )}
          </div>

          {!isPremium ? (
            <Card className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <IconLock size={20} />
              </span>
              <p className="mt-3 font-display text-lg text-ink">{t("mirror.lockedTitle")}</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{t("mirror.lockedBody")}</p>
              <Button className="mt-4" onClick={() => navigate("/profile/subscription")}>
                {t("mirror.seePremium")}
              </Button>
            </Card>
          ) : (
            <>
              {hero && (
                <div>
                  <SectionLabel>{t("mirror.differentFromUsual")}</SectionLabel>
                  <Card className="border border-notice/30">
                    <p className="font-display text-lg text-ink">
                      {t("today.qlPain")} — {t.enum("phase", "menstrual").toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm text-muted">{t("mirror.heroPainBody")}</p>
                    <div className="my-4 flex items-end gap-6">
                      <StatValue
                        value={`${round(hero.currentValue ?? 0, 1)}`}
                        unit="/10"
                        caption={t("mirror.thisCycle")}
                        tone="primary"
                      />
                      <StatValue
                        value={`${round(hero.baselineValue ?? 0, 1)}`}
                        unit="/10"
                        caption={t("mirror.yourUsual")}
                        tone="muted"
                      />
                    </div>
                    <ComparisonBar
                      currentLabel={`${round(hero.currentValue ?? 0, 1)}/10`}
                      usualLabel={`${round(hero.baselineValue ?? 0, 1)}/10`}
                      current={hero.currentValue ?? 0}
                      usual={hero.baselineValue ?? 0}
                      scaleMax={10}
                      severity={hero.severity}
                    />
                    <p className="mt-3 text-xs text-muted">
                      {t("mirror.basedOnNCycles", { n: hero.basisCycles })}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                      onClick={() => setWhy(whyFromCmp(hero))}
                    >
                      {t("mirror.whyAmISeeing")}
                      <IconArrowRight size={16} />
                    </button>
                  </Card>
                </div>
              )}

              <div>
                <SectionLabel>{t("mirror.thisCycleVsUsual")}</SectionLabel>
                <Stack gap="gap-2.5">
                  {usable.map((c) => (
                    <ComparisonCard key={c.id} cmp={c} onWhy={() => setWhy(whyFromCmp(c))} />
                  ))}
                  {usable.length === 0 && (
                    <Card>
                      <p className="text-sm text-muted">{t("mirror.notEnoughYet")}</p>
                    </Card>
                  )}
                </Stack>
              </div>

              <div>
                <SectionLabel>{t("mirror.changesWorthNoticing")}</SectionLabel>
                <Stack gap="gap-2.5">
                  {noticeCmps.map((c) => (
                    <NoticeRow
                      key={c.id}
                      summary={comparisonSummary(t.lang, c)}
                      badge={t("mirror.catDifferent")}
                      guidance={comparisonGuidance(t.lang, c)}
                      onWhy={() => setWhy(whyFromCmp(c))}
                    />
                  ))}
                  {baseline.trends.map((tr) => (
                    <NoticeRow
                      key={tr.id}
                      summary={trendSummary(t.lang, tr)}
                      badge={t("mirror.catTrend")}
                      guidance={trendGuidance(t.lang, tr)}
                      onWhy={() => setWhy(whyFromTrend(tr))}
                    />
                  ))}
                  {noticeCmps.length === 0 && baseline.trends.length === 0 && (
                    <Card>
                      <p className="text-sm text-muted">{t("mirror.nothingStandsOut")}</p>
                    </Card>
                  )}
                </Stack>
              </div>

              {baseline.symptomFrequency.length > 0 && (
                <div>
                  <SectionLabel>{t("mirror.mostLoggedSymptoms")}</SectionLabel>
                  <Card className="space-y-2.5">
                    {baseline.symptomFrequency.slice(0, 5).map((s) => (
                      <div key={s.type} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 text-sm text-ink">{t.enum("symptom", s.type)}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-primary/50"
                            style={{ width: `${Math.min(100, (s.ratePerCycle / 5) * 100)}%` }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-xs text-muted">
                          {t("mirror.perCycle", { n: s.ratePerCycle })}
                        </span>
                      </div>
                    ))}
                  </Card>
                </div>
              )}
            </>
          )}

          <Disclaimer variant="long" />
        </Stack>
      </Screen>

      <Sheet open={!!why} onClose={() => setWhy(null)} title={t("mirror.whyTitle")} subtitle={why?.title}>
        {why && (
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-ink">{why.body}</p>
            <dl className="divide-y divide-line rounded-2xl bg-surface-2 px-4">
              {why.rows.map((r) => (
                <div key={r.label} className="flex justify-between py-2.5 text-sm">
                  <dt className="text-muted">{r.label}</dt>
                  <dd className="font-medium text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
            {why.guidance && (
              <p className="flex items-start gap-2 rounded-2xl bg-notice-soft/60 p-3 text-sm text-ink">
                <IconInfo size={16} className="mt-0.5 shrink-0 text-notice" />
                {why.guidance}
              </p>
            )}
            <p className="text-xs text-faint">{t("mirror.whyFootnote")}</p>
          </div>
        )}
      </Sheet>
    </>
  );
}

function UsualStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-1">
      <p className="pm-label mb-1">{label}</p>
      <p className="font-display text-xl text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </div>
  );
}

function cmpRows(
  t: TFn,
  fmt: ReturnType<typeof useFmt>,
  c: MetricComparison,
): { label: string; value: string }[] {
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

function ComparisonCard({ cmp, onWhy }: { cmp: MetricComparison; onWhy: () => void }) {
  const t = useT();
  const fmt = useFmt();
  const badge =
    cmp.direction === "higher"
      ? t("mirror.badgeHigher")
      : cmp.direction === "lower"
        ? t("mirror.badgeLower")
        : t("mirror.badgeWithin");
  const tone = cmp.severity === "none" ? "normal" : "notice";
  const f = (v: number | null) =>
    v == null ? "—" : cmp.metric === "period_sleep" ? fmt.hours(v) : `${round(v, 1)}${cmp.unit ?? ""}`;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-ink">{cmpMetricLabel(t, cmp.metric)}</p>
          <p className="mt-0.5 text-sm text-muted">
            {f(cmp.currentValue)}{" "}
            <span className="text-faint">· {t("mirror.yourUsual").toLowerCase()}</span>{" "}
            {f(cmp.baselineValue)}
          </p>
        </div>
        <Badge tone={tone}>{badge}</Badge>
      </div>
      <button className="mt-2 text-sm font-semibold text-primary" onClick={onWhy}>
        {t("mirror.whyAmISeeing")}
      </button>
    </Card>
  );
}

function NoticeRow({
  summary,
  badge,
  guidance,
  onWhy,
}: {
  summary: string;
  badge: string;
  guidance?: string;
  onWhy: () => void;
}) {
  const t = useT();
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium text-ink">{summary}</p>
        <Badge tone="notice">{badge}</Badge>
      </div>
      {guidance && <p className="mt-2 text-sm text-muted">{guidance}</p>}
      <button className="mt-2 text-sm font-semibold text-primary" onClick={onWhy}>
        {t("mirror.seeWhy")}
      </button>
    </Card>
  );
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
