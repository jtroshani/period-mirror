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
import {
  useBaseline,
  useComparisons,
  useInsights,
  useIsPremium,
} from "@/store/selectors";
import { brand } from "@/branding/brand";
import { formatHours, formatPercent, label } from "@/utils/format";
import { round } from "@/utils/statistics";
import type { MetricComparison, PatternInsight } from "@/models";

const CATEGORY_TONE = {
  NORMAL: "normal",
  NOTICE: "notice",
  TREND: "info",
  INSUFFICIENT_DATA: "neutral",
} as const;

const CATEGORY_LABEL = {
  NORMAL: "Within usual",
  NOTICE: "Different from usual",
  TREND: "Trend",
  INSUFFICIENT_DATA: "Still learning",
} as const;

export function MirrorScreen() {
  const navigate = useNavigate();
  const baseline = useBaseline();
  const comparisons = useComparisons();
  const insights = useInsights();
  const isPremium = useIsPremium();
  const [why, setWhy] = useState<{ title: string; body: string; rows: { label: string; value: string }[]; guidance?: string } | null>(null);

  const { readiness } = baseline;
  const ready = readiness.level === "ready" || readiness.level === "improving";

  const usable = comparisons.filter((c) => c.confidence !== "insufficient");
  const hero = usable.find((c) => c.metric === "early_period_pain" && c.severity !== "none");

  return (
    <>
      <AppBar title={brand.mirrorSectionName} />
      <Screen>
        <Stack>
          {/* Learning-your-body / readiness state */}
          <Card className="flex items-center gap-4">
            <ProgressRing
              progress={readiness.progress}
              size={92}
              stroke={8}
              label={`${readiness.cyclesHave}/${readiness.cyclesNeeded}`}
            />
            <div className="flex-1">
              <p className="font-display text-lg text-ink">
                {ready ? "Your Mirror is taking shape" : "We're learning your pattern"}
              </p>
              <p className="mt-1 text-sm text-muted">{readiness.message}</p>
            </div>
          </Card>

          {/* Your usual pattern */}
          <div>
            <SectionLabel>Your usual pattern</SectionLabel>
            <Card className="grid grid-cols-2 gap-y-5">
              <UsualStat
                label="Average cycle"
                value={
                  baseline.cycleLength.n
                    ? `${round(baseline.cycleLength.mean, 0)} days`
                    : "—"
                }
                sub={
                  baseline.cycleLength.n
                    ? `typical variation ±${round(baseline.cycleLength.sd || 1, 1)} days`
                    : "needs 2+ cycles"
                }
              />
              <UsualStat
                label="Typical period"
                value={
                  baseline.periodDuration.n
                    ? `${round(baseline.periodDuration.mean, 0)} days`
                    : "—"
                }
              />
              <UsualStat
                label="Day 1–3 pain"
                value={
                  baseline.earlyPeriodPain.n
                    ? `${round(baseline.earlyPeriodPain.mean, 1)} / 10`
                    : "—"
                }
                sub={baseline.earlyPeriodPain.n ? `over ${baseline.earlyPeriodPain.n} cycles` : "needs more data"}
              />
              <UsualStat
                label="Sleep during period"
                value={
                  baseline.periodSleep.n ? formatHours(baseline.periodSleep.mean) : "—"
                }
              />
              <UsualStat
                label="Typical energy"
                value={
                  baseline.energyOverall.n
                    ? `${round(baseline.energyOverall.mean, 1)} / 5`
                    : "—"
                }
              />
              <UsualStat
                label="Heavy days / period"
                value={
                  baseline.heavyDaysPerCycle.n
                    ? `${round(baseline.heavyDaysPerCycle.mean, 1)}`
                    : "—"
                }
              />
            </Card>

            {Object.keys(baseline.painByCycleDay).length > 2 && (
              <Card className="mt-3">
                <p className="pm-label mb-3">Your typical pain across your period</p>
                <MiniBars
                  ariaLabel="Average recorded pain by cycle day"
                  unit="cycle day · average pain /10"
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

          {/* Premium gate for the personalised analysis */}
          {!isPremium ? (
            <Card className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <IconLock size={20} />
              </span>
              <p className="mt-3 font-display text-lg text-ink">
                This cycle vs. your usual
              </p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                Personalised historical comparisons and change detection are part
                of Premium. Your logging, calendar and basic stats stay free.
              </p>
              <Button className="mt-4" onClick={() => navigate("/profile/subscription")}>
                See Premium
              </Button>
            </Card>
          ) : (
            <>
              {/* Hero: "Different from your usual" */}
              {hero && (
                <div>
                  <SectionLabel>Different from your usual</SectionLabel>
                  <Card className="border border-notice/30">
                    <p className="font-display text-lg text-ink">{hero.label}</p>
                    <p className="mt-1 text-sm text-muted">
                      Your recorded pain during the first days of this period is
                      considerably higher than your recent pattern.
                    </p>
                    <div className="my-4 flex items-end gap-6">
                      <StatValue
                        value={`${round(hero.currentValue ?? 0, 1)}`}
                        unit="/10"
                        caption="This cycle"
                        tone="primary"
                      />
                      <StatValue
                        value={`${round(hero.baselineValue ?? 0, 1)}`}
                        unit="/10"
                        caption="Your usual"
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
                      Based on {hero.basisCycles} previous cycles.
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                      onClick={() =>
                        setWhy({
                          title: hero.label,
                          body: hero.explanation,
                          rows: comparisonRows(hero),
                          guidance:
                            "If this change continues, becomes severe, or concerns you, consider discussing it with a healthcare professional.",
                        })
                      }
                    >
                      Why am I seeing this?
                      <IconArrowRight size={16} />
                    </button>
                  </Card>
                </div>
              )}

              {/* Full comparison list */}
              <div>
                <SectionLabel>This cycle vs. your usual</SectionLabel>
                <Stack gap="gap-2.5">
                  {usable.map((c) => (
                    <ComparisonCard
                      key={c.id}
                      cmp={c}
                      onWhy={() =>
                        setWhy({
                          title: c.label,
                          body: c.explanation,
                          rows: comparisonRows(c),
                        })
                      }
                    />
                  ))}
                  {usable.length === 0 && (
                    <Card>
                      <p className="text-sm text-muted">
                        We need a little more history before comparing this cycle
                        reliably. Keep logging — this fills in automatically.
                      </p>
                    </Card>
                  )}
                </Stack>
              </div>

              {/* Changes worth noticing */}
              <div>
                <SectionLabel>Changes worth noticing</SectionLabel>
                <Stack gap="gap-2.5">
                  {insights
                    .filter((i) => i.category === "NOTICE" || i.category === "TREND")
                    .map((i) => (
                      <InsightRow key={i.id} insight={i} onWhy={() => setWhy(insightWhy(i))} />
                    ))}
                  {insights.filter((i) => i.category === "NOTICE" || i.category === "TREND").length === 0 && (
                    <Card>
                      <p className="text-sm text-muted">
                        Nothing stands out against your own recent history right now.
                      </p>
                    </Card>
                  )}
                </Stack>
              </div>

              {/* Symptom frequency */}
              {baseline.symptomFrequency.length > 0 && (
                <div>
                  <SectionLabel>Your most logged symptoms</SectionLabel>
                  <Card className="space-y-2.5">
                    {baseline.symptomFrequency.slice(0, 5).map((s) => (
                      <div key={s.type} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 text-sm text-ink">{label(s.type)}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-primary/50"
                            style={{
                              width: `${Math.min(100, (s.ratePerCycle / 5) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-xs text-muted">
                          {s.ratePerCycle}/cycle
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

      <Sheet
        open={!!why}
        onClose={() => setWhy(null)}
        title="Why am I seeing this?"
        subtitle={why?.title}
      >
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
            <p className="text-xs text-faint">
              These are comparisons with your own recorded history, produced with
              plain statistics (averages and trend lines). They are not a
              diagnosis.
            </p>
          </div>
        )}
      </Sheet>
    </>
  );
}

function UsualStat({ label: l, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-1">
      <p className="pm-label mb-1">{l}</p>
      <p className="font-display text-xl text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </div>
  );
}

function comparisonRows(c: MetricComparison): { label: string; value: string }[] {
  const fmt = (v: number | null) => {
    if (v == null) return "—";
    if (c.metric === "period_sleep") return formatHours(v);
    return `${round(v, 1)}${c.unit ?? ""}`;
  };
  const rows = [
    { label: "This cycle", value: fmt(c.currentValue) },
    { label: "Your usual", value: fmt(c.baselineValue) },
  ];
  if (c.percentageDifference != null)
    rows.push({ label: "Difference", value: formatPercent(c.percentageDifference) });
  rows.push({ label: "Based on", value: `${c.basisCycles} previous cycles` });
  rows.push({
    label: "Confidence",
    value: { insufficient: "Low — not enough history", low: "Low", moderate: "Moderate", high: "High" }[
      c.confidence
    ],
  });
  return rows;
}

function insightWhy(i: PatternInsight) {
  return {
    title: i.title,
    body: i.detail,
    rows: i.evidence.map((e) => ({ label: e.label, value: e.value })),
    guidance: i.guidance,
  };
}

function ComparisonCard({ cmp, onWhy }: { cmp: MetricComparison; onWhy: () => void }) {
  const dirWord =
    cmp.direction === "higher"
      ? "Higher than usual"
      : cmp.direction === "lower"
        ? "Lower than usual"
        : "Within usual range";
  const tone = cmp.severity === "none" ? "normal" : "notice";
  const fmt = (v: number | null) =>
    v == null ? "—" : cmp.metric === "period_sleep" ? formatHours(v) : `${round(v, 1)}${cmp.unit ?? ""}`;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-ink">{cmp.label}</p>
          <p className="mt-0.5 text-sm text-muted">
            {fmt(cmp.currentValue)} <span className="text-faint">vs usual</span>{" "}
            {fmt(cmp.baselineValue)}
          </p>
        </div>
        <Badge tone={tone}>{dirWord}</Badge>
      </div>
      <button
        className="mt-2 text-sm font-semibold text-primary"
        onClick={onWhy}
      >
        Why am I seeing this?
      </button>
    </Card>
  );
}

function InsightRow({ insight, onWhy }: { insight: PatternInsight; onWhy: () => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium text-ink">{insight.summary}</p>
        <Badge tone={CATEGORY_TONE[insight.category]}>{CATEGORY_LABEL[insight.category]}</Badge>
      </div>
      {insight.guidance && (
        <p className="mt-2 text-sm text-muted">{insight.guidance}</p>
      )}
      <button className="mt-2 text-sm font-semibold text-primary" onClick={onWhy}>
        See why I'm seeing this
      </button>
    </Card>
  );
}
