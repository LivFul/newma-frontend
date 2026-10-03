import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

import * as events from "@/lib/analytics/events";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";

function listen() {
  const received: unknown[] = [];
  const handler = (e: Event) => received.push((e as CustomEvent).detail);
  window.addEventListener("newma:analytics", handler);
  return { received, stop: () => window.removeEventListener("newma:analytics", handler) };
}

function setWebdriver(value: boolean) {
  Object.defineProperty(navigator, "webdriver", { value, configurable: true });
}

describe("trackEvent", () => {
  beforeEach(() => {
    track.mockClear();
    setWebdriver(false);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("always dispatches the DOM event for both events", () => {
    const { received, stop } = listen();
    events.trackEvent({ name: "access_newma_click" });
    events.trackEvent({ name: "component_open", slug: "wet-lab" });
    stop();
    expect(received).toEqual([
      { name: "access_newma_click" },
      { name: "component_open", slug: "wet-lab" },
    ]);
  });

  it("calls track only in production and never under navigator.webdriver", () => {
    events.trackEvent({ name: "access_newma_click" });
    expect(track).not.toHaveBeenCalled();

    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    events.trackEvent({ name: "access_newma_click" });
    expect(track).not.toHaveBeenCalled();

    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    setWebdriver(true);
    events.trackEvent({ name: "access_newma_click" });
    expect(track).not.toHaveBeenCalled();

    setWebdriver(false);
    events.trackEvent({ name: "access_newma_click" });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("sends access_newma_click with no properties and component_open with exactly the slug", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    events.trackEvent({ name: "access_newma_click" });
    expect(track).toHaveBeenLastCalledWith("access_newma_click");
    for (const slug of ECOSYSTEM_SLUGS) {
      events.trackEvent({ name: "component_open", slug });
      expect(track).toHaveBeenLastCalledWith("component_open", { slug });
    }
  });

  it("rejects an unknown event name or slug in tests and development", () => {
    expect(() => events.trackEvent({ name: "page_view" } as never)).toThrow(
      /unknown analytics event/i,
    );
    expect(() =>
      events.trackEvent({ name: "component_open", slug: "somewhere-else" } as never),
    ).toThrow(/slug/i);
    expect(() => events.trackEvent({ name: "access_newma_click", extra: 1 } as never)).toThrow(
      /properties/i,
    );
    expect(track).not.toHaveBeenCalled();
  });

  it("no-ops instead of throwing in production builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const { received, stop } = listen();
    expect(() => events.trackEvent({ name: "page_view" } as never)).not.toThrow();
    stop();
    expect(received).toEqual([]);
    expect(track).not.toHaveBeenCalled();
  });
});

describe("reportingEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("is true only for production outside automation", () => {
    setWebdriver(false);
    expect(events.reportingEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    expect(events.reportingEnabled()).toBe(true);
    setWebdriver(true);
    expect(events.reportingEnabled()).toBe(false);
  });
});

describe("the analytics surface", () => {
  const src = path.resolve(__dirname, "../../../src");
  // The demo subtrees are out of scope: they have their own persona-action vocabulary.
  const DEMO = /(\(platform\)\/demo|app\/api\/demo|lib\/demo)/;
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = path.join(dir, name);
      if (DEMO.test(p)) return [];
      return statSync(p).isDirectory() ? files(p) : /\.(tsx?|mdx)$/.test(name) ? [p] : [];
    });

  it("exports no event other than the two", () => {
    expect(Object.keys(events).sort()).toEqual(["EVENT_NAME", "reportingEnabled", "trackEvent"]);
    expect(events.EVENT_NAME).toBe("newma:analytics");
  });

  it("calls track( only inside events.ts and imports @vercel/analytics only in two files", () => {
    const callers: string[] = [];
    const importers: string[] = [];
    for (const file of files(src)) {
      const text = readFileSync(file, "utf8");
      if (/\btrack\(/.test(text)) callers.push(path.relative(src, file));
      if (text.includes("@vercel/analytics")) importers.push(path.relative(src, file));
    }
    expect(callers).toEqual(["lib/analytics/events.ts"]);
    expect(importers.sort()).toEqual([
      "components/site/analytics-mount.tsx",
      "lib/analytics/events.ts",
    ]);
  });

  it("names no event string other than access_newma_click and component_open", () => {
    const names = new Set<string>();
    for (const file of files(src)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/["'`]([a-z]+(?:_[a-z]+)+)["'`]/g)) {
        if (/^(access|component|page|view|click|open)_/.test(m[1]!)) names.add(m[1]!);
      }
    }
    expect([...names].sort()).toEqual(["access_newma_click", "component_open"]);
  });
});
