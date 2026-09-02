import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { IconButton } from "./primitives";
import { IconChevronLeft } from "./icons";

interface AppBarProps {
  title?: ReactNode;
  /** Display greeting rendered below the bar (Today screen). */
  greeting?: ReactNode;
  /** Small muted line under the greeting (e.g. the date). */
  greetingSub?: ReactNode;
  /** true → history back; string → path; number → relative navigate. */
  back?: boolean | string | number;
  action?: ReactNode;
}

export function AppBar({ title, greeting, greetingSub, back, action }: AppBarProps) {
  const navigate = useNavigate();
  const hasBack = back !== undefined && back !== false;
  return (
    <header className="safe-top sticky top-0 z-30 bg-bg/80 backdrop-blur-md">
      <div className="flex min-h-[48px] items-center gap-1 px-2">
        {hasBack ? (
          <IconButton
            label="Go back"
            className="h-9 w-9"
            onClick={() =>
              typeof back === "string"
                ? navigate(back)
                : typeof back === "number"
                  ? navigate(back)
                  : navigate(-1)
            }
          >
            <IconChevronLeft size={20} />
          </IconButton>
        ) : (
          <span className="w-1" />
        )}
        <div className="flex-1 truncate px-1 text-center text-[15px] font-semibold text-ink">
          {title}
        </div>
        <div className="flex min-w-9 justify-end">{action}</div>
      </div>
      {greeting && (
        <div className="px-4 pb-2 pt-0.5">
          <h1 className="font-display text-[22px] leading-tight text-ink">{greeting}</h1>
          {greetingSub && <p className="mt-0.5 text-[12px] text-faint">{greetingSub}</p>}
        </div>
      )}
    </header>
  );
}
