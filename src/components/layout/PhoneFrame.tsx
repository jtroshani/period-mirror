import type { ReactNode } from "react";
import { Wordmark } from "@/branding/Wordmark";
import { useT } from "@/i18n";

/**
 * On phones the app is full-bleed. On wider screens it's centered in an
 * elegant device-style frame with a calm side panel — never stretched.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="min-h-[100dvh] bg-bg lg:bg-surface-2">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1080px] items-stretch justify-center lg:gap-12 lg:px-8 lg:py-10">
        <aside className="hidden max-w-[300px] flex-col justify-center gap-6 lg:flex">
          <Wordmark size="lg" />
          <p className="font-display text-2xl leading-snug text-ink">{t("frame.tagline")}</p>
          <p className="text-sm leading-relaxed text-muted">{t("frame.sidePanel")}</p>
          <p className="text-xs text-faint">{t("frame.prototypeNote")}</p>
        </aside>

        <main className="relative flex w-full max-w-app flex-col bg-bg lg:my-auto lg:h-[860px] lg:max-h-[90vh] lg:overflow-hidden lg:rounded-[2.75rem] lg:border-8 lg:border-ink/90 lg:shadow-2xl">
          {children}
        </main>
      </div>
    </div>
  );
}
