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

// About 480 x 560 portrait: label text stays at least 12 px rendered on a 360 px phone.
export const VIEWBOX = Object.freeze({ width: 470, height: 560 });
export const PLATE = Object.freeze({ halfWidth: 76, halfHeight: 20, thickness: 8 });
export const LABEL_FONT = Object.freeze({ title: 20, descriptor: 18 });
// Label box relative to the part origin (the plate centre); width is a conservative text estimate.
export const LABEL_BOX = Object.freeze({
  offsetX: 128,
  width: 198,
  top: -24,
  bottom: 26,
  titleBaseline: -2,
  descriptorBaseline: 20,
});
// The slab-to-label leader tick, relative to the part origin.
export const LEADER = Object.freeze({ fromX: PLATE.halfWidth + 6, toX: LABEL_BOX.offsetX - 8 });
export const RAIL_X = 16;
const ASSEMBLED_X = 116;
const ASSEMBLED_PITCH = 44;
const ASSEMBLED_CENTRE_Y = 276;
const EXPLODED_TOP = 64;
const EXPLODED_PITCH = 88;
const EXPLODED_DRIFT = 10;
const EDGE_GAP = 4;

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
      assembled: point(
        ASSEMBLED_X,
        ASSEMBLED_CENTRE_Y + (index - (ECOSYSTEM_SLUGS.length - 1) / 2) * ASSEMBLED_PITCH,
      ),
      // Alternate sides drift outward a little when the stack explodes.
      exploded: point(
        ASSEMBLED_X + (index % 2 === 0 ? -EXPLODED_DRIFT : EXPLODED_DRIFT),
        EXPLODED_TOP + index * EXPLODED_PITCH,
      ),
      tone: TONES[slug],
      glyph: GLYPHS[slug],
      dashed: false,
    }),
  ),
);

const part = (slug: EcosystemSlug): PartGeometry => PARTS[ECOSYSTEM_SLUGS.indexOf(slug)]!;
const top = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x, p.y - PLATE.halfHeight - EDGE_GAP);
};
const bottom = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x, p.y + PLATE.halfHeight + PLATE.thickness + EDGE_GAP);
};
const left = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x - PLATE.halfWidth - EDGE_GAP, p.y);
};
const right = (slug: EcosystemSlug): Point => {
  const p = part(slug).exploded;
  return point(p.x + PLATE.halfWidth + EDGE_GAP, p.y);
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
