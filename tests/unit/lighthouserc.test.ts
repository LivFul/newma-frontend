import { createRequire } from "node:module";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(__dirname, "../..");
const DESKTOP = path.join(ROOT, "lighthouserc.cjs");
const MOBILE = path.join(ROOT, "lighthouserc.mobile.cjs");
const SHARED = path.join(ROOT, "lighthouserc.shared.cjs");
const ENV_KEYS = ["LHCI_URL", "LHCI_BASE_URL", "LHCI_QUERY"] as const;

function loadFrom(configPath: string, url: string | undefined, env: Record<string, string> = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  if (url !== undefined) process.env.LHCI_URL = url;
  Object.assign(process.env, env);
  for (const file of [configPath, SHARED]) delete require.cache[file];
  return require(configPath).ci;
}
const loadConfig = (url: string | undefined) => loadFrom(DESKTOP, url);

describe("lighthouserc", () => {
  const original = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("starts a local production server when LHCI_URL is unset", () => {
    const { collect, upload } = loadConfig(undefined);
    expect(collect.url).toEqual([
      "http://localhost:3100/",
      "http://localhost:3100/ecosystem/interface",
    ]);
    expect(collect.startServerCommand).toMatch(/pnpm build && pnpm start/);
    expect(collect.startServerReadyPattern).toBe("Ready");
    // The build runs inside the start command, so the default 10 s readiness wait is far too short.
    expect(collect.startServerReadyTimeout).toBeGreaterThanOrEqual(300_000);
    expect(upload).toEqual({ target: "temporary-public-storage" });
  });
  it("requires SEO >= 0.95 as an error locally and in production", () => {
    const { assert } = loadConfig(undefined);
    expect(assert.assertions["categories:seo"]).toEqual(["error", { minScore: 0.95 }]);
  });
  it("downgrades the SEO category to a warning on previews (X-Robots-Tag: noindex) but errors on the audits previews can pass", () => {
    const { assert } = loadConfig("https://preview.example/?x-vercel-protection-bypass=t");
    expect(assert.assertions["categories:seo"]).toEqual(["warn", { minScore: 0.95 }]);
    for (const audit of [
      "document-title",
      "meta-description",
      "http-status-code",
      "link-text",
      "crawlable-anchors",
      "viewport",
      "font-size",
      "hreflang",
      "canonical",
    ]) {
      expect(assert.assertions[audit]).toEqual("error");
    }
    expect(assert.assertions["categories:performance"]).toEqual(["error", { minScore: 0.9 }]);
    expect(assert.assertions["categories:accessibility"]).toEqual(["error", { minScore: 1 }]);
  });
  it("targets LHCI_URL and starts no server when it is set", () => {
    const url =
      "https://preview.example/?x-vercel-protection-bypass=t&x-vercel-set-bypass-cookie=true";
    const { collect } = loadConfig(url);
    expect(collect.url).toEqual([url]);
    expect(collect).not.toHaveProperty("startServerCommand");
    expect(collect).not.toHaveProperty("startServerReadyPattern");
  });
  it("keeps the report on the filesystem in CI so the bypass token in the URL is never published", () => {
    const { upload } = loadConfig("https://preview.example/?x-vercel-protection-bypass=t");
    expect(upload).toEqual({ target: "filesystem", outputDir: ".lighthouseci/desktop" });
  });

  it("uses the desktop preset for desktop and mobile form factor for mobile", () => {
    expect(loadFrom(DESKTOP, undefined).collect.settings).toEqual({ preset: "desktop" });
    expect(loadFrom(MOBILE, undefined).collect.settings).toEqual({ formFactor: "mobile" });
  });

  it.each([
    ["desktop", DESKTOP, 2500],
    ["mobile", MOBILE, 3000],
  ])(
    "%s config collects the home page and one component page and sets its LCP budget",
    (_name, file, lcpBudget) => {
      const { collect, assert } = loadFrom(file, undefined);
      expect(collect.url).toEqual([
        "http://localhost:3100/",
        "http://localhost:3100/ecosystem/interface",
      ]);
      expect(collect.numberOfRuns).toBe(3);
      expect(assert.assertions["categories:performance"]).toEqual(["error", { minScore: 0.9 }]);
      expect(assert.assertions["categories:accessibility"]).toEqual(["error", { minScore: 1 }]);
      expect(assert.assertions["categories:seo"]).toEqual(["error", { minScore: 0.95 }]);
      expect(assert.assertions["largest-contentful-paint"]).toEqual([
        "error",
        { maxNumericValue: lcpBudget },
      ]);
      expect(assert.assertions["cumulative-layout-shift"]).toEqual([
        "error",
        { maxNumericValue: 0.1 },
      ]);
    },
  );

  it.each([
    ["desktop", DESKTOP],
    ["mobile", MOBILE],
  ])(
    "%s config warns on total blocking time above 200 ms (INP lab proxy, A-P4-13)",
    (_name, file) => {
      const { assert } = loadFrom(file, undefined);
      expect(assert.assertions["total-blocking-time"]).toEqual(["warn", { maxNumericValue: 200 }]);
    },
  );

  it("builds both preview URLs from LHCI_BASE_URL and LHCI_QUERY, keeping the bypass parameters", () => {
    const query = "?x-vercel-protection-bypass=t&x-vercel-set-bypass-cookie=true";
    for (const file of [DESKTOP, MOBILE]) {
      const { collect, assert, upload } = loadFrom(file, undefined, {
        LHCI_BASE_URL: "https://preview.example/",
        LHCI_QUERY: query,
      });
      expect(collect.url).toEqual([
        `https://preview.example/${query}`,
        `https://preview.example/ecosystem/interface${query}`,
      ]);
      expect(collect).not.toHaveProperty("startServerCommand");
      expect(assert.assertions["categories:seo"]).toEqual(["warn", { minScore: 0.95 }]);
      expect(upload).toEqual({
        target: "filesystem",
        outputDir: file === DESKTOP ? ".lighthouseci/desktop" : ".lighthouseci/mobile",
      });
    }
  });

  it("writes mobile and desktop reports to separate directories on previews", () => {
    const mobile = loadFrom(MOBILE, "https://preview.example/?x=1").upload;
    const desktop = loadFrom(DESKTOP, "https://preview.example/?x=1").upload;
    expect(mobile.outputDir).not.toBe(desktop.outputDir);
  });
});
