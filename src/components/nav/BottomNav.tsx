import { NavLink } from "react-router-dom";
import {
  IconCalendar,
  IconMirror,
  IconProfile,
  IconReport,
  IconToday,
} from "@/components/ui/icons";
import { useT } from "@/i18n";

const ITEMS = [
  { to: "/today", key: "nav.today", Icon: IconToday },
  { to: "/calendar", key: "nav.calendar", Icon: IconCalendar },
  { to: "/mirror", key: "nav.mirror", Icon: IconMirror },
  { to: "/report", key: "nav.report", Icon: IconReport },
  { to: "/profile", key: "nav.profile", Icon: IconProfile },
] as const;

export function BottomNav() {
  const t = useT();
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom sticky bottom-0 z-30 border-t border-line/60 bg-surface/95 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-app items-stretch justify-around gap-1 px-2 pt-1.5">
        {ITEMS.map(({ to, key, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `pm-pressable flex flex-col items-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-semibold ${
                  isActive ? "bg-primary-soft text-primary" : "text-faint"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.1 : 1.7} />
                  <span>{t(key)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
