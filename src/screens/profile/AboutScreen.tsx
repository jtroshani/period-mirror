import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card } from "@/components/ui/primitives";
import { Wordmark } from "@/branding/Wordmark";
import { brand } from "@/branding/brand";
import { useT } from "@/i18n";

export function AboutScreen() {
  const t = useT();
  return (
    <>
      <AppBar title={t("about.title", { brand: brand.name })} back="/profile" />
      <Screen>
        <Stack>
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <Wordmark size="lg" />
            <p className="text-xs text-faint">{t("about.prototype")}</p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">{t("about.ideaTitle")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {t("about.ideaBody", { brand: brand.name })}
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">{t("about.neverTitle")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("about.neverBody")}</p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">{t("about.privacyTitle")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("about.privacyBody")}</p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">{t("about.disclaimerTitle")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("disclaimer.long")}</p>
          </Card>
        </Stack>
      </Screen>
    </>
  );
}
