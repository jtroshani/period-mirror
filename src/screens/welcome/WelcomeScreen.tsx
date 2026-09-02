import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/branding/Wordmark";
import { brand } from "@/branding/brand";
import { Button } from "@/components/ui/primitives";
import { IconMirror, IconShield, IconSparkle } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";

const POINTS = [
  { Icon: IconMirror, text: "Learns your own baseline, cycle by cycle" },
  { Icon: IconSparkle, text: "Highlights meaningful changes — never a diagnosis" },
  { Icon: IconShield, text: "Your data stays on your device" },
];

export function WelcomeScreen() {
  const navigate = useNavigate();
  const loadDemo = useAppStore((s) => s.loadDemo);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-14">
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col">
        <Wordmark size="lg" />

        <h1 className="mt-10 font-display text-[32px] leading-[1.15] text-ink">
          Meet your{" "}
          <span className="text-primary">Period Mirror</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{brand.tagline}</p>

        <ul className="mt-9 space-y-4">
          {POINTS.map(({ Icon, text }) => (
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
            Get started
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
            Explore demo
          </Button>
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-faint">
          {brand.medicalDisclaimerShort}
        </p>
      </div>
    </div>
  );
}
