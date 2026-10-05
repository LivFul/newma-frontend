// Deterministic contour linework for the survey-sheet hero. Pure; the terrain renders as static SVG
// on the server, so none of this ships to the client.

export type Hill = Readonly<{
  cx: number;
  cy: number;
  /** Radius of the innermost ring on x; y is scaled by `squash`. */
  r0: number;
  step: number;
  rings: number;
  squash: number;
  /** Rotation of the ring axes, radians. */
  tilt: number;
  /** Phase seed for the ring wobble, so neighbouring hills do not look stamped. */
  seed: number;
}>;

export type Contour = Readonly<{ d: string; index: boolean }>;

// 28 points keep the wobble (harmonics up to 5) smooth through the spline at half the markup of 56.
const POINTS_PER_RING = 28;
const INDEX_EVERY = 5;

const round = (n: number): number => Math.round(n * 10) / 10;

// Organic wobble: a few low harmonics, drifting with the ring so the terrain loosens outward.
function wobble(theta: number, ring: number, seed: number): number {
  return (
    0.085 * Math.sin(2 * theta + seed) +
    0.05 * Math.sin(3 * theta + seed * 1.7 + ring * 0.21) +
    0.03 * Math.sin(5 * theta + seed * 2.3 - ring * 0.13)
  );
}

function ringPoints(hill: Hill, ring: number): ReadonlyArray<readonly [number, number]> {
  const r = hill.r0 + ring * hill.step;
  const cos = Math.cos(hill.tilt);
  const sin = Math.sin(hill.tilt);
  return Array.from({ length: POINTS_PER_RING }, (_, i) => {
    const theta = (i / POINTS_PER_RING) * Math.PI * 2;
    const k = 1 + wobble(theta, ring, hill.seed);
    const x = Math.cos(theta) * r * k;
    const y = Math.sin(theta) * r * k * hill.squash;
    return [hill.cx + x * cos - y * sin, hill.cy + x * sin + y * cos] as const;
  });
}

// Closed Catmull-Rom spline through the points, written as cubic Beziers.
function smoothClosedPath(points: ReadonlyArray<readonly [number, number]>): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  const segments = points.map((_, i) => {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    return `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(x2)} ${round(y2)}`;
  });
  const [sx, sy] = points[0];
  return `M${round(sx)} ${round(sy)}${segments.join("")}Z`;
}

/** Every ring of every hill, innermost first; each fifth ring is an index contour. */
export function contours(hills: readonly Hill[]): readonly Contour[] {
  return hills.flatMap((hill) =>
    Array.from({ length: hill.rings }, (_, ring) => ({
      d: smoothClosedPath(ringPoints(hill, ring)),
      index: (ring + 1) % INDEX_EVERY === 0,
    })),
  );
}
