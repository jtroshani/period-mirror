import type { Lang } from "@/models";
import { useAppStore } from "@/store/useAppStore";

const LABELS: Record<Lang, string> = { en: "EN", it: "IT" };
const ORDER: Lang[] = ["en", "it"];

/** Compact EN / IT switch. Persists via app settings. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const lang = useAppStore((s) => s.settings.language);
  const setSettings = useAppStore((s) => s.setSettings);
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex overflow-hidden rounded-full border border-line ${className}`}
    >
      {ORDER.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setSettings({ language: l })}
          className={`pm-pressable px-3 py-1.5 text-xs font-semibold ${
            lang === l ? "bg-primary text-white" : "bg-surface text-muted"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
