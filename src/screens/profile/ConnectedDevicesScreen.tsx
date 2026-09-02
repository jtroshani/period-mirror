import { useMemo, useState } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { IconDevice } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { KNOWN_INTEGRATIONS } from "@/services/integrations/DeviceIntegrationService";
import { MockDeviceIntegrationService } from "@/services/integrations/MockDeviceIntegrationService";
import { formatLongDate } from "@/utils/date";
import type { IntegrationProvider } from "@/models";

export function ConnectedDevicesScreen() {
  const integrations = useAppStore((s) => s.integrations);
  const setIntegration = useAppStore((s) => s.setIntegration);
  const ingestVitals = useAppStore((s) => s.ingestVitals);
  const wearableConsent = useAppStore((s) => s.consent.wearableSync);
  const setConsent = useAppStore((s) => s.setConsent);
  const [busy, setBusy] = useState<IntegrationProvider | null>(null);

  const service = useMemo(
    () => new MockDeviceIntegrationService(() => integrations),
    [integrations],
  );

  const state = KNOWN_INTEGRATIONS.map((base) => {
    const existing = integrations.find((i) => i.provider === base.provider);
    return { ...base, connected: existing?.connected ?? false, lastSync: existing?.lastSync };
  });

  const toggle = async (provider: IntegrationProvider, connected: boolean) => {
    setBusy(provider);
    if (connected) {
      setIntegration(await service.disconnect(provider));
    } else {
      const next = await service.connect(provider);
      setIntegration(next);
      const readings = await service.sync(provider);
      ingestVitals(readings);
    }
    setBusy(null);
  };

  return (
    <>
      <AppBar title="Connected devices" back="/profile" />
      <Screen>
        <Stack>
          <Card className="flex items-start gap-3">
            <span className="mt-0.5 text-primary">
              <IconDevice size={22} />
            </span>
            <div>
              <p className="font-display text-lg text-ink">Sample integrations</p>
              <p className="mt-1 text-sm text-muted">
                These connectors are mocked in the prototype and add clearly-labelled
                sample data. Real Apple Health, Health Connect, Fitbit, Garmin and
                Oura adapters would sit behind the same interface.
              </p>
            </div>
          </Card>

          {!wearableConsent && (
            <Card inset className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Wearable sync is currently off in your privacy settings.
              </p>
              <Button size="sm" onClick={() => setConsent({ wearableSync: true })}>
                Turn on
              </Button>
            </Card>
          )}

          <Card padded={false} className="divide-y divide-line overflow-hidden">
            {state.map((it) => (
              <div key={it.provider} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-ink">{it.displayName}</p>
                  <p className="mt-0.5 text-xs text-muted">{it.scopes.join(" · ")}</p>
                  {it.connected && it.lastSync && (
                    <p className="mt-0.5 text-xs text-faint">
                      Synced {formatLongDate(it.lastSync.slice(0, 10))}
                    </p>
                  )}
                </div>
                {it.connected && <Badge tone="normal">Connected</Badge>}
                <Button
                  size="sm"
                  variant={it.connected ? "quiet" : "secondary"}
                  disabled={busy === it.provider || (!wearableConsent && !it.connected)}
                  onClick={() => toggle(it.provider, it.connected)}
                >
                  {busy === it.provider ? "…" : it.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            ))}
          </Card>
        </Stack>
      </Screen>
    </>
  );
}
