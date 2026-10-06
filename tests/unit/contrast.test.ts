import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseCssVars } from "@/lib/a11y/contrast";

const TOKENS = path.resolve(__dirname, "../../src/styles/tokens");
const HOVER_BRIGHTNESS = 1.1;
const WCAG_AA_TEXT = 4.5;

// What `filter: brightness(1.1)` does to a #rrggbb colour (each channel scaled and clamped).
const brightened = (hex: string): string =>
  `#${[1, 3, 5]
    .map((i) =>
      Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * HOVER_BRIGHTNESS))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

describe("primary button gradient", () => {
  // Value: protects=the primary button label stays readable over every stop of the brand gradient, also at hover brightness; fails_when=a gradient stop is lightened or the label colour changes so any stop drops below 4.5:1; why_new=contrast-pairs.json only tests solid pairs, so a gradient end stop at 2.96:1 shipped unnoticed; seam=none
  it("keeps the label at 4.5:1 or better on every stop, resting and hovered", () => {
    const vars = parseCssVars(readFileSync(path.join(TOKENS, "color.css"), "utf8"));
    const label = vars["--color-accent-fg"]!;
    const gradient = /--background-image-brand:\s*linear-gradient\(([^;]+)\);/.exec(
      readFileSync(path.join(TOKENS, "ecosystem.css"), "utf8"),
    );
    const stops = [...(gradient?.[1] ?? "").matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0]);
    expect(stops.length).toBeGreaterThanOrEqual(3);
    for (const stop of stops) {
      expect(contrastRatio(label, stop), `${stop} resting`).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
      expect(
        contrastRatio(brightened(label), brightened(stop)),
        `${stop} hovered`,
      ).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    }
  });
});

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
