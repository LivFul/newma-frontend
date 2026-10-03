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
    expect(BRAND_HEX.warning).toBe(vars["--color-warning"]);
    expect(BRAND_HEX.success).toBe(vars["--color-success"]);
    expect(BRAND_HEX.borderStrong).toBe(vars["--color-border-strong"]);
    expect(BRAND_HEX.ecoCompute).toBe(eco["--color-eco-compute"]);
    expect(BRAND_HEX.ecoOptional).toBe(eco["--color-eco-optional"]);
  });
});
