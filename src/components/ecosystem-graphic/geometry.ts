// Single geometry source for the hero: static SVG, Motion twin, tests and CSS. SVG user units. Frozen.
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
export type LabelAnchor = "start" | "middle" | "end";
export type PartShape = "node" | "server" | "twin";
export type PartGeometry = Readonly<{
  slug: EcosystemSlug;
  assembled: Point;
  exploded: Point;
  tone: ToneToken;
  glyph: GlyphKey;
  dashed: boolean;
  label: Readonly<{ x: number; y: number; anchor: LabelAnchor }>;
  center: boolean;
  shape: PartShape;
  /** −1 back of the tilted ring, +1 front. Used for 3D lighting. */
  depth: number;
}>;
export type EdgeKind = "flow" | "rail" | "optional";
export type Edge = Readonly<{
  id: string;
  from: EcosystemSlug;
  to: EcosystemSlug;
  kind: EdgeKind;
  dashed: boolean;
  d: string;
}>;

export const VIEWBOX = Object.freeze({ width: 500, height: 590 });
export const NODE_RADIUS = 24;
export const SERVER_RADIUS = 26;
export const TWIN_RADIUS = 18;
export const TWIN_GAP = 20;
export const LABEL_FONT = Object.freeze({ title: 20, descriptor: 20 });
export const LABEL_LINE = 22;
/** Centre of the records server and of the work loop around it. */
export const CENTER = Object.freeze({ x: 304, y: 278 });
/** Tilted 3D ring around the records core. Inner = assembled, outer = exploded. */
export const ELLIPSE = Object.freeze({
  assembled: Object.freeze({ rx: 118, ry: 90 }),
  exploded: Object.freeze({ rx: 148, ry: 124 }),
});

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

export const ellipsePoint = (ring: { rx: number; ry: number }, deg: number): Point => {
  const rad = (deg * Math.PI) / 180;
  return point(
    Number((CENTER.x + ring.rx * Math.cos(rad)).toFixed(2)),
    Number((CENTER.y + ring.ry * Math.sin(rad)).toFixed(2)),
  );
};

const LOOP_ANGLES = Object.freeze({
  "agentic-compute": -92,
  "scientific-review": -28,
  "wet-lab": 58,
} as const);

const LABEL_OUT = NODE_RADIUS + 28;

const LAYOUT: Readonly<
  Record<
    EcosystemSlug,
    {
      assembled: Point;
      exploded: Point;
      depth: number;
      shape: PartShape;
      dashed: boolean;
      center: boolean;
      label: PartGeometry["label"];
    }
  >
> = Object.freeze({
  interface: Object.freeze({
    assembled: point(78, 278),
    exploded: point(64, 278),
    depth: 0.2,
    shape: "twin" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 0, y: -(TWIN_GAP + TWIN_RADIUS + 28), anchor: "middle" as const }),
  }),
  "agentic-compute": Object.freeze({
    assembled: ellipsePoint(ELLIPSE.assembled, LOOP_ANGLES["agentic-compute"]),
    exploded: ellipsePoint(ELLIPSE.exploded, LOOP_ANGLES["agentic-compute"]),
    depth: Number(Math.sin((LOOP_ANGLES["agentic-compute"] * Math.PI) / 180).toFixed(3)),
    shape: "node" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 0, y: -LABEL_OUT, anchor: "middle" as const }),
  }),
  "scientific-review": Object.freeze({
    assembled: ellipsePoint(ELLIPSE.assembled, LOOP_ANGLES["scientific-review"]),
    exploded: ellipsePoint(ELLIPSE.exploded, LOOP_ANGLES["scientific-review"]),
    depth: Number(Math.sin((LOOP_ANGLES["scientific-review"] * Math.PI) / 180).toFixed(3)),
    shape: "node" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 0, y: -LABEL_OUT, anchor: "middle" as const }),
  }),
  "wet-lab": Object.freeze({
    assembled: ellipsePoint(ELLIPSE.assembled, LOOP_ANGLES["wet-lab"]),
    exploded: ellipsePoint(ELLIPSE.exploded, LOOP_ANGLES["wet-lab"]),
    depth: Number(Math.sin((LOOP_ANGLES["wet-lab"] * Math.PI) / 180).toFixed(3)),
    shape: "node" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: LABEL_OUT - 16, y: -8, anchor: "start" as const }),
  }),
  "data-knowledge": Object.freeze({
    assembled: point(CENTER.x, CENTER.y + 28),
    exploded: point(CENTER.x, CENTER.y + 52),
    depth: 1,
    shape: "server" as const,
    dashed: false,
    center: true,
    label: Object.freeze({ x: 0, y: SERVER_RADIUS + 20, anchor: "middle" as const }),
  }),
  "provenance-dlt": Object.freeze({
    assembled: point(CENTER.x, CENTER.y - 28),
    exploded: point(CENTER.x, CENTER.y - 56),
    depth: 0.15,
    shape: "server" as const,
    dashed: true,
    center: true,
    label: Object.freeze({ x: -(SERVER_RADIUS + 16), y: -10, anchor: "end" as const }),
  }),
});

export const PARTS: readonly PartGeometry[] = Object.freeze(
  ECOSYSTEM_SLUGS.map((slug) => {
    const layout = LAYOUT[slug];
    return Object.freeze({
      slug,
      assembled: layout.assembled,
      exploded: layout.exploded,
      tone: TONES[slug],
      glyph: GLYPHS[slug],
      dashed: layout.dashed,
      label: layout.label,
      center: layout.center,
      shape: layout.shape,
      depth: layout.depth,
    });
  }),
);

const part = (slug: EcosystemSlug): PartGeometry => PARTS[ECOSYSTEM_SLUGS.indexOf(slug)]!;

export const hitRadius = (geometry: PartGeometry): number => {
  if (geometry.shape === "server") return SERVER_RADIUS;
  if (geometry.shape === "twin") return TWIN_GAP + TWIN_RADIUS;
  return NODE_RADIUS;
};

const edge = (from: EcosystemSlug, to: EcosystemSlug, kind: EdgeKind, dashed = false): Edge => {
  const a = part(from).exploded;
  const b = part(to).exploded;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (CENTER.x - mx) * -0.18;
  const cy = my + (CENTER.y - my) * -0.1;
  const d = `M${a.x} ${a.y}Q${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x} ${b.y}`;
  return Object.freeze({ id: `${from}>${to}`, from, to, kind, dashed, d });
};

export const EDGES: readonly Edge[] = Object.freeze([
  edge("interface", "agentic-compute", "flow"),
  edge("agentic-compute", "scientific-review", "flow"),
  edge("agentic-compute", "wet-lab", "flow"),
  edge("wet-lab", "scientific-review", "flow"),
  edge("interface", "data-knowledge", "rail"),
  edge("agentic-compute", "data-knowledge", "rail"),
  edge("scientific-review", "data-knowledge", "rail"),
  edge("wet-lab", "data-knowledge", "rail"),
  edge("data-knowledge", "provenance-dlt", "optional", true),
]);
