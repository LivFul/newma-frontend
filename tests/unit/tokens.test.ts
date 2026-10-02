import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseCssVars } from "@/lib/a11y/contrast";

const tokensDir = path.resolve(__dirname, "../../src/styles/tokens");
const read = (f: string) => readFileSync(path.join(tokensDir, f), "utf8");

describe("design tokens", () => {
  it("every declared text/background pair meets 4.5:1", () => {
    const vars = parseCssVars(read("color.css"));
    const pairs = JSON.parse(read("contrast-pairs.json")) as {
      fg: string;
      bg: string;
      min: number;
    }[];
    expect(pairs.length).toBeGreaterThanOrEqual(8);
    for (const p of pairs) {
      expect(vars[p.fg], p.fg).toBeDefined();
      expect(vars[p.bg], p.bg).toBeDefined();
      expect(contrastRatio(vars[p.fg], vars[p.bg]), `${p.fg} on ${p.bg}`).toBeGreaterThanOrEqual(
        p.min,
      );
    }
  });

  it("zeros every motion duration under prefers-reduced-motion", () => {
    const css = read("motion.css");
    const block = css.split("@media (prefers-reduced-motion: reduce)")[1];
    expect(block).toBeDefined();
    const base = parseCssVars(css.split("@media")[0]);
    const durations = Object.keys(base).filter((k) => k.startsWith("--motion-duration-"));
    expect(durations.length).toBeGreaterThanOrEqual(3);
    for (const d of durations) {
      expect(block).toMatch(new RegExp(`${d}\\s*:\\s*0ms`));
    }
  });
});
