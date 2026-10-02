import { createRequire } from "node:module";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const configPath = path.resolve(__dirname, "../../lighthouserc.cjs");

function loadConfig(url: string | undefined) {
  if (url === undefined) delete process.env.LHCI_URL;
  else process.env.LHCI_URL = url;
  delete require.cache[configPath];
  return require(configPath).ci;
}

describe("lighthouserc", () => {
  const original = process.env.LHCI_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.LHCI_URL;
    else process.env.LHCI_URL = original;
  });

  it("starts a local production server when LHCI_URL is unset", () => {
    const { collect, upload } = loadConfig(undefined);
    expect(collect.url).toEqual(["http://localhost:3100/"]);
    expect(collect.startServerCommand).toMatch(/pnpm build && pnpm start/);
    expect(collect.startServerReadyPattern).toBe("Ready");
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
    expect(upload).toEqual({ target: "filesystem", outputDir: ".lighthouseci" });
  });
});
