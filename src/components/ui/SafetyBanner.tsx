import type { SafetyNotice } from "@/models";
import { joinWithAnd } from "@/utils/format";
import { IconShield } from "./icons";

/**
 * Calm, proportionate safety reminder. Never diagnostic. Only shown when the
 * safety engine matched emergency-adjacent wording or values.
 */
export function SafetyBanner({ notice }: { notice: SafetyNotice }) {
  return (
    <div
      role="status"
      className="rounded-card border border-alert/30 bg-alert-soft/60 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-alert">
          <IconShield size={20} />
        </span>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-alert">A quick note on safety</p>
          <p className="text-sm leading-relaxed text-ink/90">{notice.message}</p>
          {notice.triggeredBy.length > 0 && (
            <p className="text-xs text-muted">
              Shown because you mentioned {joinWithAnd(notice.triggeredBy)}. This is
              not a diagnosis or an assessment of how serious anything is.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
