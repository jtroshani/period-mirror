/// <reference types="node" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, URL } from "node:url";

// `STANDALONE=1 vite build` produces a single self-contained index.html that
// runs by double-clicking it from disk (file://). The normal build keeps code
// splitting + the installable PWA service worker.
const standalone = process.env.STANDALONE === "1";

export default defineConfig({
  // Relative asset URLs so the build also works when opened from the filesystem.
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    ...(standalone
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "icon.svg", "maskable-icon.svg"],
            manifest: {
              name: "Period Mirror",
              short_name: "Mirror",
              description:
                "Understand your cycle by comparing your body with your own patterns.",
              theme_color: "#7c4d6b",
              background_color: "#fbfaf8",
              display: "standalone",
              orientation: "portrait",
              start_url: "./",
              scope: "./",
              icons: [
                { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
                {
                  src: "maskable-icon.svg",
                  sizes: "any",
                  type: "image/svg+xml",
                  purpose: "maskable",
                },
              ],
            },
            workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] },
            devOptions: { enabled: false },
          }),
        ]),
  ],
  build: {
    outDir: standalone ? "dist-standalone" : "dist",
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
