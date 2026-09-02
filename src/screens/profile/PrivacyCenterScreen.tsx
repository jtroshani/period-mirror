import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, SectionLabel, Switch, Button, Badge } from "@/components/ui/primitives";
import { IconShield } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { downloadText } from "@/utils/download";
import { formatLongDate } from "@/utils/date";
import type { ConsentPreference } from "@/models";

const CONSENT_ROWS: { key: keyof ConsentPreference; title: string; desc: string }[] = [
  {
    key: "healthDataProcessing",
    title: "On-device health processing",
    desc: "Allow the app to calculate your baseline and comparisons from what you record. Nothing is sent anywhere.",
  },
  {
    key: "aiProcessing",
    title: "AI check-in processing",
    desc: "Let the check-in structure your free text. In this prototype it runs fully on-device.",
  },
  {
    key: "wearableSync",
    title: "Wearable & health-platform sync",
    desc: "Permit connected devices to add sleep, heart-rate and temperature data.",
  },
  {
    key: "reportSharing",
    title: "Report sharing",
    desc: "Allow creating shareable, revocable report links.",
  },
  {
    key: "analytics",
    title: "Product analytics",
    desc: "Off by design. No advertising trackers are ever used.",
  },
  {
    key: "crashDiagnostics",
    title: "Crash diagnostics",
    desc: "Share anonymised crash information to help fix bugs.",
  },
];

export function PrivacyCenterScreen() {
  const consent = useAppStore((s) => s.consent);
  const setConsent = useAppStore((s) => s.setConsent);
  const sharedReports = useAppStore((s) => s.sharedReports);
  const revokeSharedReport = useAppStore((s) => s.revokeSharedReport);
  const exportData = useAppStore((s) => s.exportData);

  return (
    <>
      <AppBar title="Data & Privacy" back="/profile" />
      <Screen>
        <Stack>
          <Card className="flex items-start gap-3">
            <span className="mt-0.5 text-primary">
              <IconShield size={22} />
            </span>
            <div>
              <p className="font-display text-lg text-ink">Your health data belongs to you</p>
              <p className="mt-1 text-sm text-muted">
                Everything is stored locally on this device. You decide what is
                processed, synced or shared — and you can export or delete it all
                at any time.
              </p>
            </div>
          </Card>

          <div>
            <SectionLabel>Permissions</SectionLabel>
            <Card padded={false} className="divide-y divide-line overflow-hidden">
              {CONSENT_ROWS.map((row) => (
                <div key={row.key} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{row.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{row.desc}</p>
                  </div>
                  <Switch
                    label={row.title}
                    checked={Boolean(consent[row.key])}
                    onChange={(next) =>
                      setConsent({ [row.key]: next } as Partial<ConsentPreference>)
                    }
                  />
                </div>
              ))}
            </Card>
            <p className="mt-1.5 px-1 text-xs text-faint">
              Last updated {formatLongDate(consent.updatedAt.slice(0, 10))}
            </p>
          </div>

          <div>
            <SectionLabel>Shared reports</SectionLabel>
            <Card>
              {sharedReports.length === 0 ? (
                <p className="text-sm text-muted">You haven't shared any reports.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {sharedReports.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm text-ink">{g.label}</p>
                        <p className="text-xs text-faint">
                          {formatLongDate(g.createdAt.slice(0, 10))}
                        </p>
                      </div>
                      {g.revoked ? (
                        <Badge tone="neutral">Revoked</Badge>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => revokeSharedReport(g.id)}>
                          Revoke
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <SectionLabel>Your data</SectionLabel>
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
                Export my data (JSON)
              </Button>
              <p className="text-xs text-faint">
                Delete is available on the Profile screen.
              </p>
            </Card>
          </div>
        </Stack>
      </Screen>
    </>
  );
}
