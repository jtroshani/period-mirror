import { useT } from "@/i18n";
import { IconInfo } from "./icons";

/** Non-diagnostic reminder. Used at the foot of insight-bearing screens. */
export function Disclaimer({ variant = "short" }: { variant?: "short" | "long" }) {
  const t = useT();
  return (
    <p className="flex items-start gap-2 px-1 py-3 text-xs leading-relaxed text-faint">
      <IconInfo size={15} className="mt-0.5 shrink-0" />
      <span>{variant === "short" ? t("disclaimer.short") : t("disclaimer.long")}</span>
    </p>
  );
}
