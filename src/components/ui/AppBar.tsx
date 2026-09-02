import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { IconButton } from "./primitives";
import { IconChevronLeft } from "./icons";

interface AppBarProps {
  title?: ReactNode;
  /** Large display greeting rendered below the bar (Today screen style). */
  greeting?: ReactNode;
  /** true → history back; string → path; number → relative navigate. */
  back?: boolean | string | number;
  action?: ReactNode;
}

export function AppBar({ title, greeting, back, action }: AppBarProps) {
  const navigate = useNavigate();
  return (
    <header className="safe-top sticky top-0 z-30 bg-bg/85 backdrop-blur-md">
      <div className="flex min-h-[52px] items-center gap-1 px-3">
        {back !== undefined && back !== false ? (
          <IconButton
            label="Go back"
            onClick={() =>
              typeof back === "string"
                ? navigate(back)
                : typeof back === "number"
                  ? navigate(back)
                  : navigate(-1)
            }
          >
            <IconChevronLeft />
          </IconButton>
        ) : (
          <span className="w-2" />
        )}
        <div className="flex-1 truncate px-1 text-center font-display text-[17px] text-ink">
          {title}
        </div>
        <div className="flex min-w-[44px] justify-end">{action}</div>
      </div>
      {greeting && (
        <div className="px-5 pb-2 pt-1">
          <h1 className="font-display text-[26px] leading-tight text-ink">{greeting}</h1>
        </div>
      )}
    </header>
  );
}
