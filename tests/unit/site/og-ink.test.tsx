// Value: protects=warning and success OG plates use the stroke inks; fails_when=OgCard paints a pale fill for those tones; why_new=brand.test locks the hex values but never renders OgCard; seam=none
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToneToken } from "@/components/ecosystem-graphic/geometry";
import { BRAND_HEX } from "@/lib/brand";
import { OgCard } from "@/lib/seo/og";

// jsdom serializes inline background colors as rgb(); the stroke attribute keeps the hex.
const rgbOf = (hex: string): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

describe("OgCard inks", () => {
  it("paints warning and success plates with the stroke inks", () => {
    const cases: ReadonlyArray<readonly [ToneToken, string]> = [
      ["--color-warning", BRAND_HEX.warningInk],
      ["--color-success", BRAND_HEX.successInk],
    ];
    for (const [tone, ink] of cases) {
      const { container, unmount } = render(
        <OgCard title="Review" glyph="gate-ring" tone={tone} />,
      );
      expect(container.querySelector("svg")).toHaveAttribute("stroke", ink);
      const bar = [...container.querySelectorAll("div")].find((node) =>
        (node.getAttribute("style") ?? "").includes("width: 160px"),
      );
      expect(bar?.getAttribute("style")).toContain(rgbOf(ink));
      expect(ink).not.toBe(BRAND_HEX.background);
      unmount();
    }
  });
});
