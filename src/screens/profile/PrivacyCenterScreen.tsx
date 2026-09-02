import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Switch, Button, Badge } from "@/components/ui/primitives";
import { IconShield } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { useT, useFmt } from "@/i18n";
import { downloadText } from "@/utils/download";
import type { ConsentPreference } from "@/models";

const CONSENT_ROWS: { key: keyof ConsentPreference; titleKey: string; descKey: string }[] = [
  { key: "healthDataProcessing", titleKey: "privacy.cHealthTitle", descKey: "privacy.cHealthDesc" },
  { key: "aiProcessing", titleKey: "privacy.cAiTitle", descKey: "privacy.cAiDesc" },
  { key: "wearableSync", titleKey: "privacy.cWearTitle", descKey: "privacy.cWearDesc" },
  { key: "reportSharing", titleKey: "privacy.cShareTitle", descKey: "privacy.cShareDesc" },
  { key: "analytics", titleKey: "privacy.cAnalyticsTitle", descKey: "privacy.cAnalyticsDesc" },
  { key: "crashDiagnostics", titleKey: "privacy.cCrashTitle", descKey: "privacy.cCrashDesc" },
];

export function PrivacyCenterScreen() {
  const t = useT();
  const fmt = useFmt();
  const consent = useAppStore((s) => s.consent);
  const setConsent = useAppStore((s) => s.setConsent);
  const sharedReports = useAppStore((s) => s.sharedReports);
  const revokeSharedReport = useAppStore((s) => s.revokeSharedReport);
  const exportData = useAppStore((s) => s.exportData);

  return (
    <>
      <AppBar title={t("privacy.title")} back="/profile" />
      <Screen>
        <Stack>
          <Card className="flex items-start gap-3">
            <span className="mt-0.5 text-primary">
              <IconShield size={22} />
            </span>
            <div>
              <p className="font-display text-lg text-ink">{t("privacy.ownership")}</p>
              <p className="mt-1 text-sm text-muted">{t("privacy.ownershipBody")}</p>
            </div>
          </Card>

          <div>
            <SectionLabel>{t("privacy.permissions")}</SectionLabel>
            <Card padded={false} className="divide-y divide-line overflow-hidden">
              {CONSENT_ROWS.map((row) => (
                <div key={row.key} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{t(row.titleKey)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{t(row.descKey)}</p>
                  </div>
                  <Switch
                    label={t(row.titleKey)}
                    checked={Boolean(consent[row.key])}
                    onChange={(next) => setConsent({ [row.key]: next } as Partial<ConsentPreference>)}
                  />
                </div>
              ))}
            </Card>
            <p className="mt-1.5 px-1 text-xs text-faint">
              {t("privacy.lastUpdated", { date: fmt.longDate(consent.updatedAt.slice(0, 10)) })}
            </p>
          </div>

          <div>
            <SectionLabel>{t("privacy.sharedReports")}</SectionLabel>
            <Card>
              {sharedReports.length === 0 ? (
                <p className="text-sm text-muted">{t("privacy.noneShared")}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {sharedReports.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm text-ink">{g.label}</p>
                        <p className="text-xs text-faint">{fmt.longDate(g.createdAt.slice(0, 10))}</p>
                      </div>
                      {g.revoked ? (
                        <Badge tone="neutral">{t("privacy.revoked")}</Badge>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => revokeSharedReport(g.id)}>
                          {t("privacy.revoke")}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <SectionLabel>{t("privacy.yourData")}</SectionLabel>
            <Card className="space-y-2">
              <Button
                block
                variant="secondary"
                onClick={async () =>
                  downloadText(
                    `period-mirror-export-${new Date().toISOString().slice(0, 10)}.json`,
                    await exportData(),
                  )
                }
              >
                {t("privacy.exportJson")}
              </Button>
              <p className="text-xs text-faint">{t("privacy.deleteHint")}</p>
            </Card>
          </div>
        </Stack>
      </Screen>
    </>
  );
}
