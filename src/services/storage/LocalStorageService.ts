import {
  STORAGE_NAMESPACE,
  type StorageService,
} from "./StorageService";

/**
 * Browser localStorage implementation. Synchronous under the hood but wrapped
 * in promises so the interface stays transport-agnostic. All keys are
 * namespaced; nothing leaves the device.
 */
export class LocalStorageService implements StorageService {
  private get store(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }

  async read<T>(key: string): Promise<T | null> {
    const raw = this.store?.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    try {
      this.store?.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Quota / private-mode failures shouldn't crash the app.
      console.warn("[storage] write failed", err);
    }
  }

  async remove(key: string): Promise<void> {
    this.store?.removeItem(key);
  }

  async clearAll(): Promise<void> {
    const s = this.store;
    if (!s) return;
    const doomed: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(STORAGE_NAMESPACE)) doomed.push(k);
    }
    doomed.forEach((k) => s.removeItem(k));
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const s = this.store;
    const out: Record<string, unknown> = {};
    if (!s) return out;
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (!k || !k.startsWith(STORAGE_NAMESPACE)) continue;
      const raw = s.getItem(k);
      try {
        out[k] = raw ? JSON.parse(raw) : null;
      } catch {
        out[k] = raw;
      }
    }
    return out;
  }
}
