import { describe, expect, it } from "vitest";
import { contrastRatio, parseCssVars } from "@/lib/a11y/contrast";

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("returns 1 for identical colours", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 3);
  });
  it("parses 3- and 6-digit hex custom properties", () => {
    expect(parseCssVars(":root{--a:#fff;--b: #123456 ;}")).toEqual({
      "--a": "#fff",
      "--b": "#123456",
    });
  });
});
