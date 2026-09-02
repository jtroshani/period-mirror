import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { brand } from "@/branding/brand";
import { Wordmark } from "@/branding/Wordmark";
import { Button } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/Chips";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { IconMirror, IconShield, IconSparkle, IconLeaf } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { todayIso } from "@/utils/date";
import type { RegularitySelfReport } from "@/models";

const SLIDES = [
  {
    Icon: IconMirror,
    title: "Meet your Period Mirror",
    body: "Understand your cycle by comparing your body with your own patterns.",
  },
  {
    Icon: IconLeaf,
    title: "Your body has its own baseline",
    body: "We gradually learn what is typical for you — your cycle length, your period, your usual pain, sleep and energy.",
  },
  {
    Icon: IconSparkle,
    title: "Notice meaningful changes",
    body: "Period Mirror can highlight changes in your recorded patterns without diagnosing medical conditions.",
  },
  {
    Icon: IconShield,
    title: "Your information stays yours",
    body: "Everything is stored on your device by default. No ads, no trackers. You control exports, sharing and AI processing.",
  },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);

  const [lastPeriod, setLastPeriod] = useState(todayIso());
  const [periodLen, setPeriodLen] = useState<number | null>(5);
  const [cycleLen, setCycleLen] = useState<number | null>(28);
  const [regularity, setRegularity] = useState<RegularitySelfReport>("not_sure");

  const isForm = step === SLIDES.length;

  const finish = () => {
    completeOnboarding({
      lastPeriodStartDate: lastPeriod,
      typicalPeriodLengthDays: periodLen ?? undefined,
      typicalCycleLengthDays: cycleLen ?? undefined,
      regularitySelfReport: regularity,
    });
    navigate("/today", { replace: true });
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-10">
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Wordmark size="sm" />
          {!isForm && (
            <button
              className="text-sm font-medium text-muted"
              onClick={() => setStep(SLIDES.length)}
            >
              Skip
            </button>
          )}
        </div>

        {/* progress dots */}
        <div className="mt-6 flex gap-1.5">
          {[...SLIDES, "form"].map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-line"}`}
            />
          ))}
        </div>

        {!isForm ? (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col justify-center py-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                {(() => {
                  const Icon = SLIDES[step].Icon;
                  return <Icon size={26} />;
                })()}
              </span>
              <h1 className="mt-6 font-display text-[28px] leading-tight text-ink">
                {SLIDES[step].title}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                {SLIDES[step].body}
              </p>
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="quiet" size="lg" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button block size="lg" onClick={() => setStep(step + 1)}>
                {step === SLIDES.length - 1 ? "Set up my Mirror" : "Continue"}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              finish();
            }}
          >
            <div className="flex-1 space-y-7 py-8">
              <h1 className="font-display text-[26px] leading-tight text-ink">
                A few essentials
              </h1>
              <p className="-mt-4 text-sm text-muted">
                Everything else you can add gradually. Nothing here is required to
                be exact.
              </p>

              <label className="block">
                <span className="text-[15px] font-medium text-ink">
                  When did your most recent period start?
                </span>
                <input
                  type="date"
                  value={lastPeriod}
                  max={todayIso()}
                  onChange={(e) => setLastPeriod(e.target.value)}
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-ink"
                />
              </label>

              <div>
                <span className="text-[15px] font-medium text-ink">
                  Typical period length
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[3, 4, 5, 6, 7].map((n) => (
                    <Chip key={n} selected={periodLen === n} onClick={() => setPeriodLen(n)}>
                      {n} days
                    </Chip>
                  ))}
                  <Chip selected={periodLen === null} onClick={() => setPeriodLen(null)}>
                    Not sure
                  </Chip>
                </div>
              </div>

              <div>
                <span className="text-[15px] font-medium text-ink">
                  Typical cycle length
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[25, 27, 28, 29, 30, 32].map((n) => (
                    <Chip key={n} selected={cycleLen === n} onClick={() => setCycleLen(n)}>
                      {n}
                    </Chip>
                  ))}
                  <Chip selected={cycleLen === null} onClick={() => setCycleLen(null)}>
                    Not sure
                  </Chip>
                </div>
              </div>

              <div>
                <span className="text-[15px] font-medium text-ink">
                  Are your cycles usually…
                </span>
                <div className="mt-2">
                  <SegmentedControl<RegularitySelfReport>
                    label="Cycle regularity"
                    value={regularity}
                    onChange={setRegularity}
                    options={[
                      { value: "regular", label: "Regular" },
                      { value: "irregular", label: "Irregular" },
                      { value: "not_sure", label: "Not sure" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <p className="pb-3 text-xs leading-relaxed text-faint">
              {brand.medicalDisclaimerShort}
            </p>
            <Button block size="lg" type="submit">
              Build my Mirror
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
