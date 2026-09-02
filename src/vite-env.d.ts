/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_HASH_ROUTER?: string;
  readonly VITE_AI_EXTRACTION_ENDPOINT?: string;
  readonly VITE_AI_EXTRACTION_ENABLED?: string;
  readonly VITE_HEALTHKIT_ENABLED?: string;
  readonly VITE_HEALTH_CONNECT_ENABLED?: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
