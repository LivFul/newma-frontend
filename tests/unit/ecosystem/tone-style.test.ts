// Value: protects=every hero/detail plate outline and glyph ink holds 3:1 on the survey paper (WCAG 1.4.11); fails_when=a STROKE_INK entry or tone mapping changes so a plate stroke falls below 3:1 on bg or bg-elevated; why_new=toneStyle is an exported pure mapping and nothing asserted its contrast; seam=none
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { toneStyle } from "@/components/ecosystem-graphic/ecosystem-svg";
import { PARTS } from "@/components/ecosystem-graphic/geometry";
import { contrastRatio, parseCssVars } from "@/lib/a11y/contrast";

const TOKENS = path.resolve(__dirname, "../../../src/styles/tokens");
const vars = ["color.css", "ecosystem.css"]
  .map((file) => parseCssVars(readFileSync(path.join(TOKENS, file), "utf8")))
  .reduce((all, next) => ({ ...all, ...next }), {});

const tokenOf = (value: unknown): string => String(value).replace(/^var\((.*)\)$/, "$1");
const MIN_LINE_CONTRAST = 3;

describe("toneStyle", () => {
  it.each(PARTS.map((part) => [part.slug, part] as const))(
    "strokes and prints %s at 3:1 on paper and on the elevated sheet",
    (_slug, part) => {
      const style = toneStyle(part) as Record<string, unknown>;
      for (const key of ["--eco-stroke", "--eco-ink"] as const) {
        const fg = vars[tokenOf(style[key])];
        expect(fg, `${key} resolves to a token`).toBeDefined();
        for (const bg of ["--color-bg", "--color-bg-elevated"]) {
          expect(
            contrastRatio(fg, vars[bg]),
            `${part.slug} ${key} on ${bg}`,
          ).toBeGreaterThanOrEqual(MIN_LINE_CONTRAST);
        }
      }
    },
  );

  it("maps the light warning, success and compute fills to their darker ink variants", () => {
    const byTone = (tone: string) => PARTS.find((part) => part.tone === tone)!;
    expect(
      tokenOf((toneStyle(byTone("--color-warning")) as Record<string, unknown>)["--eco-stroke"]),
    ).toBe("--color-warning-ink");
    expect(
      tokenOf((toneStyle(byTone("--color-success")) as Record<string, unknown>)["--eco-stroke"]),
    ).toBe("--color-success-ink");
    expect(
      tokenOf(
        (toneStyle(byTone("--color-eco-compute")) as Record<string, unknown>)["--eco-stroke"],
      ),
    ).toBe("--color-eco-compute-ink");
  });
});
