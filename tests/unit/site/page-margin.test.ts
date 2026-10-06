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
