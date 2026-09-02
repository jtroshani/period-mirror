import type { SafetyNotice } from "@/models";
import { joinWithAnd } from "@/utils/format";
import { useT } from "@/i18n";
import { safetyPhrase } from "@/i18n/copy";
import { IconShield } from "./icons";

/**
 * Calm, proportionate safety reminder. Never diagnostic. Only shown when the
 * safety engine matched emergency-adjacent wording or values.
 */
export function SafetyBanner({ notice }: { notice: SafetyNotice }) {
  const t = useT();
  const parts = notice.triggeredBy.map((p) => safetyPhrase(t.lang, p));
  const reasonsText =
    t.lang === "it"
      ? parts.length <= 1
        ? parts.join("")
        : `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`
      : joinWithAnd(parts);
  const reasons = parts;
  return (
    <div role="status" className="rounded-card border border-alert/30 bg-alert-soft/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-alert">
          <IconShield size={20} />
        </span>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-alert">{t("safety.heading")}</p>
          <p className="text-sm leading-relaxed text-ink/90">{t("safety.message")}</p>
          {reasons.length > 0 ? (
            <p className="text-xs text-muted">
              {t("safety.shownBecause", { reasons: reasonsText })}
            </p>
          ) : (
            <p className="text-xs text-muted">{t("safety.shownGeneric")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
