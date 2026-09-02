import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, Badge, Button, ListRow, Divider, Switch } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Disclaimer } from "@/components/ui/Disclaimer";
import {
  IconShield,
  IconDevice,
  IconBell,
  IconSparkle,
  IconDownload,
  IconTrash,
  IconHelp,
  IconInfo,
  IconChevronRight,
  IconLeaf,
} from "@/components/ui/icons";
import { brand } from "@/branding/brand";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/selectors";
import { useT } from "@/i18n";
import { downloadText } from "@/utils/download";

export function ProfileScreen() {
  const navigate = useNavigate();
  const t = useT();
  const user = useUser();
  const mode = useAppStore((s) => s.mode);
  const tier = useAppStore((s) => s.subscriptionTier);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const exportData = useAppStore((s) => s.exportData);
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const startFresh = useAppStore((s) => s.startFresh);

  const [sheet, setSheet] = useState<null | "notifications" | "help" | "disclaimer" | "delete">(null);

  const initials = (user?.displayName ?? "You")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const doExport = async () => {
    downloadText(
      `period-mirror-export-${new Date().toISOString().slice(0, 10)}.json`,
      await exportData(),
    );
  };

  const tierLabel =
    tier === "free" ? t("profile.tierFree") : tier === "premium" ? t("profile.tierPremium") : t("profile.tierProfessional");

  return (
    <>
      <AppBar title={t("profile.title")} />
      <Screen>
        <Stack>
          <Card className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft font-display text-xl text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-ink">
                {user?.displayName ?? t("profile.yourProfile")}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={tier === "free" ? "neutral" : "primary"}>{tierLabel}</Badge>
                {user?.isDemo && <Badge tone="notice">{t("profile.demoBadge")}</Badge>}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconInfo size={18} className="text-muted" />
                <span className="text-[15px] text-ink">{t("profile.language")}</span>
              </div>
              <LanguageToggle />
            </div>
            <Divider className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconLeaf size={18} className="text-muted" />
                <span className="text-[15px] text-ink">{t("profile.matchSystemDark")}</span>
              </div>
              <Switch
                label={t("profile.matchSystemDark")}
                checked={settings.theme === "system"}
                onChange={(on) => setSettings({ theme: on ? "system" : "light" })}
              />
            </div>
            <Divider className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconInfo size={18} className="text-muted" />
                <span className="text-[15px] text-ink">{t("profile.showFertile")}</span>
              </div>
              <Switch
                label={t("profile.showFertile")}
                checked={settings.showFertileWindow}
                onChange={(on) => setSettings({ showFertileWindow: on })}
              />
            </div>
          </Card>

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            <ListRow
              icon={<IconShield size={20} />}
              title={t("profile.dataPrivacy")}
              subtitle={t("profile.dataPrivacySub")}
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/privacy")}
            />
            <ListRow
              icon={<IconDevice size={20} />}
              title={t("profile.connectedDevices")}
              subtitle={t("profile.connectedDevicesSub")}
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/devices")}
            />
            <ListRow
              icon={<IconBell size={20} />}
              title={t("profile.notifications")}
              right={<IconChevronRight size={18} />}
              onClick={() => setSheet("notifications")}
            />
            <ListRow
              icon={<IconSparkle size={20} />}
              title={t("profile.subscription")}
              subtitle={t("profile.subscriptionSub")}
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/subscription")}
            />
          </Card>

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            <ListRow
              icon={<IconDownload size={20} />}
              title={t("profile.exportData")}
              subtitle={t("profile.exportDataSub")}
              onClick={doExport}
            />
            <ListRow
              icon={<IconTrash size={20} />}
              title={t("profile.deleteData")}
              subtitle={t("profile.deleteDataSub")}
              onClick={() => setSheet("delete")}
            />
          </Card>

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            <ListRow icon={<IconHelp size={20} />} title={t("profile.help")} onClick={() => setSheet("help")} />
            <ListRow
              icon={<IconInfo size={20} />}
              title={t("profile.about", { brand: brand.name })}
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/about")}
            />
            <ListRow
              icon={<IconShield size={20} />}
              title={t("profile.medicalDisclaimer")}
              onClick={() => setSheet("disclaimer")}
            />
          </Card>

          <Card>
            <p className="pm-label mb-2">{t("profile.demo")}</p>
            {mode === "demo" ? (
              <div className="flex flex-col gap-2">
                <Button variant="secondary" onClick={resetDemo}>
                  {t("profile.resetDemo")}
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => {
                    startFresh();
                    navigate("/welcome", { replace: true });
                  }}
                >
                  {t("profile.exitDemo")}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">{t("profile.ownDataNote")}</p>
            )}
          </Card>

          <Disclaimer />
        </Stack>
      </Screen>

      <Sheet open={sheet === "notifications"} onClose={() => setSheet(null)} title={t("profile.notifications")}>
        <p className="text-sm text-muted">{t("profile.notifBody")}</p>
        <div className="mt-4 space-y-3">
          {[t("profile.notif1"), t("profile.notif2"), t("profile.notif3")].map((l) => (
            <div key={l} className="flex items-center justify-between">
              <span className="text-[15px] text-ink">{l}</span>
              <Switch label={l} checked={false} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === "help"} onClose={() => setSheet(null)} title={t("profile.help")}>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>{t("profile.helpP1", { brand: brand.name })}</p>
          <p>{t("profile.helpP2")}</p>
          <p>{t("profile.helpP3")}</p>
        </div>
      </Sheet>

      <Sheet open={sheet === "disclaimer"} onClose={() => setSheet(null)} title={t("profile.medicalDisclaimer")}>
        <p className="text-sm leading-relaxed text-ink">{t("disclaimer.long")}</p>
      </Sheet>

      <Sheet open={sheet === "delete"} onClose={() => setSheet(null)} title={t("profile.deleteTitle")}>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">{t("profile.deleteBody")}</p>
          <Button
            block
            variant="danger"
            icon={<IconTrash size={18} />}
            onClick={async () => {
              await deleteAllData();
              setSheet(null);
              navigate("/welcome", { replace: true });
            }}
          >
            {t("profile.deleteConfirm")}
          </Button>
          <Button block variant="quiet" onClick={() => setSheet(null)}>
            {t("profile.deleteKeep")}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
