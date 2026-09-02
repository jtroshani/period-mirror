import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/nav/BottomNav";

/** Layout for the five primary tabs: routed content above a persistent nav. */
export function AppScaffold() {
  return (
    <div className="flex h-full min-h-[100dvh] flex-col lg:min-h-0">
      <Outlet />
      <BottomNav />
    </div>
  );
}
