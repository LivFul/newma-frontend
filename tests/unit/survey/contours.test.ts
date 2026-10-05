// Value: protects=hero terrain linework: ring count, every 5th ring is an index contour, closed paths, deterministic output; fails_when=ring/index math or path closing regresses; why_new=new pure module; seam=none
import { describe, expect, it } from "vitest";
import { contours, type Hill } from "@/lib/survey/contours";

const hill = (over: Partial<Hill> = {}): Hill => ({
  cx: 100,
  cy: 80,
  r0: 10,
  step: 20,
  rings: 10,
  squash: 0.7,
  tilt: 0.3,
  seed: 1.3,
  ...over,
});

// Every anchor point of a closed path: the M point plus the end point of each C segment.
function anchors(d: string): ReadonlyArray<readonly [number, number]> {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const points: Array<readonly [number, number]> = [[nums[0]!, nums[1]!]];
  for (let i = 2; i + 5 < nums.length; i += 6) points.push([nums[i + 4]!, nums[i + 5]!]);
  return points;
}

describe("contours", () => {
  it("returns one closed path per ring across all hills, in hill order", () => {
    const lines = contours([hill({ rings: 3 }), hill({ rings: 7, cx: 400 })]);
    expect(lines).toHaveLength(10);
    for (const line of lines) {
      expect(line.d).toMatch(/^M-?[\d.]+ -?[\d.]+(C(-?[\d.]+ ){5}-?[\d.]+)+Z$/);
      expect(line.d).not.toContain("NaN");
    }
  });

  it("marks every fifth ring of each hill as an index contour, restarting per hill", () => {
    const flags = contours([hill({ rings: 10 }), hill({ rings: 6 })]).map((l) => l.index);
    expect(flags).toEqual([
      ...[false, false, false, false, true, false, false, false, false, true],
      ...[false, false, false, false, true, false],
    ]);
  });

  it("is deterministic and gives every ring a distinct outline", () => {
    const hills = [hill()];
    const first = contours(hills);
    expect(contours(hills)).toEqual(first);
    expect(new Set(first.map((l) => l.d)).size).toBe(first.length);
  });

  it("returns nothing for no hills or a hill with zero rings", () => {
    expect(contours([])).toEqual([]);
    expect(contours([hill({ rings: 0 })])).toEqual([]);
  });

  it("widens with the ring index and stays centred on the hill", () => {
    const [inner, outer] = contours([hill({ rings: 2, squash: 1, tilt: 0, step: 50 })]);
    const width = (d: string) => {
      const xs = anchors(d).map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width(outer!.d)).toBeGreaterThan(width(inner!.d));
    const xs = anchors(outer!.d).map(([x]) => x);
    expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(100, -1);
  });
});
