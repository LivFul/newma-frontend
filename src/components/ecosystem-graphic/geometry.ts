// Single geometry source for the hero: the static SVG, its interactive Motion twin, the tests and
// the CSS baseline all read these numbers, so the swap between layers cannot move anything.
// Units are SVG user units. Pure and deeply frozen.
import { ECOSYSTEM_SLUGS, type EcosystemSlug } from "@/content/ecosystem/registry";

export type Point = Readonly<{ x: number; y: number }>;
export type ToneToken =
  | "--color-accent"
  | "--color-eco-compute"
  | "--color-warning"
  | "--color-success"
  | "--color-border-strong"
  | "--color-eco-optional";
export const GLYPH_KEYS = [
  "frame-midrib",
  "phyllotaxis",
  "gate-ring",
  "teardrop-circle",
  "stacked-vesica",
  "linked-rings",
] as const;
export type GlyphKey = (typeof GLYPH_KEYS)[number];
export type PartGeometry = Readonly<{
  slug: EcosystemSlug;
  assembled: Point;
  exploded: Point;
  tone: ToneToken;
  glyph: GlyphKey;
  dashed: boolean;
}>;
export type EdgeKind = "flow" | "rail";
export type Edge = Readonly<{
  id: string;
  from: EcosystemSlug;
  to: EcosystemSlug;
  kind: EdgeKind;
  dashed: boolean;
  d: string;
}>;

// About 470 x 420 portrait: label text stays at least 12 px rendered on a 360 px phone.
export const VIEWBOX = Object.freeze({ width: 470, height: 420 });
// The isometric plate drawn on the component pages (component-plate.tsx); the hero draws pills.
export const PLATE = Object.freeze({ halfWidth: 76, halfHeight: 20, thickness: 8 });
// The hero's capsule bar, centred on the part origin.
export const PILL = Object.freeze({ halfWidth: 33, halfHeight: 5.5 });
export const LABEL_FONT = Object.freeze({ title: 20, descriptor: 18 });
// Label box relative to the part origin (the pill centre); width is a conservative text estimate.
// Titles sit level with the pill; the descriptor hangs below and shows only when the stack explodes.
export const LABEL_BOX = Object.freeze({
  offsetX: PILL.halfWidth + 32,
  width: 220,
  top: -24,
  bottom: 36,
  titleBaseline: 7,
  descriptorBaseline: 29,
});
// The bracket spine the row ticks hang from (static; it does not move with the parts).
export const SPINE = Object.freeze({ x: 56, radius: 14 });
export const RAIL_X = 16;
const ASSEMBLED_X = 135;
// All six rows rest at one even pitch, centred on the exploded stack, so exploding opens the stack
// evenly up and down and every row, Interface included, collapses back the same way.
const ASSEMBLED_TOP = 74;
const ASSEMBLED_PITCH = 50;
const EXPLODED_TOP = 24;
// Wider than the resting pitch, and room for each row's descriptor.
const EXPLODED_PITCH = 70;
const EDGE_GAP = 6;

const TONES: Readonly<Record<EcosystemSlug, ToneToken>> = {
  interface: "--color-accent",
  "agentic-compute": "--color-eco-compute",
  "scientific-review": "--color-warning",
  "wet-lab": "--color-success",
  "data-knowledge": "--color-border-strong",
  "provenance-dlt": "--color-eco-optional",
};
const GLYPHS: Readonly<Record<EcosystemSlug, GlyphKey>> = {
  interface: "frame-midrib",
  "agentic-compute": "phyllotaxis",
  "scientific-review": "gate-ring",
  "wet-lab": "teardrop-circle",
  "data-knowledge": "stacked-vesica",
  "provenance-dlt": "linked-rings",
};

const point = (x: number, y: number): Point => Object.freeze({ x, y });

export const PARTS: readonly PartGeometry[] = Object.freeze(
  ECOSYSTEM_SLUGS.map((slug, index) =>
    Object.freeze({
      slug,
      assembled: point(ASSEMBLED_X, ASSEMBLED_TOP + index * ASSEMBLED_PITCH),
      // The stack opens straight down one column, so the flow arrows between rows stay vertical.
      exploded: point(ASSEMBLED_X, EXPLODED_TOP + index * EXPLODED_PITCH),
      tone: TONES[slug],
      glyph: GLYPHS[slug],
      dashed: false,
    }),
  ),
);

const part = (slug: EcosystemSlug): PartGeometry => PARTS[ECOSYSTEM_SLUGS.indexOf(slug)]!;
const top = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x, p.y - PILL.halfHeight - EDGE_GAP);
};
const bottom = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x, p.y + PILL.halfHeight + EDGE_GAP);
};
const left = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x - PILL.halfWidth - EDGE_GAP, p.y);
};
const right = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x + PILL.halfWidth + EDGE_GAP, p.y);
};
const edge = (
  from: EcosystemSlug,
  to: EcosystemSlug,
  kind: EdgeKind,
  d: string,
  dashed = false,
): Edge => Object.freeze({ id: `${from}>${to}`, from, to, kind, dashed, d });

const line = (a: Point, b: Point): string => `M${a.x} ${a.y}L${b.x} ${b.y}`;
// Agentic Compute reaches Wet Lab through the adapter, so the arc bows round the plate between them.
const BOW = 24;
const bow = (a: Point, b: Point): string =>
  `M${a.x} ${a.y}C${a.x + BOW} ${a.y} ${b.x + BOW} ${b.y} ${b.x} ${b.y}`;
const railPath = (slug: EcosystemSlug): string => {
  const from = left(slug);
  const to = left("data-knowledge");
  return `M${from.x} ${from.y}H${RAIL_X}V${to.y}H${to.x}`;
};

export const EDGES: readonly Edge[] = Object.freeze([
  edge("interface", "agentic-compute", "flow", line(bottom("interface"), top("agentic-compute"))),
  edge(
    "agentic-compute",
    "scientific-review",
    "flow",
    line(bottom("agentic-compute"), top("scientific-review")),
  ),
  edge("agentic-compute", "wet-lab", "flow", bow(right("agentic-compute"), right("wet-lab"))),
  edge("wet-lab", "scientific-review", "flow", line(top("wet-lab"), bottom("scientific-review"))),
  // Authoritative records: every plate reads and writes through Data & Knowledge (left-hand rail).
  edge("interface", "data-knowledge", "rail", railPath("interface")),
  edge("agentic-compute", "data-knowledge", "rail", railPath("agentic-compute")),
  edge("scientific-review", "data-knowledge", "rail", railPath("scientific-review")),
  edge("wet-lab", "data-knowledge", "rail", railPath("wet-lab")),
  edge("provenance-dlt", "data-knowledge", "rail", railPath("provenance-dlt")),
  edge(
    "data-knowledge",
    "provenance-dlt",
    "flow",
    line(bottom("data-knowledge"), top("provenance-dlt")),
  ),
]);
