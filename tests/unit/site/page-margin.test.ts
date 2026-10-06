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

// Entries of a comma-separated CSS list, ignoring commas inside parentheses (gradients, var(), url()).
function topLevelEntries(value: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      entries.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  entries.push(current.trim());
  return entries.filter(Boolean);
}

const declaration = (block: string, property: string): string =>
  new RegExp(`${property}:\\s*([^;]+);`).exec(block)?.[1] ?? "";

const ecosystemTokens = readFileSync(
  path.resolve(__dirname, "../../../src/styles/tokens/ecosystem.css"),
  "utf8",
);

describe("hero background and installed-app contracts", () => {
  // Value: protects=the hero's combined aurora and botanical-lines background has one size and one position per layer, so no layer is mis-sized by a repeating list; fails_when=the aurora token gains or loses a layer without the combined rule following, or a list is shortened; why_new=a two-entry size list over a five-layer background tiled the base gradient at 720px and left a hard seam across the hero; seam=none
  it("lists one size and one position for every layer of the combined hero background", () => {
    const token = /--background-image-aurora:\s*([^;]+);/.exec(ecosystemTokens)?.[1] ?? "";
    const auroraLayers = topLevelEntries(token).length;
    expect(auroraLayers).toBeGreaterThan(1);
    const combined = blockAfter(globals, ".aurora.botanical-lines {");
    // The image list holds the lines plus the whole token as one var(); it expands to one layer more
    // than the token has, and size and position must match that expanded count.
    expect(topLevelEntries(declaration(combined, "background-image"))).toHaveLength(2);
    const layers = auroraLayers + 1;
    expect(topLevelEntries(declaration(combined, "background-size"))).toHaveLength(layers);
    expect(topLevelEntries(declaration(combined, "background-position"))).toHaveLength(layers);
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
