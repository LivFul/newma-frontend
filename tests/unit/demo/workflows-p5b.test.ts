import { describe, expect, it } from "vitest";
import { WORKFLOWS } from "@/lib/demo/workflows";

describe("W8-W10 workflow entries (A-P5B-20)", () => {
  it("uses the sprint plan §3.2 names and links the three pages", () => {
    expect(WORKFLOWS.slice(7).map((w) => [w.id, w.title, w.href])).toEqual([
      ["W8", "Partner portal & controlled export", "/demo/w8-partner"],
      ["W9", "Campaign, quotas & cost", "/demo/w9-campaign"],
      ["W10", "Custodian view", "/demo/w10-custodian"],
    ]);
  });
});
