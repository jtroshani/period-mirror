/**
 * Wearable / health-platform integrations.
 *
 * The prototype ships mock connectors only. Real adapters (Apple Health,
 * Health Connect, Fitbit, Garmin, Oura, Apple Watch) would implement this same
 * interface behind an OAuth / native-permission flow. No credentials are
 * bundled — see `.env.example`.
 */

import type { DeviceIntegration, IntegrationProvider, VitalReading } from "@/models";

export interface DeviceIntegrationService {
  /** All providers the app knows about, with current connection state. */
  list(): Promise<DeviceIntegration[]>;
  connect(provider: IntegrationProvider): Promise<DeviceIntegration>;
  disconnect(provider: IntegrationProvider): Promise<DeviceIntegration>;
  /** Pull recent vitals from connected providers (mocked / sample data). */
  sync(provider: IntegrationProvider): Promise<VitalReading[]>;
}

export const KNOWN_INTEGRATIONS: Omit<DeviceIntegration, "connected" | "lastSync">[] = [
  { id: "apple_health", provider: "apple_health", displayName: "Apple Health", scopes: ["cycle", "sleep", "heart_rate", "hrv", "temperature", "weight"], isMock: true },
  { id: "health_connect", provider: "health_connect", displayName: "Health Connect", scopes: ["cycle", "sleep", "heart_rate", "steps"], isMock: true },
  { id: "apple_watch", provider: "apple_watch", displayName: "Apple Watch", scopes: ["heart_rate", "hrv", "temperature", "activity"], isMock: true },
  { id: "fitbit", provider: "fitbit", displayName: "Fitbit", scopes: ["sleep", "heart_rate", "hrv", "activity"], isMock: true },
  { id: "garmin", provider: "garmin", displayName: "Garmin", scopes: ["sleep", "hrv", "stress", "activity"], isMock: true },
  { id: "oura", provider: "oura", displayName: "Oura Ring", scopes: ["sleep", "hrv", "temperature", "readiness"], isMock: true },
];
