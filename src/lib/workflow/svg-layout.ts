import { SVG_SCALE, SVG_TEXT, svgNodeSize, svgNoteSize } from "./footprints";
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

export interface SvgEdgeShape {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly tone: EdgeTone;
  readonly d: string;
  readonly label?: string;
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
  for (const node of WORKFLOW_NODES) {
    const size = sizes.get(node.id)!;
    const c = toPx({ x: node.x, z: node.z });
    const beside =
      node.kind === "start" || node.kind === "end"
        ? SVG_TEXT.besideGapPx + (copy.nodeLabels[node.id]?.length ?? 0) * SVG_TEXT.charPx
        : 0;
    grow(c.x - size.widthPx / 2, c.z - size.heightPx / 2);
    grow(c.x + size.widthPx / 2 + beside, c.z + size.heightPx / 2);
  }
  WORKFLOW_NOTES.forEach((note, i) => {
    const c = toPx({ x: note.x, z: note.z });
    const size = noteSizes[i]!;
    grow(c.x - size.widthPx / 2, c.z - size.heightPx / 2);
    grow(c.x + size.widthPx / 2, c.z + size.heightPx / 2);
  });
  for (const { points } of routes) for (const p of points) grow(p.x, p.z);

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

  const edges: SvgEdgeShape[] = routes.map(({ edge, points }) => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    tone: edge.tone,
    d: pathData(filletSegments(points, CORNER_RADIUS_PX), shift),
    label: copy.edgeLabels[edge.id],
  }));

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
