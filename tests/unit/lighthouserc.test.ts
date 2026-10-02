import { createRequire } from "node:module";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const configPath = path.resolve(__dirname, "../../lighthouserc.cjs");

function loadConfig(url: string | undefined) {
  if (url === undefined) delete process.env.LHCI_URL;
  else process.env.LHCI_URL = url;
  delete require.cache[configPath];
  return require(configPath).ci.collect;
}

describe("lighthouserc", () => {
  const original = process.env.LHCI_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.LHCI_URL;
    else process.env.LHCI_URL = original;
  });

  it("starts a local production server when LHCI_URL is unset", () => {
    const collect = loadConfig(undefined);
    expect(collect.url).toEqual(["http://localhost:3100/"]);
    expect(collect.startServerCommand).toMatch(/pnpm build && pnpm start/);
    expect(collect.startServerReadyPattern).toBe("Ready");
  });
  it("targets LHCI_URL and starts no server when it is set", () => {
    const url =
      "https://preview.example/?x-vercel-protection-bypass=t&x-vercel-set-bypass-cookie=true";
    const collect = loadConfig(url);
    expect(collect.url).toEqual([url]);
    expect(collect).not.toHaveProperty("startServerCommand");
    expect(collect).not.toHaveProperty("startServerReadyPattern");
  });
});
