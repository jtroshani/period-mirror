import type { ReactNode } from "react";

/** Scrollable content region. Sub-screens without bottom nav use this alone. */
export function Screen({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
      <div
        className={`mx-auto w-full max-w-app ${pad ? "px-4 pb-10 pt-1" : ""} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Vertical rhythm helper for stacks of cards / sections. */
export function Stack({
  children,
  gap = "gap-4",
  className = "",
}: {
  children: ReactNode;
  gap?: string;
  className?: string;
}) {
  return <div className={`flex flex-col ${gap} ${className}`}>{children}</div>;
}
