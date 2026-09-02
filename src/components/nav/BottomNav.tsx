import { NavLink } from "react-router-dom";
import {
  IconCalendar,
  IconMirror,
  IconProfile,
  IconReport,
  IconToday,
} from "@/components/ui/icons";

const ITEMS = [
  { to: "/today", label: "Today", Icon: IconToday },
  { to: "/calendar", label: "Calendar", Icon: IconCalendar },
  { to: "/mirror", label: "Mirror", Icon: IconMirror },
  { to: "/report", label: "Report", Icon: IconReport },
  { to: "/profile", label: "Profile", Icon: IconProfile },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom sticky bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-app items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `pm-pressable flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                  isActive ? "text-primary" : "text-faint"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} strokeWidth={isActive ? 2 : 1.6} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
