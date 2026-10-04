import { describe, expect, it } from "vitest";
import { wrapLabel } from "@/lib/workflow/footprints";

describe("wrapLabel", () => {
  // Value: protects=label wrapping that sizes every node, note and edge tag; fails_when=empty input yields a blank line, a long word is split or dropped, or the limit is off by one; why_new=only exercised indirectly through real copy; seam=none
  it.each([
    ["empty text", "", 10, []],
    ["whitespace only", "   ", 10, []],
    ["a single word", "one", 10, ["one"]],
    ["exactly the limit", "abcd efgh", 9, ["abcd efgh"]],
    ["one past the limit", "abcd efgh", 8, ["abcd", "efgh"]],
    ["a word longer than the limit", "supercalifragilistic go", 5, ["supercalifragilistic", "go"]],
    ["runs of spaces", "a   b", 10, ["a b"]],
  ] as const)("wraps %s", (_name, text, max, expected) => {
    expect(wrapLabel(text, max)).toEqual(expected);
  });
});
