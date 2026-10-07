import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseCssVars } from "@/lib/a11y/contrast";
import { heroEntrance } from "@/components/site/type";

const SRC = path.resolve(__dirname, "../../../src");
const globals = readFileSync(path.join(SRC, "app/globals.css"), "utf8");
const heroSource = readFileSync(path.join(SRC, "components/site/hero-section.tsx"), "utf8");
const typeSource = readFileSync(path.join(SRC, "components/site/type.ts"), "utf8");
const colors = parseCssVars(readFileSync(path.join(SRC, "styles/tokens/color.css"), "utf8"));
const WCAG_AA_TEXT = 4.5;

function blockAfter(css: string, marker: string): string {
  const at = css.indexOf(marker);
  expect(at, marker).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open, i + 1);
    }
  }
  throw new Error(`unclosed ${marker}`);
}

const channels = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]): string =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
// Browsers composite alpha in gamma-encoded sRGB, so this blends the channels as they are.
const over = (top: string, alpha: number, below: string): string => {
  const [t, b] = [channels(top), channels(below)];
  return toHex(t.map((c, i) => c * alpha + b[i]! * (1 - alpha)));
};

describe("hero stage scrim", () => {
  // Value: protects=the diagram caption and hint stay AA over any photo pixel at any viewport width, proved from the scrim's own alpha instead of one screenshot; fails_when=the text-zone alpha is lowered, the photo is made more opaque, or the muted ink is lightened; why_new=the plate's contrast was measured at one width and the composite colour cannot go in contrast-pairs.json; seam=none
  it("keeps muted caption text at 4.5:1 even over a black photo pixel", () => {
    const alpha = Number(/--hero-scrim-text:\s*(\d+)%/.exec(globals)?.[1]) / 100;
    expect(alpha).toBeGreaterThan(0);
    const photoOpacity =
      Number(/opacity-(\d+)/.exec(heroSource.split("hero-photo")[1] ?? "")?.[1]) / 100;
    expect(photoOpacity).toBeGreaterThan(0);
    // The darkest thing under the photo is the aurora wash, which is never darker than sage.
    const worstUnderPhoto = over("#000000", photoOpacity, colors["--color-success"]!);
    const worstBackdrop = over(colors["--color-bg-elevated"]!, alpha, worstUnderPhoto);
    expect(contrastRatio(colors["--color-fg-muted"]!, worstBackdrop)).toBeGreaterThanOrEqual(
      WCAG_AA_TEXT,
    );
  });

  // Value: protects=the stage stays a feathered scrim with no card chrome and no per-frame blur; fails_when=backdrop-filter, a border, or a shadow returns to .hero-stage; why_new=the first version boxed the diagram and re-blurred a large area while the photo animated; seam=none
  it("is a borderless scrim with no backdrop filter", () => {
    const stage = blockAfter(globals, ".hero-stage {");
    expect(stage).not.toMatch(/backdrop-filter|border\s*:|box-shadow/);
    expect(globals).not.toMatch(/\.hero-stage[^{]*\{[^}]*backdrop-filter/);
  });

  it("does not animate the photo behind the stage", () => {
    expect(globals).not.toContain("hero-photo-settle");
  });
});

describe("stagger class names", () => {
  // Value: protects=every stagger step is a literal class string Tailwind can find; fails_when=an index is interpolated into the class name again, so the step is never generated and the items start together; why_new=the interpolated version passed every existing test while the stagger silently never applied; seam=none
  it("spells every hero step out literally in the source", () => {
    for (const step of [0, 1, 2, 3, 4] as const) {
      expect(typeSource).toContain(`"[--hero-i:${step}]"`);
      expect(heroEntrance(step)).toContain(`[--hero-i:${step}]`);
    }
    expect(typeSource).not.toMatch(/\[--hero-i:\$\{/);
  });
});
