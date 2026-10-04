import { describe, expect, it } from "vitest";
import { WORKFLOWS } from "@/lib/demo/workflows";

describe("workflow index (A-P3-21)", () => {
  it("uses the sprint plan §3.2 names and links W1–W7", () => {
    expect(WORKFLOWS.slice(0, 7).map((w) => [w.id, w.title, w.href])).toEqual([
      ["W1", "Rights & use authorization", "/demo/w1-rights"],
      ["W2", "Ingestion & curation", "/demo/w2-evidence"],
      ["W3", "Agentic discovery", "/demo/w3-agent"],
      ["W4", "Scientific review & gates", "/demo/w4-gates"],
      ["W5", "Closed-loop wet lab", "/demo/w5-wet-lab"],
      ["W6", "Signed provenance", "/demo/w6-provenance"],
      ["W7", "Licensing & benefit settlement", "/demo/w7-settlement"],
    ]);
  });

  it("links every workflow W8–W10 to its page and leaves no P5 placeholder", () => {
    expect(WORKFLOWS.slice(7).map((w) => [w.id, w.href])).toEqual([
      ["W8", "/demo/w8-partner"],
      ["W9", "/demo/w9-campaign"],
      ["W10", "/demo/w10-custodian"],
    ]);
    expect(WORKFLOWS.filter((w) => w.href === undefined)).toEqual([]);
  });
});
