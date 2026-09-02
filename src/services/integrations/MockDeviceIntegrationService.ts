import type {
  DeviceIntegration,
  IntegrationProvider,
  VitalReading,
} from "@/models";
import { todayIso, addDays } from "@/utils/date";
import { uid } from "@/utils/id";
import {
  KNOWN_INTEGRATIONS,
  type DeviceIntegrationService,
} from "./DeviceIntegrationService";

/**
 * In-memory mock. Connection state is passed in from the store so the app
 * stays the single source of truth; `sync` fabricates a few days of plausible
 * sample vitals labelled with a demo/wearable source.
 */
export class MockDeviceIntegrationService implements DeviceIntegrationService {
  constructor(private getState: () => DeviceIntegration[]) {}

  async list(): Promise<DeviceIntegration[]> {
    const state = this.getState();
    return KNOWN_INTEGRATIONS.map((base) => {
      const existing = state.find((s) => s.provider === base.provider);
      return {
        ...base,
        connected: existing?.connected ?? false,
        lastSync: existing?.lastSync,
      };
    });
  }

  async connect(provider: IntegrationProvider): Promise<DeviceIntegration> {
    await wait(400);
    const base = KNOWN_INTEGRATIONS.find((k) => k.provider === provider)!;
    return { ...base, connected: true, lastSync: new Date().toISOString() };
  }

  async disconnect(provider: IntegrationProvider): Promise<DeviceIntegration> {
    await wait(200);
    const base = KNOWN_INTEGRATIONS.find((k) => k.provider === provider)!;
    return { ...base, connected: false, lastSync: undefined };
  }

  async sync(provider: IntegrationProvider): Promise<VitalReading[]> {
    await wait(600);
    const out: VitalReading[] = [];
    const start = addDays(todayIso(), -6);
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      out.push(
        vital(date, "resting_hr", 59 + Math.round(Math.sin(i) * 2), "bpm"),
        vital(date, "hrv", 56 + Math.round(Math.cos(i) * 6), "ms"),
        vital(date, "body_temp", Number((36.3 + i * 0.03).toFixed(2)), "°C"),
      );
    }
    void provider;
    return out;
  }
}

function vital(
  date: string,
  type: VitalReading["type"],
  value: number,
  unit: string,
): VitalReading {
  return {
    id: uid("vital"),
    date,
    type,
    value,
    unit,
    source: "wearable",
    recordedAt: new Date().toISOString(),
  };
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
