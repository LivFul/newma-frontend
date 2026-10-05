import { describe, expect, it } from "vitest";
import * as about from "@/content/home/about";
import * as chrome from "@/content/home/chrome";
import * as copy from "@/content/home/copy";
import * as caption from "@/content/home/hero-caption";
import * as help from "@/content/home/hero-help";
import * as how from "@/content/home/how-it-works";
import * as personas from "@/content/home/personas";
import * as survey from "@/content/home/survey";
import * as workflow from "@/content/home/workflow";
import * as heroText from "@/content/ecosystem/hero-text";
import * as registry from "@/content/ecosystem/registry";
import type { CopyBlock } from "@/content/types";

const STRUCTURAL_MAX_WORDS = 4;

function collect(value: unknown, found: CopyBlock[] = []): CopyBlock[] {
  if (value && typeof value === "object") {
    const maybe = value as Partial<CopyBlock>;
    if (
      typeof maybe.id === "string" &&
      typeof maybe.text === "string" &&
      Array.isArray(maybe.claims)
    ) {
      found.push(maybe as CopyBlock);
    } else {
      for (const child of Object.values(value)) collect(child, found);
    }
  }
  return found;
}

// Value: protects=survey map labels obey the claim-register shape (unique ids, claim ids, no digits or superlatives); fails_when=a label is added without ids or with a number; why_new=survey.ts was missing from this registry; seam=none
const modules = { about, chrome, copy, caption, help, how, personas, survey, heroText, workflow };
// A block may be re-exported from two modules (the footer reuses the hero disclaimer): count it once.
const blocks = [...new Set(Object.values(modules).flatMap((m) => collect(m)))];
// Hero labels live in the registry as plain title/descriptor pairs; wrap them for the same checks.
const heroLabelBlocks: CopyBlock[] = Object.entries(registry.HERO_LABELS).flatMap(([slug, l]) => [
  { id: `hero.${slug}.title`, text: l.title, claims: registry.HERO_CLAIMS },
  { id: `hero.${slug}.descriptor`, text: l.descriptor, claims: registry.HERO_CLAIMS },
]);
const all = [...blocks, ...heroLabelBlocks];

describe("home copy modules", () => {
  it("find a meaningful number of blocks", () => {
    expect(all.length).toBeGreaterThan(40);
  });
  it("use unique ids", () => {
    const ids = all.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("give every block a claim id, except structural labels of four words or fewer", () => {
    for (const b of all) {
      if (b.claims.length === 0) {
        expect(b.text.split(/\s+/).length, `${b.id} needs a claim`).toBeLessThanOrEqual(
          STRUCTURAL_MAX_WORDS,
        );
      }
    }
  });
  it("only reference claim ids in the reserved C-20 upward range", () => {
    for (const b of all) {
      for (const id of b.claims) expect(id, b.id).toMatch(/^C-(2\d|3\d|4\d|5\d)$/);
    }
  });
  it("contain no digits, percentages or currency symbols", () => {
    for (const b of all) {
      expect(b.text, b.id).not.toMatch(/[0-9%$€£¥]/);
    }
  });
  it("name no LV-series id, demo compound id or partner logo", () => {
    for (const b of all) {
      expect(b.text, b.id).not.toMatch(/\bLV-?\d|DEMO-C|partner logo/i);
    }
  });
  it("avoids superlatives and words that claim achievement", () => {
    const text = all.map((b) => b.text).join(" ");
    expect(text).not.toMatch(/\b(proven|guarantee[sd]?|best-in-class|outperform\w*)\b/i);
  });
});
