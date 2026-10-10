import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { heroEntrance } from "@/components/site/type";
import { cssBlockAfter as blockAfter } from "../../support/css-block";

const SRC = path.resolve(__dirname, "../../../src");
const globals = readFileSync(path.join(SRC, "app/globals.css"), "utf8");
const heroSource = readFileSync(path.join(SRC, "components/site/hero-section.tsx"), "utf8");
const typeSource = readFileSync(path.join(SRC, "components/site/type.ts"), "utf8");

describe("hero stage scrim", () => {
  it("does not use a separate caption scrim layer", () => {
    expect(heroSource).not.toContain("hero-caption-scrim");
    expect(globals).not.toMatch(/\.hero-caption-scrim\s*\{/);
  });

  // Value: protects=the stage layer stays a borderless scrim with no card chrome and no per-frame blur; fails_when=backdrop-filter, a border, or a shadow returns; why_new=the first version boxed the diagram and re-blurred a large area while the photo animated; seam=none
  it("keeps the stage borderless with no backdrop filter", () => {
    expect(blockAfter(globals, ".hero-stage {"), ".hero-stage {").not.toMatch(
      /backdrop-filter|border\s*:|box-shadow/,
    );
    expect(globals).not.toMatch(/\.hero-stage[^{]*\{[^}]*backdrop-filter/);
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

  // Value: protects=the hero photo stays still, so the stage wash always sits over a fixed image; fails_when=any rule targeting .hero-photo declares an animation, under whatever keyframe name; why_new=the earlier check only rejected one old keyframe name and missed any other; seam=none
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
