import { describe, expect, it } from "vitest";
import {
  filletSegments,
  planRoute,
  portPoint,
  segmentCrossesBox,
  type Box,
  type Footprint,
} from "@/lib/workflow/geometry";
import type { RouteSpec } from "@/lib/workflow/graph";

const BOX: Box = { halfW: 1, halfD: 0.5 };
const at = (x: number, z: number, box: Box = BOX): Footprint => ({ center: { x, z }, box });

describe("portPoint", () => {
  const node = at(10, 20);
  it("places N and S ports on the top and bottom edges, slid sideways by the offset", () => {
    expect(portPoint(node, ["N", 0.25])).toEqual({ x: 10.25, z: 19.5 });
    expect(portPoint(node, ["S", -0.25])).toEqual({ x: 9.75, z: 20.5 });
  });
  it("places E and W ports on the side edges, slid along by the offset", () => {
    expect(portPoint(node, ["E", 0.1])).toEqual({ x: 11, z: 20.1 });
    expect(portPoint(node, ["W", -0.1])).toEqual({ x: 9, z: 19.9 });
  });
});

describe("planRoute", () => {
  it("is a straight line when the ports line up", () => {
    const route: RouteSpec = { exit: ["S", 0], via: [], enter: ["N", 0] };
    expect(planRoute(route, at(0, 0), at(0, 5))).toEqual([
      { x: 0, z: 0.5 },
      { x: 0, z: 4.5 },
    ]);
  });

  it("follows each via step on one axis at a time", () => {
    const route: RouteSpec = {
      exit: ["S", 0],
      via: [
        ["z", 2],
        ["x", 6],
      ],
      enter: ["N", 0],
    };
    expect(planRoute(route, at(0, 0), at(6, 5))).toEqual([
      { x: 0, z: 0.5 },
      { x: 0, z: 2 },
      { x: 6, z: 2 },
      { x: 6, z: 4.5 },
    ]);
  });

  it("adds the closing corner when the last step does not line up with the entry port", () => {
    const vertical: RouteSpec = { exit: ["S", 0], via: [["z", 2]], enter: ["N", 0] };
    expect(planRoute(vertical, at(0, 0), at(6, 5)).slice(-3)).toEqual([
      { x: 0, z: 2 },
      { x: 6, z: 2 },
      { x: 6, z: 4.5 },
    ]);
    const horizontal: RouteSpec = { exit: ["S", 0], via: [["z", 3]], enter: ["E", 0] };
    expect(planRoute(horizontal, at(0, 0), at(-5, 5)).slice(-2)).toEqual([
      { x: 0, z: 5 },
      { x: -4, z: 5 },
    ]);
  });

  it("never returns two identical consecutive points", () => {
    const route: RouteSpec = { exit: ["S", 0], via: [["z", 0.5]], enter: ["N", 0] };
    const points = planRoute(route, at(0, 0), at(0, 5));
    points.slice(1).forEach((p, i) => expect(p).not.toEqual(points[i]));
  });
});

describe("segmentCrossesBox", () => {
  const box = at(0, 0, { halfW: 1, halfD: 1 });
  it("detects a segment that passes through the interior", () => {
    expect(segmentCrossesBox({ x: -3, z: 0 }, { x: 3, z: 0 }, box)).toBe(true);
    expect(segmentCrossesBox({ x: 0, z: -3 }, { x: 0, z: 3 }, box)).toBe(true);
  });
  it("lets a segment run along or touch the edge", () => {
    expect(segmentCrossesBox({ x: -3, z: 1 }, { x: 3, z: 1 }, box)).toBe(false);
    expect(segmentCrossesBox({ x: 1, z: -3 }, { x: 1, z: 3 }, box)).toBe(false);
  });
  it("ignores a segment that stays clear", () => {
    expect(segmentCrossesBox({ x: -3, z: 2 }, { x: 3, z: 2 }, box)).toBe(false);
  });
});

describe("filletSegments", () => {
  it("returns one line for a two-point path", () => {
    expect(
      filletSegments(
        [
          { x: 0, z: 0 },
          { x: 4, z: 0 },
        ],
        0.5,
      ),
    ).toEqual([{ kind: "line", from: { x: 0, z: 0 }, to: { x: 4, z: 0 } }]);
  });

  it("rounds an interior corner with a quadratic arc between two shortened lines", () => {
    const segments = filletSegments(
      [
        { x: 0, z: 0 },
        { x: 4, z: 0 },
        { x: 4, z: 4 },
      ],
      0.5,
    );
    expect(segments).toEqual([
      { kind: "line", from: { x: 0, z: 0 }, to: { x: 3.5, z: 0 } },
      { kind: "quad", from: { x: 3.5, z: 0 }, control: { x: 4, z: 0 }, to: { x: 4, z: 0.5 } },
      { kind: "line", from: { x: 4, z: 0.5 }, to: { x: 4, z: 4 } },
    ]);
  });

  it("never rounds more than half of a short segment", () => {
    const segments = filletSegments(
      [
        { x: 0, z: 0 },
        { x: 1, z: 0 },
        { x: 1, z: 10 },
      ],
      5,
    );
    const quad = segments.find((s) => s.kind === "quad");
    expect(quad && quad.from).toEqual({ x: 0.5, z: 0 });
  });
});
