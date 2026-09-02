import { useMemo, useState } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { IconDevice } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { KNOWN_INTEGRATIONS } from "@/services/integrations/DeviceIntegrationService";
import { MockDeviceIntegrationService } from "@/services/integrations/MockDeviceIntegrationService";
import { useT, useFmt } from "@/i18n";
import type { IntegrationProvider } from "@/models";

export function ConnectedDevicesScreen() {
  const t = useT();
  const fmt = useFmt();
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
      setIntegration(await service.connect(provider));
      ingestVitals(await service.sync(provider));
    }
    setBusy(null);
  };

  return (
    <>
      <AppBar title={t("devices.title")} back="/profile" />
      <Screen>
        <Stack>
          <Card className="flex items-start gap-3">
            <span className="mt-0.5 text-primary">
              <IconDevice size={22} />
            </span>
            <div>
              <p className="font-display text-lg text-ink">{t("devices.sampleTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("devices.sampleBody")}</p>
            </div>
          </Card>

          {!wearableConsent && (
            <Card inset className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">{t("devices.wearableOff")}</p>
              <Button size="sm" onClick={() => setConsent({ wearableSync: true })}>
                {t("common.turnOn")}
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
                      {t("devices.syncedOn", { date: fmt.longDate(it.lastSync.slice(0, 10)) })}
                    </p>
                  )}
                </div>
                {it.connected && <Badge tone="normal">{t("devices.connected")}</Badge>}
                <Button
                  size="sm"
                  variant={it.connected ? "quiet" : "secondary"}
                  disabled={busy === it.provider || (!wearableConsent && !it.connected)}
                  onClick={() => toggle(it.provider, it.connected)}
                >
                  {busy === it.provider ? "…" : it.connected ? t("devices.disconnect") : t("devices.connect")}
                </Button>
              </div>
            ))}
          </Card>
        </Stack>
      </Screen>
    </>
  );
}
