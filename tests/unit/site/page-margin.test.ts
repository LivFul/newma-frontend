import { readFileSync } from "node:fs";
import path from "path";
import { describe, expect, it } from "vitest";

const globals = readFileSync(path.resolve(__dirname, "../../../src/app/globals.css"), "utf8");
const workflow = readFileSync(
  path.resolve(__dirname, "../../../src/components/site/workflow-diagram.css"),
  "utf8",
);

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

describe("full-bleed page shell", () => {
  // Value: protects=the screen body is full-bleed (no padding of its own) and print resets padding to zero; fails_when=a page margin is put back on the body or the print reset is dropped; why_new=the old test grepped for strings of a removed design instead of the contract; seam=none
  it("keeps the screen body full-bleed and resets padding for print", () => {
    expect(blockAfter(globals, "\nbody {")).not.toMatch(/padding/);
    expect(blockAfter(globals, "@media print")).toMatch(/padding:\s*0;/);
  });

  it("offsets a wrapped header through a 412px phone without an unresolved token", () => {
    const wrapped = blockAfter(globals, "@media (max-width: 27.5rem)");
    expect(wrapped).toContain("scroll-padding-top: calc(7.5rem + var(--space-4))");
    expect(wrapped).not.toContain("var(--size-header-wrapped)");
    expect(globals).not.toContain("374.98px");
  });

  it("caps the sideways diagram so a focused region clears a wrapped header", () => {
    const wrapped = blockAfter(workflow, "@media (max-width: 27.5rem)");
    expect(wrapped).toContain("max-height: calc(100dvh - 7.5rem - var(--space-4))");
  });
});

const declaration = (block: string, property: string): string =>
  new RegExp(`${property}:\\s*([^;]+);`).exec(block)?.[1] ?? "";

describe("hero background and installed-app contracts", () => {
  // Value: protects=the hero lines drift by transform only, over a layer one tile larger than the hero and slid by exactly one tile (a seamless loop on the compositor), and only when motion is allowed; fails_when=the drift animates background-position (repaints the hero), the distance or the overhang stops matching the tile, or the animation escapes the no-preference block; why_new=the drift had been removed because it repainted the whole hero, and nothing pinned how it had to be built; seam=none
  it("drifts the hero lines one tile by transform, only when motion is allowed", () => {
    const layer = blockAfter(globals, ".botanical-lines::before {");
    expect(declaration(layer, "inset")).toBe("calc(var(--tile) * -1) 0 0 calc(var(--tile) * -1)");
    expect(declaration(layer, "background")).toContain("var(--tile) var(--tile)");

    const keyframes = blockAfter(globals, "@keyframes botanical-drift");
    expect(keyframes).toContain("translate3d(var(--tile), var(--tile), 0)");
    expect(keyframes).not.toContain("background-position");

    const use = globals.indexOf("animation: botanical-drift");
    expect(use).toBeGreaterThan(0);
    expect(globals.slice(globals.lastIndexOf("@media", use))).toMatch(
      /^@media \(prefers-reduced-motion: no-preference\)/,
    );
  });

  // Value: protects=the wrapped-phone and short-viewport scroll offsets are not overridden in the installed app by the general standalone rule; fails_when=the narrow or short standalone rules move above the general one, or lose their offset; why_new=the general standalone rule had equal specificity and came later, so anchor jumps landed under the wrapped header only in the installed app; seam=none
  it("orders the standalone scroll-padding rules from general to specific", () => {
    const general = globals.indexOf("@media (display-mode: standalone) {");
    const narrow = globals.indexOf("@media (display-mode: standalone) and (max-width: 27.5rem)");
    const short = globals.indexOf("@media (display-mode: standalone) and (max-height: 32rem)");
    expect(general).toBeGreaterThanOrEqual(0);
    expect(narrow).toBeGreaterThan(general);
    expect(short).toBeGreaterThan(general);
    expect(
      blockAfter(globals, "@media (display-mode: standalone) and (max-width: 27.5rem)"),
    ).toContain("7.5rem");
    expect(
      blockAfter(globals, "@media (display-mode: standalone) and (max-height: 32rem)"),
    ).toContain("scroll-padding-top: var(--space-4)");
  });

  // Value: protects=a finished reveal leaves no transform on the section, which would make it the containing block of its fixed and sticky descendants; fails_when=the reveal animation fill mode goes back to forwards or both; why_new=fill-mode both kept translateY(0) on every revealed section; seam=none
  it("does not keep the reveal animation's end state", () => {
    expect(declaration(blockAfter(globals, ".reveal-in {"), "animation")).toMatch(/\bbackwards\b/);
  });
});
