import type { Port, RouteSpec } from "./graph";

// Pure route geometry shared by the static SVG and the 3D scene. Points use world units on the
// ground plane: x runs right, z runs down the page. Each renderer supplies its own footprint sizes,
// so a node can be drawn larger in 2D than in 3D while every route still starts and ends on its edge.

export interface Point {
  readonly x: number;
  readonly z: number;
}

/** Half the width and depth of a node's footprint, in world units. */
export interface Box {
  readonly halfW: number;
  readonly halfD: number;
}

export interface Footprint {
  readonly center: Point;
  readonly box: Box;
}

export type Segment =
  | { readonly kind: "line"; readonly from: Point; readonly to: Point }
  | { readonly kind: "quad"; readonly from: Point; readonly control: Point; readonly to: Point };

const EPSILON = 1e-6;

const same = (a: Point, b: Point): boolean =>
  Math.abs(a.x - b.x) < EPSILON && Math.abs(a.z - b.z) < EPSILON;

export function portPoint({ center, box }: Footprint, [side, offset]: Port): Point {
  switch (side) {
    case "N":
      return { x: center.x + offset, z: center.z - box.halfD };
    case "S":
      return { x: center.x + offset, z: center.z + box.halfD };
    case "E":
      return { x: center.x + box.halfW, z: center.z + offset };
    case "W":
      return { x: center.x - box.halfW, z: center.z + offset };
  }
}

/** The ground-plane polyline of a route: exit port, each via step, then the entry port. */
export function planRoute(spec: RouteSpec, from: Footprint, to: Footprint): Point[] {
  const points: Point[] = [portPoint(from, spec.exit)];
  for (const [axis, value] of spec.via) {
    const last = points[points.length - 1]!;
    points.push(axis === "x" ? { x: value, z: last.z } : { x: last.x, z: value });
  }

  const end = portPoint(to, spec.enter);
  const last = points[points.length - 1]!;
  const entersVertically = spec.enter[0] === "N" || spec.enter[0] === "S";
  if (entersVertically && Math.abs(last.x - end.x) > EPSILON) points.push({ x: end.x, z: last.z });
  if (!entersVertically && Math.abs(last.z - end.z) > EPSILON) points.push({ x: last.x, z: end.z });
  points.push(end);

  return points.filter((point, index) => index === 0 || !same(point, points[index - 1]!));
}

/**
 * True when an axis-aligned segment passes through the box interior. Running along an edge or
 * touching a corner is allowed, because that is exactly how a route meets its own node.
 */
export function segmentCrossesBox(a: Point, b: Point, { center, box }: Footprint): boolean {
  const left = center.x - box.halfW + EPSILON;
  const right = center.x + box.halfW - EPSILON;
  const top = center.z - box.halfD + EPSILON;
  const bottom = center.z + box.halfD - EPSILON;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minZ = Math.min(a.z, b.z);
  const maxZ = Math.max(a.z, b.z);
  return maxX > left && minX < right && maxZ > top && minZ < bottom;
}

const toward = (from: Point, to: Point, distance: number): Point => {
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  return {
    x: from.x + ((to.x - from.x) / length) * distance,
    z: from.z + ((to.z - from.z) / length) * distance,
  };
};

/**
 * Straight runs joined by quadratic arcs at every interior corner. A corner never eats more than
 * half of either neighbouring run, so short steps stay straight instead of overshooting.
 */
export function filletSegments(points: readonly Point[], radius: number): Segment[] {
  const segments: Segment[] = [];
  let cursor = points[0]!;

  for (let i = 1; i < points.length - 1; i += 1) {
    const corner = points[i]!;
    const before = points[i - 1]!;
    const after = points[i + 1]!;
    const reach = Math.min(
      radius,
      Math.hypot(before.x - corner.x, before.z - corner.z) / 2,
      Math.hypot(after.x - corner.x, after.z - corner.z) / 2,
    );
    const arcStart = toward(corner, before, reach);
    const arcEnd = toward(corner, after, reach);
    if (!same(cursor, arcStart)) segments.push({ kind: "line", from: cursor, to: arcStart });
    segments.push({ kind: "quad", from: arcStart, control: corner, to: arcEnd });
    cursor = arcEnd;
  }

  const last = points[points.length - 1]!;
  if (!same(cursor, last)) segments.push({ kind: "line", from: cursor, to: last });
  return segments;
}
