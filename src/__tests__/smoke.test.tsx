/**
 * Render smoke test — every route must render to markup without throwing.
 * Uses react-dom/server so no DOM env is required; catches the "white screen"
 * class of bugs (bad hook usage, undefined access during render).
 */
import { describe, expect, it, beforeAll } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { useAppStore } from "@/store/useAppStore";
import { buildDemoSnapshot } from "@/demo/demoData";

beforeAll(() => {
  useAppStore.setState({ ...buildDemoSnapshot(), hydrated: true });
});

const ROUTES = [
  "/welcome",
  "/onboarding",
  "/today",
  "/calendar",
  "/mirror",
  "/report",
  "/profile",
  "/checkin",
  "/log",
  "/log?date=2026-08-01",
  "/profile/privacy",
  "/profile/devices",
  "/profile/subscription",
  "/profile/about",
  "/does-not-exist",
];

describe("route render smoke test", () => {
  for (const route of ROUTES) {
    it(`renders ${route}`, () => {
      const html = renderToString(
        createElement(MemoryRouter, { initialEntries: [route] }, createElement(App)),
      );
      expect(typeof html).toBe("string");
      expect(html.length).toBeGreaterThan(0);
    });
  }
});
