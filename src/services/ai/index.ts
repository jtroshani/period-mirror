import { MockAIExtractionService } from "./MockAIExtractionService";
import type { AIExtractionService } from "./AIExtractionService";

export * from "./AIExtractionService";

/**
 * Factory for the extraction service. Today it always returns the on-device
 * heuristic extractor. When `VITE_AI_EXTRACTION_ENABLED` + an endpoint are
 * configured, a real adapter would be constructed here instead — the rest of
 * the app is unaffected because it only depends on `AIExtractionService`.
 */
export function createAIExtractionService(): AIExtractionService {
  const enabled = import.meta.env.VITE_AI_EXTRACTION_ENABLED === "true";
  const endpoint = import.meta.env.VITE_AI_EXTRACTION_ENDPOINT;
  if (enabled && endpoint) {
    // Placeholder: a network-backed adapter would live in ./RemoteAIExtractionService
    console.info("[ai] real extraction endpoint configured — adapter not bundled in prototype");
  }
  return new MockAIExtractionService();
}

export const aiExtractionService = createAIExtractionService();
