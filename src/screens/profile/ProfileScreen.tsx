import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, Badge, Button, ListRow, Divider, Switch } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
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
import { downloadText } from "@/utils/download";

export function ProfileScreen() {
  const navigate = useNavigate();
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
    const json = await exportData();
    downloadText(`period-mirror-export-${new Date().toISOString().slice(0, 10)}.json`, json);
  };

  return (
    <>
      <AppBar title="Profile" />
      <Screen>
        <Stack>
          <Card className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft font-display text-xl text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-ink">
                {user?.displayName ?? "Your profile"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={tier === "free" ? "neutral" : "primary"}>
                  {tier === "free" ? "Free" : tier === "premium" ? "Premium" : "Professional"}
                </Badge>
                {user?.isDemo && <Badge tone="notice">Demo · fictional data</Badge>}
              </div>
            </div>
          </Card>

          {/* Theme quick control */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconLeaf size={18} className="text-muted" />
                <span className="text-[15px] text-ink">Match system dark mode</span>
              </div>
              <Switch
                label="Match system dark mode"
                checked={settings.theme === "system"}
                onChange={(on) => setSettings({ theme: on ? "system" : "light" })}
              />
            </div>
            <Divider className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconInfo size={18} className="text-muted" />
                <span className="text-[15px] text-ink">Show predicted fertile window</span>
              </div>
              <Switch
                label="Show predicted fertile window"
                checked={settings.showFertileWindow}
                onChange={(on) => setSettings({ showFertileWindow: on })}
              />
            </div>
          </Card>

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            <ListRow
              icon={<IconShield size={20} />}
              title="Data & Privacy"
              subtitle="Consent, exports, shared reports"
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/privacy")}
            />
            <ListRow
              icon={<IconDevice size={20} />}
              title="Connected devices"
              subtitle="Apple Health, wearables (sample data)"
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/devices")}
            />
            <ListRow
              icon={<IconBell size={20} />}
              title="Notifications"
              right={<IconChevronRight size={18} />}
              onClick={() => setSheet("notifications")}
            />
            <ListRow
              icon={<IconSparkle size={20} />}
              title="Subscription"
              subtitle="Free · Premium · Professional"
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/subscription")}
            />
          </Card>

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            <ListRow
              icon={<IconDownload size={20} />}
              title="Export my data"
              subtitle="Download everything as JSON"
              onClick={doExport}
            />
            <ListRow
              icon={<IconTrash size={20} />}
              title="Delete my data"
              subtitle="Remove everything from this device"
              onClick={() => setSheet("delete")}
            />
          </Card>

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            <ListRow icon={<IconHelp size={20} />} title="Help" onClick={() => setSheet("help")} />
            <ListRow
              icon={<IconInfo size={20} />}
              title={`About ${brand.name}`}
              right={<IconChevronRight size={18} />}
              onClick={() => navigate("/profile/about")}
            />
            <ListRow
              icon={<IconShield size={20} />}
              title="Medical disclaimer"
              onClick={() => setSheet("disclaimer")}
            />
          </Card>

          {/* Demo controls */}
          <Card>
            <p className="pm-label mb-2">Demo</p>
            {mode === "demo" ? (
              <div className="flex flex-col gap-2">
                <Button variant="secondary" onClick={resetDemo}>
                  Reset demo data
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => {
                    startFresh();
                    navigate("/welcome", { replace: true });
                  }}
                >
                  Exit demo
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">
                You're using your own data. Demo mode can be started from the
                welcome screen.
              </p>
            )}
          </Card>

          <Disclaimer />
        </Stack>
      </Screen>

      <Sheet open={sheet === "notifications"} onClose={() => setSheet(null)} title="Notifications">
        <p className="text-sm text-muted">
          Reminders are represented in the prototype but not scheduled. In a native
          app these would be local notifications, off by default.
        </p>
        <div className="mt-4 space-y-3">
          {["Gentle daily check-in reminder", "Predicted period approaching", "New Mirror insight"].map(
            (l) => (
              <div key={l} className="flex items-center justify-between">
                <span className="text-[15px] text-ink">{l}</span>
                <Switch label={l} checked={false} onChange={() => {}} />
              </div>
            ),
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === "help"} onClose={() => setSheet(null)} title="Help">
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-ink">{brand.name}</strong> learns what's typical
            for you and highlights changes from your own pattern. It never
            diagnoses.
          </p>
          <p>
            Log a little each day, or describe how you feel in the check-in. After
            a few cycles, the Mirror becomes more useful.
          </p>
          <p>Bring the Report to an appointment so you don't have to remember everything.</p>
        </div>
      </Sheet>

      <Sheet open={sheet === "disclaimer"} onClose={() => setSheet(null)} title="Medical disclaimer">
        <p className="text-sm leading-relaxed text-ink">{brand.medicalDisclaimerLong}</p>
      </Sheet>

      <Sheet open={sheet === "delete"} onClose={() => setSheet(null)} title="Delete my data?">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            This permanently removes all entries, check-ins, settings and reports
            from this device. This can't be undone.
          </p>
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
            Delete everything
          </Button>
          <Button block variant="quiet" onClick={() => setSheet(null)}>
            Keep my data
          </Button>
        </div>
      </Sheet>
    </>
  );
}
