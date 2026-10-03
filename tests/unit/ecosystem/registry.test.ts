import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ECOSYSTEM,
  ECOSYSTEM_SLUGS,
  metaDescription,
  SOURCE_TITLES,
  sourceLabel,
  type DemoHref,
} from "@/content/ecosystem/registry";

const root = path.resolve(__dirname, "../../..");
const SIX_DEMO_ROUTES: readonly DemoHref[] = [
  "/demo",
  "/demo/w3-agent",
  "/demo/w4-gates",
  "/demo/w5-wet-lab",
  "/demo/w2-evidence",
  "/demo/w6-provenance",
];
const MIN_DESCRIPTION = 120;
const MAX_DESCRIPTION = 160;

describe("ecosystem registry", () => {
  it("has six entries whose slugs equal ECOSYSTEM_SLUGS, in order", () => {
    expect(Object.keys(ECOSYSTEM)).toEqual([...ECOSYSTEM_SLUGS]);
    for (const slug of ECOSYSTEM_SLUGS) expect(ECOSYSTEM[slug].slug).toBe(slug);
  });

  it("gives every entry a summary, a fit sentence and at least two sources", () => {
    for (const slug of ECOSYSTEM_SLUGS) {
      const entry = ECOSYSTEM[slug];
      expect(entry.summary.length, slug).toBeGreaterThan(60);
      expect(entry.fit.length, slug).toBeGreaterThan(30);
      expect(entry.sources.length, slug).toBeGreaterThanOrEqual(2);
      for (const source of entry.sources) {
        expect(Object.keys(SOURCE_TITLES)).toContain(source.doc);
        expect(source.section).toMatch(/^[0-9A-Z.]+$/);
      }
    }
  });

  it("points each demo link at one of the six routes, all distinct", () => {
    const hrefs = ECOSYSTEM_SLUGS.map((s) => ECOSYSTEM[s].demo.href);
    expect(new Set(hrefs).size).toBe(6);
    for (const href of hrefs) expect(SIX_DEMO_ROUTES).toContain(href);
  });

  it("has a page.tsx under src/app/(platform)/demo for every demo route", () => {
    for (const slug of ECOSYSTEM_SLUGS) {
      const href = ECOSYSTEM[slug].demo.href;
      const segment = href.replace(/^\/demo\/?/, "");
      const page = path.join(root, "src/app/(platform)/demo", segment, "page.tsx");
      expect(existsSync(page), `${slug}: ${page}`).toBe(true);
    }
  });

  it("has exactly one .mdx file per slug and none extra", () => {
    const dir = path.join(root, "src/content/ecosystem");
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .sort();
    expect(files).toEqual([...ECOSYSTEM_SLUGS].map((s) => `${s}.mdx`).sort());
  });

  it("states optional and off-chain on the provenance entry", () => {
    const entry = ECOSYSTEM["provenance-dlt"];
    const text = `${entry.summary} ${entry.fit}`.toLowerCase();
    expect(text).toContain("optional");
    expect(text).toContain("off-chain");
    expect(entry.callout?.text).toBe(
      "This component is optional. Records stay off-chain. In the demo it is labelled Optional, simulated.",
    );
  });

  it("uses the verbatim demo labels only (prompt 3.1)", () => {
    const allowed = new Set([
      "Simulated agent",
      "Simulated workflow engine",
      "Simulated compute",
      "Mock ELN",
      "Demo sign-in",
      "Demo signature, not production key",
      "Optional, simulated",
    ]);
    for (const slug of ECOSYSTEM_SLUGS) {
      for (const label of ECOSYSTEM[slug].demo.labels) expect(allowed.has(label), label).toBe(true);
    }
    expect([...ECOSYSTEM["agentic-compute"].demo.labels]).toEqual([
      "Simulated agent",
      "Simulated workflow engine",
      "Simulated compute",
    ]);
    expect([...ECOSYSTEM["wet-lab"].demo.labels]).toEqual(["Mock ELN"]);
    expect([...ECOSYSTEM["provenance-dlt"].demo.labels]).toEqual(["Optional, simulated"]);
    expect([...ECOSYSTEM["scientific-review"].demo.labels]).toEqual([
      "Demo signature, not production key",
    ]);
  });

  it("cites only the three closed documents", () => {
    expect(SOURCE_TITLES).toEqual({
      TA: "NEWMA Technology Architecture and Workflows",
      ARCH: "NEWMA technological architecture and technology stack",
      PRD: "NEWMA Product Requirements Document v1.0",
    });
    expect(sourceLabel({ doc: "TA", section: "4" })).toBe(
      "NEWMA Technology Architecture and Workflows § 4",
    );
  });

  it("declares a C-4x claim for every page, plus the optional statement on provenance", () => {
    ECOSYSTEM_SLUGS.forEach((slug, i) => {
      expect(ECOSYSTEM[slug].claims).toContain(`C-4${i}`);
    });
    expect(ECOSYSTEM["provenance-dlt"].claims).toContain("C-46");
  });

  it("derives meta descriptions of 120 to 160 characters at a sentence boundary", () => {
    for (const slug of ECOSYSTEM_SLUGS) {
      const description = metaDescription(ECOSYSTEM[slug].summary);
      expect(description.length, slug).toBeGreaterThanOrEqual(MIN_DESCRIPTION);
      expect(description.length, slug).toBeLessThanOrEqual(MAX_DESCRIPTION);
      expect(description.endsWith("."), slug).toBe(true);
      expect(ECOSYSTEM[slug].summary.startsWith(description), slug).toBe(true);
    }
  });

  it("contains no digits in prose fields", () => {
    for (const slug of ECOSYSTEM_SLUGS) {
      const e = ECOSYSTEM[slug];
      expect(`${e.title} ${e.summary} ${e.fit} ${e.demo.workflow}`).not.toMatch(/\d/);
    }
  });
});
