import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * Applies the user's theme preference to <html>. Light is the primary design;
 * dark is a full token swap in tokens.css. "system" follows the OS.
 */
export function useThemeEffect() {
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const canMatch = typeof window !== "undefined" && typeof window.matchMedia === "function";
    const mq = canMatch ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && (mq?.matches ?? false));
      root.classList.toggle("dark", dark);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute("content", dark ? "#191512" : "#fbfaf8");
    };

    apply();
    if (theme === "system" && mq) {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);
}
