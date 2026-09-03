// @vitest-environment jsdom
/**
 * Italian localisation test — mounts the app in jsdom with the language forced
 * to `it` and asserts Italian copy (including localised engine output) renders.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { buildDemoSnapshot } from "@/demo/demoData";
import { SNAPSHOT_KEY } from "@/services/storage";
import { makeT } from "@/i18n/core";
import { generateReport, resolveRange } from "@/services/report/ReportService";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  const demo = buildDemoSnapshot();
  demo.settings.language = "it";
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(demo));
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function mount(route: string): Promise<string> {
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(MemoryRouter, { initialEntries: [route] }, createElement(App)));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
  return container.textContent ?? "";
}

describe("Italian UI", () => {
  it("translates the bottom navigation", async () => {
    const text = await mount("/today");
    expect(text).toContain("Calendario");
    expect(text).toContain("Specchio");
    expect(text).toContain("Referto");
    expect(text).toContain("Profilo");
  });

  it("translates the Today screen", async () => {
    const text = await mount("/today");
    expect(text).toContain("Pronta per una buona giornata?");
    expect(text).toContain("Registra i tuoi sintomi");
    expect(text).toContain("Come mi sento oggi?");
    expect(text).toContain("Registrazione rapida");
  });

  it("translates the Mirror screen incl. engine copy", async () => {
    const text = await mount("/mirror");
    expect(text).toContain("Il tuo andamento abituale");
    expect(text).toContain("Questo ciclo vs. la tua normalità");
    // localised comparison summary + localised trend, both from i18n/copy.ts
    expect(text).toMatch(/dolore che hai registrato nei primi giorni/i);
    expect(text).toMatch(/è aumentata gradualmente/);
  });

  it("translates the Report screen + document", async () => {
    const text = await mount("/report");
    expect(text).toContain("Il mio Referto di Salute");
    expect(text).toContain("Cambiamenti da discutere");
    expect(text).toContain("Intervallo di tempo");
  });

  it("translates the check-in", async () => {
    const text = await mount("/checkin");
    expect(text).toContain("Leggi le mie parole");
  });
});

describe("Italian report generation", () => {
  it("produces Italian summary text", () => {
    const demo = buildDemoSnapshot();
    const range = resolveRange("6m", undefined, "it");
    const report = generateReport(demo.entries, demo.user, range, "it");
    expect(report.range.label).toBe("Ultimi 6 mesi");
    expect(report.disclaimer).toMatch(/non è una diagnosi medica/i);
    expect(report.changesToDiscuss.join(" ")).toMatch(/dolore|ciclo|sonno/i);
  });
});

describe("makeT fallback", () => {
  it("falls back to English for unknown keys and missing IT entries", () => {
    const t = makeT("it");
    expect(t("nonexistent.key")).toBe("nonexistent.key");
    expect(t("common.save")).toBe("Salva");
    expect(t.enum("symptom", "cramps")).toBe("Crampi");
    expect(t.energy(3)).toBe("Moderata");
  });
});
