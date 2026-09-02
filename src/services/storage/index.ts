import { LocalStorageService } from "./LocalStorageService";
import type { StorageService } from "./StorageService";

export * from "./StorageService";

/** The single storage instance the app uses. Swap here for native storage. */
export const storageService: StorageService = new LocalStorageService();
