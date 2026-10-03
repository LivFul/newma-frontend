import { describe, expect, it } from "vitest";
import { WORKFLOWS } from "@/lib/demo/workflows";

describe("workflow index (A-P3-21)", () => {
  it("uses the sprint plan §3.2 names and links W1–W6", () => {
    expect(WORKFLOWS.slice(0, 7).map((w) => [w.id, w.title, w.href])).toEqual([
      ["W1", "Rights & use authorization", "/demo/w1-rights"],
      ["W2", "Ingestion & curation", "/demo/w2-evidence"],
      ["W3", "Agentic discovery", "/demo/w3-agent"],
      ["W4", "Scientific review & gates", "/demo/w4-gates"],
      ["W5", "Closed-loop wet lab", "/demo/w5-wet-lab"],
      ["W6", "Signed provenance", "/demo/w6-provenance"],
      ["W7", "Licensing & benefit settlement", undefined],
    ]);
  });

  it("keeps unlinked workflows as P5 placeholders", () => {
    const unlinked = WORKFLOWS.filter((w) => w.href === undefined);
    expect(unlinked.every((w) => w.phase === "P5")).toBe(true);
  });
});
