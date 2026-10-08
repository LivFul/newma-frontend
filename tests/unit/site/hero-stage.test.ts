import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blend as over, contrastRatio, parseCssVars } from "@/lib/a11y/contrast";
import { heroEntrance } from "@/components/site/type";
import { cssBlockAfter as blockAfter } from "../../support/css-block";

const SRC = path.resolve(__dirname, "../../../src");
const globals = readFileSync(path.join(SRC, "app/globals.css"), "utf8");
const heroSource = readFileSync(path.join(SRC, "components/site/hero-section.tsx"), "utf8");
const typeSource = readFileSync(path.join(SRC, "components/site/type.ts"), "utf8");
const colors = parseCssVars(readFileSync(path.join(SRC, "styles/tokens/color.css"), "utf8"));
const WCAG_AA_TEXT = 4.5;

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

  // Value: protects=the stage layers stay borderless scrims with no card chrome and no per-frame blur; fails_when=backdrop-filter, a border, or a shadow returns to either layer; why_new=the first version boxed the diagram and re-blurred a large area while the photo animated; seam=none
  it("keeps both layers borderless with no backdrop filter", () => {
    for (const marker of [".hero-stage {", ".hero-caption-scrim {"]) {
      expect(blockAfter(globals, marker), marker).not.toMatch(
        /backdrop-filter|border\s*:|box-shadow/,
      );
    }
    expect(globals).not.toMatch(/\.hero-(stage|caption-scrim)[^{]*\{[^}]*backdrop-filter/);
  });

  // Value: protects=the caption text starts inside the scrim's dense core, not in its side feather, so the proved alpha is the alpha the text actually sits on; fails_when=the scrim is inset less than its horizontal feather is wide; why_new=at 1024px the caption starts 48px inside the figure while the feather was 80px wide, so part of the text sat on a partly faded scrim and contrast fell from 5.3:1 to 4.8:1; seam=none
  // Each side is checked on its own: the right edge stops at the hero's 48px gutter (so it never adds
  // scrollable overflow), with a matching shorter feather.
  it("insets the caption scrim at least as far as its horizontal feather, on each side", () => {
    const classes = /className="([^"]*hero-caption-scrim[^"]*)"/.exec(heroSource)?.[1] ?? "";
    const insetPx = (side: "left" | "right") =>
      Number(new RegExp(`(?:^|\\s)-${side}-(\\d+)(?:\\s|$)`).exec(classes)?.[1]) * 4;
    const mask = blockAfter(globals, ".hero-caption-scrim {");
    const leftFeather =
      Number(/to right,\s*transparent 0,\s*var\(--color-fg\) ([\d.]+)rem/.exec(mask)?.[1]) * 16;
    const rightFeather =
      Number(
        /var\(--color-fg\) calc\(100% - ([\d.]+)rem\),\s*transparent 100%\s*\),\s*linear-gradient\(\s*to bottom/.exec(
          mask,
        )?.[1],
      ) * 16;
    for (const [inset, feather] of [
      [insetPx("left"), leftFeather],
      [insetPx("right"), rightFeather],
    ]) {
      expect(inset).toBeGreaterThan(0);
      expect(feather).toBeGreaterThan(0);
      expect(inset).toBeGreaterThanOrEqual(feather);
    }
  });

  // Value: protects=the wash covers exactly the photo's box, so it is flush with the hero's top, right and bottom and never leaves a gap under the header; fails_when=the stage is sized or offset on its own again; why_new=an offset box bled 56px above the hero and 24px past the viewport, and floated away from the photo whenever the hero was taller than its content; seam=none
  it("shares the photo's box and mask instead of being positioned on its own", () => {
    const photo = /className="([^"]*hero-photo[^"]*)"/.exec(heroSource)?.[1] ?? "";
    const stage = /className="([^"]*hero-stage[^"]*)"/.exec(heroSource)?.[1] ?? "";
    const box = (classes: string) =>
      classes
        .split(/\s+/)
        .filter((c) => /^(absolute|inset-y-0|right-0|w-\[48%\]|hidden|lg:block|-z-10)$/.test(c))
        .sort();
    expect(box(stage)).toEqual(box(photo));
    expect(stage).not.toMatch(/-inset|inset-x|inset-0/);
    expect(globals).toMatch(/\.hero-photo,\s*\.hero-stage\s*\{[^}]*mask-image/);
  });

  // Value: protects=the hero photo stays still, so the stage wash, scrims and contrast proofs always sit over a fixed image; fails_when=any rule targeting .hero-photo declares an animation, under whatever keyframe name; why_new=the earlier check only rejected one old keyframe name and missed any other; seam=none
  it("does not animate the photo behind the stage", () => {
    const rules = globals.match(/[^{}]*\.hero-photo[^{}]*\{[^}]*\}/g) ?? [];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule).not.toMatch(/\banimation(-name)?\s*:/);
  });
});

describe("stagger class names", () => {
  // Value: protects=every stagger step is a literal class string Tailwind can find; fails_when=an index is interpolated into the class name again, so the step is never generated and the items start together; why_new=the interpolated version passed every existing test while the stagger silently never applied; seam=none
  it("spells every hero step out literally in the source", () => {
    for (const step of [0, 1] as const) {
      expect(typeSource).toContain(`"[--hero-i:${step}]"`);
      expect(heroEntrance(step)).toContain(`[--hero-i:${step}]`);
    }
    expect(typeSource).not.toMatch(/\[--hero-i:\$\{/);
  });
});
