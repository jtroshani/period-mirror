/**
 * Storage abstraction. The app only ever talks to this interface, so the
 * on-device implementation can later be swapped for encrypted native storage
 * (e.g. React Native MMKV / Keychain) or an encrypted cloud sync layer without
 * touching feature code.
 */
export interface StorageService {
  /** Returns parsed JSON for `key`, or `null` if absent / unreadable. */
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  /** Remove every key owned by this app (used by "Delete my data"). */
  clearAll(): Promise<void>;
  /** Raw dump for "Export my data". */
  exportAll(): Promise<Record<string, unknown>>;
}

export const STORAGE_NAMESPACE = "period-mirror";
export const SNAPSHOT_KEY = `${STORAGE_NAMESPACE}:snapshot`;
