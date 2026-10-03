import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import { parseCssVars } from "@/lib/a11y/contrast";

const vars = parseCssVars(
  readFileSync(path.resolve(__dirname, "../../../src/styles/tokens/color.css"), "utf8"),
);

describe("brand constants", () => {
  it("equal the values parsed from src/styles/tokens/color.css", () => {
    expect(BACKGROUND_HEX).toBe(vars["--color-bg"]);
    expect(BRAND_HEX.background).toBe(vars["--color-bg"]);
    expect(BRAND_HEX.elevated).toBe(vars["--color-bg-elevated"]);
    expect(BRAND_HEX.foreground).toBe(vars["--color-fg"]);
    expect(BRAND_HEX.muted).toBe(vars["--color-fg-muted"]);
    expect(BRAND_HEX.accent).toBe(vars["--color-accent"]);
  });
});
