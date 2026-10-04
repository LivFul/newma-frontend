import type { Box } from "./geometry";
import type { NodeKind } from "./graph";

// How big each node is drawn. The static SVG and the 3D scene share node positions and routes but
// not sizes: the SVG puts its text inside the node, while the 3D scene floats the label above a
// smaller block. Every size here is a half-extent in world units, so routes can start and end on the
// node edge in either view.

/** Greedy word wrap on character count; a word longer than the limit stays whole. */
export function wrapLabel(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const longest = (lines: readonly string[]): number =>
  lines.reduce((max, line) => Math.max(max, line.length), 0);

// ---- Static SVG ---------------------------------------------------------------------------------

/** Pixels per world unit. Rows sit closer together than columns, so z is stretched to fit text. */
export const SVG_SCALE = Object.freeze({ x: 24, z: 34 });

const SVG_FONT_PX = 11;
const SVG_CHAR_PX = 6.3;
const SVG_LINE_PX = 13.5;
const SVG_PAD_X_PX = 7;
const SVG_PAD_Y_PX = 5;
const SVG_MIN_WIDTH_PX = 56;
const SVG_WRAP_CHARS = 14;
const SVG_NOTE_WRAP_CHARS = 20;
const SVG_START_RADIUS_PX = 12;
const SVG_END_RADIUS_PX = 15;
const SVG_HOLD_PX = Object.freeze({ width: 104, height: 48 });

/** Start and end have no room for text inside, so their label sits this far right of the circle. */
const SVG_BESIDE_GAP_PX = 6;

/** Text metrics shared by the footprint sizes, the view box and the drawing itself. */
export const SVG_TEXT = Object.freeze({
  fontPx: SVG_FONT_PX,
  linePx: SVG_LINE_PX,
  charPx: SVG_CHAR_PX,
  padX: SVG_PAD_X_PX,
  besideGapPx: SVG_BESIDE_GAP_PX,
  wrapChars: SVG_WRAP_CHARS,
  noteWrapChars: SVG_NOTE_WRAP_CHARS,
});

export interface SvgSize {
  /** Half-extents in world units, for route planning. */
  readonly box: Box;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly lines: readonly string[];
}

const svgSize = (widthPx: number, heightPx: number, lines: readonly string[]): SvgSize =>
  Object.freeze({
    box: Object.freeze({
      halfW: widthPx / 2 / SVG_SCALE.x,
      halfD: heightPx / 2 / SVG_SCALE.z,
    }),
    widthPx,
    heightPx,
    lines,
  });

export function svgNodeSize(kind: NodeKind, label: string): SvgSize {
  if (kind === "start") {
    return svgSize(SVG_START_RADIUS_PX * 2, SVG_START_RADIUS_PX * 2, [label]);
  }
  if (kind === "end") return svgSize(SVG_END_RADIUS_PX * 2, SVG_END_RADIUS_PX * 2, [label]);
  const lines = wrapLabel(label, SVG_WRAP_CHARS);
  if (kind === "hold") return svgSize(SVG_HOLD_PX.width, SVG_HOLD_PX.height, lines);
  return svgSize(
    Math.max(SVG_MIN_WIDTH_PX, longest(lines) * SVG_CHAR_PX + SVG_PAD_X_PX * 2),
    lines.length * SVG_LINE_PX + SVG_PAD_Y_PX * 2,
    lines,
  );
}

export function svgNoteSize(text: string): SvgSize {
  const lines = wrapLabel(text, SVG_NOTE_WRAP_CHARS);
  return svgSize(
    longest(lines) * SVG_CHAR_PX + SVG_PAD_X_PX * 2,
    lines.length * SVG_LINE_PX + SVG_PAD_Y_PX * 2,
    lines,
  );
}

// ---- 3D scene -----------------------------------------------------------------------------------

const BEVEL = 0.07;
const BLOCK_DEPTH = 1;
const BLOCK_MIN_WIDTH = 2.4;
const BLOCK_MAX_WIDTH = 3.2;
const BLOCK_CHAR_WIDTH = 0.14;
const BLOCK_WIDTH_PAD = 0.5;
const HOLD_RADIUS = 1.5;
const START_RADIUS = 0.4;
const END_RADIUS = 0.5;
export const NODE_3D_WRAP_CHARS = 18;
const NOTE_3D_HALF = Object.freeze({ halfW: 2.1, halfD: 0.7 });

export function node3dBox(kind: NodeKind, label: string): Box {
  if (kind === "start") return { halfW: START_RADIUS, halfD: START_RADIUS };
  if (kind === "end") return { halfW: END_RADIUS, halfD: END_RADIUS };
  // A hexagonal prism: vertices point along x and the flat sides face north and south.
  if (kind === "hold") return { halfW: HOLD_RADIUS, halfD: HOLD_RADIUS * Math.cos(Math.PI / 6) };
  const width = Math.min(
    BLOCK_MAX_WIDTH,
    Math.max(
      BLOCK_MIN_WIDTH,
      longest(wrapLabel(label, NODE_3D_WRAP_CHARS)) * BLOCK_CHAR_WIDTH + BLOCK_WIDTH_PAD,
    ),
  );
  return { halfW: width / 2 + BEVEL, halfD: BLOCK_DEPTH / 2 + BEVEL };
}

export function note3dBox(): Box {
  return NOTE_3D_HALF;
}
