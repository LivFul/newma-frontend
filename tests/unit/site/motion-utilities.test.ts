import { readFileSync } from "node:fs";
import path from "path";
import { describe, expect, it } from "vitest";

const globals = readFileSync(path.resolve(__dirname, "../../../src/app/globals.css"), "utf8");

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

describe("motion utilities", () => {
  it("declares the hero, dialog, card, and workflow motion hooks", () => {
    expect(globals).toContain(".hero-entrance-item");
    expect(globals).toContain(".reveal-child");
    expect(globals).toContain('.dialog-overlay[data-state="open"]');
    expect(globals).toContain('.dialog-panel[data-state="closed"]');
    expect(globals).toContain(".hover-lift");
    expect(globals).toContain(".workflow-swap");
    expect(globals).toContain(".mobile-sections:not([hidden])");
  });

  it("does not leave a transform on section-level entrance animations", () => {
    for (const marker of [".reveal-in {", ".hero-entrance-item {", ".reveal-in .reveal-child {"]) {
      const animation = blockAfter(globals, marker);
      expect(animation, marker).toMatch(/\bbackwards\b/);
      expect(animation, marker).not.toMatch(/\b(forwards|both)\b/);
    }
  });

  it("lifts cards with colour and shadow, not translation", () => {
    const lift = blockAfter(globals, ".hover-lift {");
    expect(lift).toContain("background-color");
    expect(lift).toContain("border-color");
    expect(lift).toContain("box-shadow");
    expect(lift).not.toContain("transform");
    expect(globals).not.toContain("hover:-translate-y-0.5");
  });
});
