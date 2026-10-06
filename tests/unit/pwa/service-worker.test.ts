import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sw = readFileSync(path.resolve(__dirname, "../../../public/sw.js"), "utf8");

describe("service worker", () => {
  it("never caches live session surfaces", () => {
    expect(sw).toContain('path.startsWith("/api/")');
    expect(sw).toContain('path.startsWith("/demo")');
    expect(sw).toContain('path.startsWith("/access")');
    expect(sw).toContain('path === "/sw.js"');
  });

  it("precache includes the offline page", () => {
    expect(sw).toContain('"/offline"');
  });
});
