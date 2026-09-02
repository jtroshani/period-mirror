import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/branding/Wordmark";
import { Button } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/Chips";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { IconMirror, IconShield, IconSparkle, IconLeaf } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/i18n";
import { todayIso } from "@/utils/date";
import type { RegularitySelfReport } from "@/models";

const SLIDE_ICONS = [IconMirror, IconLeaf, IconSparkle, IconShield];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const t = useT();
  const [step, setStep] = useState(0);

  const [lastPeriod, setLastPeriod] = useState(todayIso());
  const [periodLen, setPeriodLen] = useState<number | null>(5);
  const [cycleLen, setCycleLen] = useState<number | null>(28);
  const [regularity, setRegularity] = useState<RegularitySelfReport>("not_sure");

  const slides = [1, 2, 3, 4].map((n, i) => ({
    Icon: SLIDE_ICONS[i],
    title: t(`onboarding.slide${n}Title`),
    body: t(`onboarding.slide${n}Body`),
  }));
  const isForm = step === slides.length;

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
        <div className="flex items-center justify-between gap-3">
          <Wordmark size="sm" />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {!isForm && (
              <button className="text-sm font-medium text-muted" onClick={() => setStep(slides.length)}>
                {t("onboarding.skipToForm")}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-1.5">
          {[...slides, "form"].map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-line"}`} />
          ))}
        </div>

        {!isForm ? (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col justify-center py-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                {(() => {
                  const Icon = slides[step].Icon;
                  return <Icon size={26} />;
                })()}
              </span>
              <h1 className="mt-6 font-display text-[28px] leading-tight text-ink">{slides[step].title}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{slides[step].body}</p>
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="quiet" size="lg" onClick={() => setStep(step - 1)}>
                  {t("common.back")}
                </Button>
              )}
              <Button block size="lg" onClick={() => setStep(step + 1)}>
                {step === slides.length - 1 ? t("onboarding.setupCta") : t("common.continue")}
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
              <h1 className="font-display text-[26px] leading-tight text-ink">{t("onboarding.formTitle")}</h1>
              <p className="-mt-4 text-sm text-muted">{t("onboarding.formIntro")}</p>

              <label className="block">
                <span className="text-[15px] font-medium text-ink">{t("onboarding.qLastPeriod")}</span>
                <input
                  type="date"
                  value={lastPeriod}
                  max={todayIso()}
                  onChange={(e) => setLastPeriod(e.target.value)}
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-ink"
                />
              </label>

              <div>
                <span className="text-[15px] font-medium text-ink">{t("onboarding.qPeriodLength")}</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[3, 4, 5, 6, 7].map((n) => (
                    <Chip key={n} selected={periodLen === n} onClick={() => setPeriodLen(n)}>
                      {t("onboarding.daysN", { n })}
                    </Chip>
                  ))}
                  <Chip selected={periodLen === null} onClick={() => setPeriodLen(null)}>
                    {t("common.notSure")}
                  </Chip>
                </div>
              </div>

              <div>
                <span className="text-[15px] font-medium text-ink">{t("onboarding.qCycleLength")}</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[25, 27, 28, 29, 30, 32].map((n) => (
                    <Chip key={n} selected={cycleLen === n} onClick={() => setCycleLen(n)}>
                      {n}
                    </Chip>
                  ))}
                  <Chip selected={cycleLen === null} onClick={() => setCycleLen(null)}>
                    {t("common.notSure")}
                  </Chip>
                </div>
              </div>

              <div>
                <span className="text-[15px] font-medium text-ink">{t("onboarding.qRegularity")}</span>
                <div className="mt-2">
                  <SegmentedControl<RegularitySelfReport>
                    label={t("onboarding.qRegularity")}
                    value={regularity}
                    onChange={setRegularity}
                    options={[
                      { value: "regular", label: t("enums.regularity.regular") },
                      { value: "irregular", label: t("enums.regularity.irregular") },
                      { value: "not_sure", label: t("enums.regularity.not_sure") },
                    ]}
                  />
                </div>
              </div>
            </div>

            <p className="pb-3 text-xs leading-relaxed text-faint">{t("disclaimer.short")}</p>
            <Button block size="lg" type="submit">
              {t("onboarding.buildCta")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
