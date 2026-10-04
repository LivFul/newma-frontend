import { SVG_SCALE, SVG_TEXT, svgNodeSize, svgNoteSize, wrapLabel } from "./footprints";
import { filletSegments, planRoute, type Footprint, type Point, type Segment } from "./geometry";
import {
  WORKFLOW_EDGES,
  WORKFLOW_NODES,
  WORKFLOW_NOTES,
  type EdgeTone,
  type LaneId,
  type NodeKind,
} from "./graph";

// Turns the workflow graph into pixel-space shapes for the static SVG. It is pure (no React, no
// DOM) so the geometry can be tested on its own; the component only maps shapes to elements.

const MARGIN_PX = 18;
const CORNER_RADIUS_PX = 10;

export interface SvgCopy {
  readonly nodeLabels: Readonly<Record<string, string>>;
  readonly edgeLabels: Readonly<Record<string, string>>;
  readonly noteText: Readonly<Record<string, string>>;
}

export interface SvgNodeShape {
  readonly id: string;
  readonly kind: NodeKind;
  readonly lane: LaneId;
  readonly cx: number;
  readonly cy: number;
  readonly width: number;
  readonly height: number;
  readonly lines: readonly string[];
  /** SVG `points` for the hexagonal hold node. */
  readonly hexagon?: string;
}

/** An axis-aligned box in view-box pixels; `x` and `y` are its top-left corner. */
export interface SvgRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A transition's condition drawn on or beside its route, on a halo so it reads over lines. */
export interface SvgEdgeTag extends SvgRect {
  readonly lines: readonly string[];
}

export interface SvgEdgeShape {
  readonly id: string;
  readonly tone: EdgeTone;
  readonly d: string;
  readonly label?: string;
  /** Where the label is drawn; absent only when no free spot exists (the tooltip still carries it). */
  readonly tag?: SvgEdgeTag;
}

export interface SvgNoteShape {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly lines: readonly string[];
  readonly leader: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
}

export interface SvgLayout {
  readonly width: number;
  readonly height: number;
  /** CSS `aspect-ratio` value matching the view box, so the box can be reserved before it paints. */
  readonly aspect: string;
  readonly nodes: readonly SvgNodeShape[];
  readonly edges: readonly SvgEdgeShape[];
  readonly notes: readonly SvgNoteShape[];
}

const round = (value: number): number => Math.round(value * 100) / 100;

const longestLine = (lines: readonly string[]): number =>
  lines.reduce((max, line) => Math.max(max, line.length), 0);

const toPx = (point: Point): Point => ({ x: point.x * SVG_SCALE.x, z: point.z * SVG_SCALE.z });

function pathData(segments: readonly Segment[], shift: Point): string {
  const at = (p: Point) => `${round(p.x - shift.x)} ${round(p.z - shift.z)}`;
  // A route that collapsed to a single point has no segments, so there is nothing to draw.
  if (segments.length === 0) return "";
  const parts = [`M${at(segments[0]!.from)}`];
  for (const segment of segments) {
    parts.push(
      segment.kind === "line" ? `L${at(segment.to)}` : `Q${at(segment.control)} ${at(segment.to)}`,
    );
  }
  return parts.join(" ");
}

/** The point where a ray from the centre of a rectangle toward a target leaves the rectangle. */
function rectEdgePoint(c: Point, halfW: number, halfH: number, target: Point): Point {
  const dx = target.x - c.x;
  const dz = target.z - c.z;
  // Two rectangles centred on the same point have no direction between them; stay at the centre
  // instead of producing NaN.
  if (dx === 0 && dz === 0) return c;
  const scale = Math.min(
    dx === 0 ? Infinity : halfW / Math.abs(dx),
    dz === 0 ? Infinity : halfH / Math.abs(dz),
  );
  return { x: c.x + dx * scale, z: c.z + dz * scale };
}

function hexagonPoints(cx: number, cy: number, width: number, height: number): string {
  const hw = width / 2;
  const hh = height / 2;
  return [
    [cx - hw, cy],
    [cx - hw / 2, cy - hh],
    [cx + hw / 2, cy - hh],
    [cx + hw, cy],
    [cx + hw / 2, cy + hh],
    [cx - hw / 2, cy + hh],
  ]
    .map(([x, y]) => `${round(x!)},${round(y!)}`)
    .join(" ");
}

// ---- Edge label placement -----------------------------------------------------------------------
// Each condition is placed greedily, most constrained transition first. A candidate sits on one
// straight run of its own route (centred on the line, or just beside it) and may not touch a node, a
// note, another label or the drawing's edge; among the rest, the one hiding the fewest other lines
// wins. Everything is in unshifted pixels, like the routes.

/** Character limits tried for each label, narrowest first. */
const TAG_WRAPS = [16, 20, 26, 34] as const;
/** Positions along a run, as fractions of its length, in order of preference. */
const TAG_STOPS = [0.5, 0.35, 0.65, 0.2, 0.8] as const;
const TAG_PAD_X_PX = 4;
const TAG_PAD_Y_PX = 2;
/** Room left free at both ends of the run, for its rounded corner or arrowhead. */
const TAG_RUN_CLEAR_PX = 12;
/** Gap between a run and a label placed beside it. */
const TAG_BESIDE_GAP_PX = 4;
/** Clearance kept around nodes (their arrowheads included) and notes. */
const TAG_SHAPE_CLEAR_PX = 6;
/** Clearance kept between two labels. */
const TAG_TAG_CLEAR_PX = 3;

interface TagCandidate {
  readonly box: SvgRect;
  readonly lines: readonly string[];
  readonly cost: number;
}

const grown = (r: SvgRect, by: number): SvgRect => ({
  x: r.x - by,
  y: r.y - by,
  width: r.width + by * 2,
  height: r.height + by * 2,
});

const overlaps = (a: SvgRect, b: SvgRect): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const contains = (outer: SvgRect, inner: SvgRect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

const centred = (cx: number, cy: number, width: number, height: number): SvgRect => ({
  x: cx - width / 2,
  y: cy - height / 2,
  width,
  height,
});

/** True when an axis-aligned segment passes through the box interior. */
const runCrosses = (a: Point, b: Point, r: SvgRect): boolean =>
  Math.max(a.x, b.x) > r.x &&
  Math.min(a.x, b.x) < r.x + r.width &&
  Math.max(a.z, b.z) > r.y &&
  Math.min(a.z, b.z) < r.y + r.height;

const runsOf = (points: readonly Point[]): (readonly [Point, Point])[] =>
  points.slice(1).map((to, i) => [points[i]!, to] as const);

/** Every on-line and beside-the-line spot for one label, before other labels are considered. */
function tagCandidates(
  text: string,
  own: readonly Point[],
  allRuns: readonly (readonly [Point, Point])[],
  blocked: readonly SvgRect[],
  bounds: SvgRect,
): TagCandidate[] {
  const candidates: TagCandidate[] = [];
  TAG_WRAPS.forEach((wrap, wrapIndex) => {
    const lines = wrapLabel(text, wrap);
    const width = longestLine(lines) * SVG_TEXT.charPx + TAG_PAD_X_PX * 2;
    const height = lines.length * SVG_TEXT.linePx + TAG_PAD_Y_PX * 2;
    for (const [a, b] of runsOf(own)) {
      const horizontal = Math.abs(a.z - b.z) < Math.abs(a.x - b.x);
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      const along = horizontal ? width : height;
      const across = (horizontal ? height : width) / 2 + TAG_BESIDE_GAP_PX;
      TAG_STOPS.forEach((stop, stopIndex) => {
        const reach = Math.min(stop, 1 - stop) * length;
        if (reach < along / 2 + TAG_RUN_CLEAR_PX) return;
        const px = a.x + (b.x - a.x) * stop;
        const pz = a.z + (b.z - a.z) * stop;
        // Centred on the line first, then beside it on either side.
        ([0, -1, 1] as const).forEach((side) => {
          const box = horizontal
            ? centred(px, pz + side * across, width, height)
            : centred(px + side * across, pz, width, height);
          if (!contains(bounds, box) || blocked.some((r) => overlaps(r, box))) return;
          const hidden = allRuns.filter(([p, q]) => runCrosses(p, q, box)).length;
          const cost =
            (hidden - (side === 0 ? 1 : 0)) * 100 +
            (side === 0 ? 0 : 2) +
            stopIndex +
            wrapIndex * 1.5 -
            Math.min(length, 400) / 200;
          candidates.push({ box, lines, cost });
        });
      });
    }
  });
  return candidates.sort((p, q) => p.cost - q.cost);
}

function placeTags(
  labelled: readonly { readonly id: string; readonly text: string; readonly points: Point[] }[],
  allRuns: readonly (readonly [Point, Point])[],
  blocked: readonly SvgRect[],
  bounds: SvgRect,
): Map<string, TagCandidate> {
  const options = labelled
    .map((entry) => ({
      id: entry.id,
      candidates: tagCandidates(entry.text, entry.points, allRuns, blocked, bounds),
    }))
    .sort((p, q) => p.candidates.length - q.candidates.length);
  const placed = new Map<string, TagCandidate>();
  for (const { id, candidates } of options) {
    const taken = [...placed.values()].map((tag) => grown(tag.box, TAG_TAG_CLEAR_PX));
    const pick = candidates.find((candidate) => !taken.some((r) => overlaps(r, candidate.box)));
    if (pick) placed.set(id, pick);
  }
  return placed;
}

export function buildSvgLayout(copy: SvgCopy): SvgLayout {
  const sizes = new Map(
    WORKFLOW_NODES.map((node) => [node.id, svgNodeSize(node.kind, copy.nodeLabels[node.id] ?? "")]),
  );
  const footprints = new Map<string, Footprint>(
    WORKFLOW_NODES.map((node) => [
      node.id,
      { center: { x: node.x, z: node.z }, box: sizes.get(node.id)!.box },
    ]),
  );

  const routes = WORKFLOW_EDGES.map((edge) => ({
    edge,
    points: planRoute(edge.route, footprints.get(edge.from)!, footprints.get(edge.to)!).map(toPx),
  }));
  const noteSizes = WORKFLOW_NOTES.map((note) => svgNoteSize(copy.noteText[note.id] ?? ""));

  // Bounds over every shape, in unshifted pixels, so the view box hugs the drawing.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  // Shapes a label must keep clear of: every node with its beside-text, and every note.
  const blocked: SvgRect[] = [];
  for (const node of WORKFLOW_NODES) {
    const size = sizes.get(node.id)!;
    const c = toPx({ x: node.x, z: node.z });
    const beside =
      node.kind === "start" || node.kind === "end"
        ? SVG_TEXT.besideGapPx + (copy.nodeLabels[node.id]?.length ?? 0) * SVG_TEXT.charPx
        : 0;
    grow(c.x - size.widthPx / 2, c.z - size.heightPx / 2);
    grow(c.x + size.widthPx / 2 + beside, c.z + size.heightPx / 2);
    blocked.push(
      grown(
        {
          x: c.x - size.widthPx / 2,
          y: c.z - size.heightPx / 2,
          width: size.widthPx + beside,
          height: size.heightPx,
        },
        TAG_SHAPE_CLEAR_PX,
      ),
    );
  }
  WORKFLOW_NOTES.forEach((note, i) => {
    const c = toPx({ x: note.x, z: note.z });
    const size = noteSizes[i]!;
    grow(c.x - size.widthPx / 2, c.z - size.heightPx / 2);
    grow(c.x + size.widthPx / 2, c.z + size.heightPx / 2);
    blocked.push(grown(centred(c.x, c.z, size.widthPx, size.heightPx), TAG_SHAPE_CLEAR_PX));
  });
  for (const { points } of routes) for (const p of points) grow(p.x, p.z);

  // Labels fit inside the drawing as it stands, so they never widen the view box.
  const tags = placeTags(
    routes.flatMap(({ edge, points }) => {
      const text = copy.edgeLabels[edge.id];
      return text ? [{ id: edge.id, text, points }] : [];
    }),
    routes.flatMap(({ points }) => runsOf(points)),
    blocked,
    { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  );

  const shift: Point = { x: minX - MARGIN_PX, z: minY - MARGIN_PX };
  const width = Math.ceil(maxX - minX + MARGIN_PX * 2);
  const height = Math.ceil(maxY - minY + MARGIN_PX * 2);

  const nodes: SvgNodeShape[] = WORKFLOW_NODES.map((node) => {
    const size = sizes.get(node.id)!;
    const c = toPx({ x: node.x, z: node.z });
    const cx = round(c.x - shift.x);
    const cy = round(c.z - shift.z);
    return {
      id: node.id,
      kind: node.kind,
      lane: node.lane,
      cx,
      cy,
      width: size.widthPx,
      height: size.heightPx,
      lines: size.lines,
      hexagon:
        node.kind === "hold" ? hexagonPoints(cx, cy, size.widthPx, size.heightPx) : undefined,
    };
  });

  const edges: SvgEdgeShape[] = routes.map(({ edge, points }) => {
    const tag = tags.get(edge.id);
    return {
      id: edge.id,
      tone: edge.tone,
      d: pathData(filletSegments(points, CORNER_RADIUS_PX), shift),
      label: copy.edgeLabels[edge.id],
      tag: tag && {
        x: round(tag.box.x - shift.x),
        y: round(tag.box.y - shift.z),
        width: round(tag.box.width),
        height: round(tag.box.height),
        lines: tag.lines,
      },
    };
  });

  const notes: SvgNoteShape[] = WORKFLOW_NOTES.map((note, i) => {
    const size = noteSizes[i]!;
    const c = toPx({ x: note.x, z: note.z });
    const anchor = nodes.find((n) => n.id === note.attachTo)!;
    const center = { x: c.x - shift.x, z: c.z - shift.z };
    const target = { x: anchor.cx, z: anchor.cy };
    const from = rectEdgePoint(center, size.widthPx / 2, size.heightPx / 2, target);
    const to = rectEdgePoint(target, anchor.width / 2, anchor.height / 2, center);
    return {
      id: note.id,
      x: round(center.x - size.widthPx / 2),
      y: round(center.z - size.heightPx / 2),
      width: size.widthPx,
      height: size.heightPx,
      lines: size.lines,
      leader: { x1: round(from.x), y1: round(from.z), x2: round(to.x), y2: round(to.z) },
    };
  });

  return { width, height, aspect: `${width} / ${height}`, nodes, edges, notes };
}
