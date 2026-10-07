import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import { parseCssVars } from "@/lib/a11y/contrast";

const vars = parseCssVars(
  readFileSync(path.resolve(__dirname, "../../../src/styles/tokens/color.css"), "utf8"),
);

const eco = parseCssVars(
  readFileSync(path.resolve(__dirname, "../../../src/styles/tokens/ecosystem.css"), "utf8"),
);

describe("brand constants", () => {
  it("equal the values parsed from src/styles/tokens/color.css", () => {
    expect(BACKGROUND_HEX).toBe(vars["--color-bg"]);
    expect(BRAND_HEX.background).toBe(vars["--color-bg"]);
    expect(BRAND_HEX.elevated).toBe(vars["--color-bg-elevated"]);
    expect(BRAND_HEX.foreground).toBe(vars["--color-fg"]);
    expect(BRAND_HEX.muted).toBe(vars["--color-fg-muted"]);
    expect(BRAND_HEX.accent).toBe(vars["--color-accent"]);
    expect(BRAND_HEX.borderStrong).toBe(vars["--color-border-strong"]);
    expect(BRAND_HEX.ecoCompute).toBe(eco["--color-eco-compute"]);
    expect(BRAND_HEX.ecoOptional).toBe(eco["--color-eco-optional"]);
  });

  // Value: protects=warning/success/compute stroke inks used by next/og cards on the light paper; fails_when=color.css retunes them without lib/brand.ts; why_new=OG cards drew ochre/sage fills at 1.5:1 on paper; seam=none
  it("mirrors the warning, success and compute stroke inks too", () => {
    expect(BRAND_HEX.warningInk).toBe(vars["--color-warning-ink"]);
    expect(BRAND_HEX.successInk).toBe(vars["--color-success-ink"]);
    expect(BRAND_HEX.ecoComputeInk).toBe(eco["--color-eco-compute-ink"]);
  });
});
