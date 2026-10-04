import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NUM_FIGURES } from "../../scripts/claims/policy.mjs";
import { DEMO_BANNER_TEXT } from "../../src/lib/demo/banner";

const ROOT = path.resolve(__dirname, "../..");
const DOC = readFileSync(path.join(ROOT, "docs/DEMO_SCRIPT.md"), "utf8");
// Line wrapping may split a quoted label; compare on single-spaced text.
const FLAT = DOC.replace(/\s+/g, " ");
const SRC_DIRS = ["src/app/(platform)/demo", "src/lib/demo", "src/lib"];
const MANDATORY_LABELS = [
  "Simulated agent",
  "Simulated workflow engine",
  "Simulated compute",
  "Mock ELN",
  "Demo sign-in",
  "Demo signature, not production key",
  "Optional, simulated",
];
// Steps in plan order with their planned minutes (sprint review plan, D-21).
const STEPS = [
  [1, "Homepage", 1],
  [2, "Community liaison", 2],
  [3, "Scientist", 4],
  [4, "Scientific approver", 2],
  [5, "Wet-lab / CRO", 3],
  [6, "W6", 1],
  [7, "Partner and Finance", 2],
] as const;
// Labels the script tells the presenter to click or read; each must exist in the shipped source.
const UI_LABELS = [
  "Evaluate policy",
  "Withdraw consent",
  "Confirm withdrawal",
  "Send concern",
  "Tell us what happened",
  "Ask the simulated agent",
  "Budget (demo credits)",
  "Submit as work package in W5",
  "Demo sign-in step-up",
  "Sign decision",
  "Submit work package",
  "Import results",
  "Record disposition",
  "Accept results",
  "Confirm acceptance",
  "Accepted by NEWMA scientist",
  "Edit Mock ELN record (correct a value)",
  "Execute retraining",
  "Verify signature",
  "Demo tamper toggle",
  "Issue export",
  "Run credential check",
  "Decide license",
  "Create settlement",
  "Mark reviewed",
  "Approve evidence",
  "Reconcile receipts",
  "Simulate chain outage (demo)",
  "Start simulated screening",
  "Reset demo data",
  "Evidence label legend",
  "Grievance queue",
];

// Built from a template in the source (`Sign ${stage} decision`), so only the script is checked.
const TEMPLATED_LABELS = ["Sign H1 decision", "Sign H2 decision"];

function sourceText(): string {
  const read = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) return read(full);
      return /\.(ts|tsx)$/.test(name) ? [readFileSync(full, "utf8")] : [];
    });
  return SRC_DIRS.flatMap((dir) => read(path.join(ROOT, dir))).join("\n");
}

describe("docs/DEMO_SCRIPT.md", () => {
  it("has the seven steps in plan order with the planned minutes, totalling fifteen", () => {
    const headings = [...DOC.matchAll(/^## Step (\d)\. (.+) \((\d+) minutes?\)$/gm)];
    expect(headings.map((m) => [Number(m[1]), Number(m[3])])).toEqual(
      STEPS.map(([n, , minutes]) => [n, minutes]),
    );
    headings.forEach((m, i) => expect(m[2]).toContain(STEPS[i]![1]));
    expect(STEPS.reduce((sum, [, , minutes]) => sum + minutes, 0)).toBe(15);
  });

  it("has the pre-flight checklist and the failure note", () => {
    expect(DOC).toMatch(/^## Pre-flight checklist$/m);
    expect(DOC).toMatch(/^## What to say if something fails$/m);
    expect(DOC.match(/^- \[ \] /gm)?.length).toBeGreaterThanOrEqual(5);
  });

  it("quotes the demo banner verbatim", () => {
    expect(FLAT).toContain(DEMO_BANNER_TEXT);
  });

  it.each(MANDATORY_LABELS)("uses the mandatory label %s", (label) => {
    expect(FLAT).toContain(label);
  });

  it("contains no NUM figure, currency or percentage", () => {
    for (const { id, test } of NUM_FIGURES) expect(DOC, id).not.toMatch(test);
  });

  it("names only allowed proper nouns for organisations", () => {
    expect(DOC).not.toMatch(/\bLV-?\d/);
    expect(DOC).not.toMatch(/\bDEMO-C-\d/);
  });

  it("only cites labels that exist in the shipped demo source", () => {
    const source = sourceText();
    const missing = UI_LABELS.filter((label) => !source.includes(label));
    expect(missing).toEqual([]);
    for (const label of [...UI_LABELS, ...TEMPLATED_LABELS]) expect(FLAT, label).toContain(label);
    expect(source).toContain("decision`");
  });
});
