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
  /** Kept for lighting scale; the pipeline is flat so every part sits at 0. */
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
export type StageId = "input" | "core" | "validation";
export type Stage = Readonly<{
  id: StageId;
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export const VIEWBOX = Object.freeze({ width: 500, height: 520 });
export const NODE_RADIUS = 24;
export const CARD = Object.freeze({ width: 56, height: 44, radius: 10 });
export const SERVER_RADIUS = 26;
export const TWIN_RADIUS = 18;
export const TWIN_GAP = 20;
export const LABEL_FONT = Object.freeze({ title: 20, descriptor: 20 });
export const LABEL_LINE = 22;
/** Midpoint of the records server (Provenance above, Data below) inside the AI core. */
export const CENTER = Object.freeze({ x: 250, y: 300 });
export const STAGES: readonly Stage[] = Object.freeze([
  Object.freeze({ id: "input" as const, x: 8, y: 52, width: 118, height: 440 }),
  Object.freeze({ id: "core" as const, x: 140, y: 52, width: 220, height: 440 }),
  Object.freeze({ id: "validation" as const, x: 374, y: 52, width: 118, height: 440 }),
]);
export const LOOP = Object.freeze({ x: 250, y: 160, radius: 14 });
export const FLOW_GATES = Object.freeze([
  Object.freeze({ x: 132, y: 270 }),
  Object.freeze({ x: 366, y: 270 }),
]);

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
    assembled: point(68, 270),
    exploded: point(56, 270),
    depth: 0,
    shape: "twin" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 10, y: -(TWIN_GAP + TWIN_RADIUS + 36), anchor: "start" as const }),
  }),
  "agentic-compute": Object.freeze({
    assembled: point(204, 160),
    exploded: point(176, 124),
    depth: 0,
    shape: "node" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 0, y: -92, anchor: "middle" as const }),
  }),
  "scientific-review": Object.freeze({
    assembled: point(296, 160),
    exploded: point(324, 124),
    depth: 0,
    shape: "node" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 0, y: -92, anchor: "middle" as const }),
  }),
  "wet-lab": Object.freeze({
    assembled: point(434, 270),
    exploded: point(446, 338),
    depth: 0,
    shape: "node" as const,
    dashed: false,
    center: false,
    label: Object.freeze({ x: 0, y: LABEL_OUT, anchor: "middle" as const }),
  }),
  "data-knowledge": Object.freeze({
    assembled: point(CENTER.x, 338),
    exploded: point(CENTER.x, 400),
    depth: 0,
    shape: "server" as const,
    dashed: false,
    center: true,
    label: Object.freeze({ x: 0, y: SERVER_RADIUS + 14, anchor: "middle" as const }),
  }),
  "provenance-dlt": Object.freeze({
    assembled: point(CENTER.x, 262),
    exploded: point(CENTER.x, 248),
    depth: 0,
    shape: "server" as const,
    dashed: true,
    center: true,
    label: Object.freeze({ x: 0, y: SERVER_RADIUS + 14, anchor: "middle" as const }),
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
  const d =
    kind === "optional"
      ? `M${a.x} ${a.y}L${b.x} ${b.y}`
      : `M${a.x} ${a.y}Q${mx.toFixed(2)} ${my.toFixed(2)} ${b.x} ${b.y}`;
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
