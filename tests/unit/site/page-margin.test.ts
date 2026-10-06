// Value: protects=page margin is 12px below 48rem, 0.5in from there, and 0 in print, and a wrapped header still clears focused content; fails_when=the tablet rule, the print padding reset, or the narrow-screen focus offset is dropped; why_new=sticky-header allows a header top anywhere in 0 to 48px at rest; seam=none
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCssVars } from "@/lib/a11y/contrast";

const globals = readFileSync(path.resolve(__dirname, "../../../src/app/globals.css"), "utf8");
const workflow = readFileSync(
  path.resolve(__dirname, "../../../src/components/site/workflow-diagram.css"),
  "utf8",
);
const space = parseCssVars(
  readFileSync(path.resolve(__dirname, "../../../src/styles/tokens/space.css"), "utf8"),
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

describe("survey page margin", () => {
  it("is 12px on phones, a half inch from tablet width, and zero in print", () => {
    expect(space["--space-3"]).toBe("0.75rem");
    expect(blockAfter(globals, "\nbody {")).toContain("padding: var(--space-3)");
    const tablet = blockAfter(globals, "@media (min-width: 48rem)");
    expect(tablet).toContain("padding: 0.5in");
    expect(tablet).not.toContain("var(--space-3)");
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
