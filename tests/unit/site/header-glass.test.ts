import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blend, contrastRatio, parseCssVars } from "@/lib/a11y/contrast";

const SRC = path.resolve(__dirname, "../../../src");
const globals = readFileSync(path.join(SRC, "app/globals.css"), "utf8");
const colors = parseCssVars(readFileSync(path.join(SRC, "styles/tokens/color.css"), "utf8"));
const WCAG_AA_TEXT = 4.5;

describe("header glass", () => {
  // Value: protects=the header's muted labels stay AA on the light glass over the darkest flat backdrop it crosses (the aurora's sage wash);
  //   fails_when=--glass-tint is lowered, the elevated ground darkens, or Slate is lightened;
  //   why_new=the glass tint had no contrast bound; the photo case is measured on the rendered page in tests/a11y/header-contrast.spec.ts, because the 22px blur averages the photo and no flat bound models that; seam=none
  it("keeps muted labels at 4.5:1 over the hero's sage wash", () => {
    const tint = Number(/--glass-tint:\s*([\d.]+);/.exec(globals)?.[1]);
    expect(tint).toBeGreaterThan(0);
    const backdrop = blend(colors["--color-bg-elevated"]!, tint, colors["--color-success"]!);
    expect(contrastRatio(colors["--color-fg-muted"]!, backdrop)).toBeGreaterThanOrEqual(
      WCAG_AA_TEXT,
    );
  });
});
