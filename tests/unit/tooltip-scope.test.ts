import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The tooltip context (Radix tooltip + popper, ~18 KB gzip) is mounted only where a Tooltip is used,
// not by the root layout: every route's first-load weight pays for it (W10 budget, A-P5B-16).
const src = (file: string) => path.join(import.meta.dirname, "..", "..", "src", file);

describe("TooltipProvider scope", () => {
  it("is not mounted by the root layout", () => {
    const root = readFileSync(src("app/layout.tsx"), "utf8");
    expect(root).not.toMatch(/TooltipProvider|\.\/providers/);
    expect(existsSync(src("app/providers.tsx"))).toBe(false);
  });

  it("wraps the primitives gallery, the only page that uses a Tooltip", () => {
    const layout = readFileSync(src("app/primitives/layout.tsx"), "utf8");
    expect(layout).toMatch(/TooltipProvider/);
  });
});
