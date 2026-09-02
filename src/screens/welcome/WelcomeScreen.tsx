import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/branding/Wordmark";
import { Button } from "@/components/ui/primitives";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { IconMirror, IconShield, IconSparkle } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/i18n";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const loadDemo = useAppStore((s) => s.loadDemo);
  const t = useT();

  const points = [
    { Icon: IconMirror, text: t("welcome.point1") },
    { Icon: IconSparkle, text: t("welcome.point2") },
    { Icon: IconShield, text: t("welcome.point3") },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-14">
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col">
        <div className="flex items-start justify-between">
          <Wordmark size="lg" />
          <LanguageToggle />
        </div>

        <h1 className="mt-10 font-display text-[32px] leading-[1.15] text-ink">
          {t("welcome.title1")} <span className="text-primary">{t("welcome.brandAccent")}</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t("frame.tagline")}</p>

        <ul className="mt-9 space-y-4">
          {points.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon size={20} />
              </span>
              <span className="text-sm text-ink">{text}</span>
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        <div className="mt-10 space-y-3">
          <Button block size="lg" onClick={() => navigate("/onboarding")}>
            {t("welcome.getStarted")}
          </Button>
          <Button
            block
            size="lg"
            variant="secondary"
            onClick={() => {
              loadDemo();
              navigate("/today");
            }}
          >
            {t("welcome.exploreDemo")}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-faint">{t("disclaimer.short")}</p>
      </div>
    </div>
  );
}
