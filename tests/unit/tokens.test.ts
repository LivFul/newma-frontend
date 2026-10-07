import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseCssVars } from "@/lib/a11y/contrast";

const tokensDir = path.resolve(__dirname, "../../src/styles/tokens");
const read = (f: string) => readFileSync(path.join(tokensDir, f), "utf8");
const srcDir = path.resolve(__dirname, "../../src");

const cssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return cssFiles(p);
    return p.endsWith(".css") ? [p] : [];
  });

describe("design tokens", () => {
  it("every declared text/background pair meets 4.5:1", () => {
    const vars = { ...parseCssVars(read("color.css")), ...parseCssVars(read("ecosystem.css")) };
    const pairs = JSON.parse(read("contrast-pairs.json")) as {
      fg: string;
      bg: string;
      min: number;
    }[];
    const fgTokens = Object.keys(vars).filter((k) => /^--color-.+-fg$/.test(k));
    expect(fgTokens.length).toBeGreaterThan(0);
    for (const fg of fgTokens) {
      const base = fg.replace(/-fg$/, "");
      expect(
        pairs.some((p) => p.fg === fg && p.bg === base),
        `${fg} needs a pair on ${base}`,
      ).toBe(true);
    }
    for (const p of pairs) {
      expect(vars[p.fg], p.fg).toBeDefined();
      expect(vars[p.bg], p.bg).toBeDefined();
      expect(contrastRatio(vars[p.fg], vars[p.bg]), `${p.fg} on ${p.bg}`).toBeGreaterThanOrEqual(
        p.min,
      );
    }
  });

  it("declares brand gradient surfaces", () => {
    const eco = read("ecosystem.css");
    for (const name of [
      "--background-image-brand",
      "--background-image-leaf",
      "--background-image-capsule",
      "--background-image-aurora",
      "--background-image-deep",
    ]) {
      expect(eco).toContain(name);
    }
  });

  it("declares the ecosystem hues and the display, header tokens", () => {
    const eco = parseCssVars(read("ecosystem.css"));
    for (const name of [
      "--color-eco-compute",
      "--color-eco-optional",
      "--font-display",
      "--text-display",
      "--size-header",
    ]) {
      expect(eco[name], name).toBeDefined();
    }
    expect(read("index.css")).toContain('@import "./ecosystem.css"');
  });

  it("zeros every motion duration under prefers-reduced-motion", () => {
    const css = read("motion.css");
    const block = css.split("@media (prefers-reduced-motion: reduce)")[1];
    expect(block).toBeDefined();
    const base = parseCssVars(css.split("@media")[0]);
    const durations = Object.keys(base).filter((k) => k.startsWith("--motion-duration-"));
    expect(durations.length).toBeGreaterThanOrEqual(4);
    for (const d of durations) {
      expect(block).toMatch(new RegExp(`${d}\\s*:\\s*0ms`));
    }
  });

  it("declares reveal stagger and distance tokens and zeros them under reduced motion", () => {
    const css = read("motion.css");
    const base = parseCssVars(css.split("@media")[0]);
    expect(base["--motion-duration-reveal"]).toBe("400ms");
    expect(base["--motion-stagger-tight"]).toBe("60ms");
    expect(base["--motion-stagger-base"]).toBe("80ms");
    expect(base["--motion-distance-sm"]).toBe("8px");
    expect(base["--motion-distance-md"]).toBe("16px");
    const block = css.split("@media (prefers-reduced-motion: reduce)")[1]!;
    expect(block).toMatch(/--motion-stagger-tight\s*:\s*0ms/);
    expect(block).toMatch(/--motion-stagger-base\s*:\s*0ms/);
    expect(block).toMatch(/--motion-distance-sm\s*:\s*0px/);
    expect(block).toMatch(/--motion-distance-md\s*:\s*0px/);
  });

  it("declares the extra spacing steps used by the marketing layout", () => {
    const space = parseCssVars(read("space.css"));
    expect(space["--space-5"]).toBe("1.25rem");
    expect(space["--space-10"]).toBe("2.5rem");
    expect(space["--space-20"]).toBe("5rem");
    expect(space["--space-28"]).toBe("7rem");
  });

  it("no CSS custom property under src/ references itself", () => {
    const offenders = cssFiles(srcDir).flatMap((file) =>
      Object.entries(parseCssVars(readFileSync(file, "utf8")))
        .filter(([name, value]) => value === `var(${name})`)
        .map(([name]) => `${path.relative(srcDir, file)}: ${name}`),
    );
    expect(offenders).toEqual([]);
  });

  it("wires Tailwind transition defaults to the motion tokens", () => {
    const base = parseCssVars(read("motion.css").split("@media")[0]);
    expect(base["--default-transition-duration"]).toBe("var(--motion-duration-fast)");
    expect(base["--default-transition-timing-function"]).toBe("var(--motion-ease-standard)");
  });
});
