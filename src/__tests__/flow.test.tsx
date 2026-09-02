// @vitest-environment jsdom
/**
 * Client mount test — runs real effects + event handlers in jsdom to exercise
 * the primary demo journey: open app → Explore demo → land on Today →
 * navigate to Mirror and Report.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { useAppStore } from "@/store/useAppStore";
import { buildDemoSnapshot } from "@/demo/demoData";
import { SNAPSHOT_KEY } from "@/services/storage";

/** Persist demo data so App's hydrate() loads it on mount. */
function seedDemo() {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(buildDemoSnapshot()));
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ ...useAppStore.getState(), hydrated: false, mode: "empty", user: null });
  container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function mountAt(path: string) {
  await act(async () => {
    root = createRoot(container);
    root.render(
      createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
    );
  });
  // allow hydrate() microtask + state updates to flush
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function click(el: Element | null | undefined) {
  if (!el) throw new Error("element to click not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function findByText(text: string): HTMLElement | undefined {
  return [...container.querySelectorAll<HTMLElement>("button, a, h1, h2, p")].find(
    (n) => n.textContent?.trim().toLowerCase().includes(text.toLowerCase()),
  );
}

describe("demo journey", () => {
  it("welcome → explore demo → Today shows a cycle day", async () => {
    await mountAt("/");
    expect(container.textContent).toMatch(/Meet your/i);

    click(findByText("Explore demo"));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(useAppStore.getState().mode).toBe("demo");
    expect(useAppStore.getState().user?.isDemo).toBe(true);
    // Today screen content
    expect(container.textContent).toMatch(/Cycle|Day \d|period/i);
  });

  it("renders Mirror with a personalised comparison for the demo", async () => {
    seedDemo();
    await mountAt("/mirror");
    expect(container.textContent).toMatch(/your usual pattern/i);
    expect(container.textContent).toMatch(/Different from your usual|This cycle vs/i);
  });

  it("renders Report with cycle summary numbers", async () => {
    seedDemo();
    await mountAt("/report");
    expect(container.textContent).toMatch(/My Health Report/i);
    expect(container.textContent).toMatch(/Changes worth discussing/i);
  });

  it("persists a quick-log edit to storage", async () => {
    seedDemo();
    await mountAt("/log");
    // toggle a symptom chip
    const chip = [...container.querySelectorAll<HTMLElement>("button")].find(
      (b) => b.textContent?.trim() === "Bloating",
    );
    click(chip);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    const raw = localStorage.getItem("period-mirror:snapshot");
    expect(raw).toBeTruthy();
    expect(raw).toMatch(/bloating/);
  });
});
