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
export type PartGeometry = Readonly<{
  slug: EcosystemSlug;
  assembled: Point;
  exploded: Point;
  tone: ToneToken;
  glyph: GlyphKey;
  dashed: boolean;
  label: Readonly<{ x: number; y: number; anchor: LabelAnchor }>;
  center: boolean;
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

export const VIEWBOX = Object.freeze({ width: 500, height: 560 });
export const PLATE = Object.freeze({ halfWidth: 28, halfHeight: 28, thickness: 0 });
export const NODE_RADIUS = 24;
export const HUB_RADIUS = NODE_RADIUS + 8;
export const LABEL_FONT = Object.freeze({ title: 20, descriptor: 20 });
export const LABEL_LINE = 22;
export const LABEL_BOX = Object.freeze({
  offsetX: 0,
  width: 100,
  top: -18,
  bottom: 34,
  titleBaseline: 0,
  descriptorBaseline: 20,
});
export const LEADER = Object.freeze({ fromX: 0, toX: 0 });
export const RAIL_X = 18;
export const CENTER = Object.freeze({ x: 250, y: 268 });
/** Tilted 3D ring: a circle viewed at ~44°. Inner = assembled, outer = exploded. */
export const ELLIPSE = Object.freeze({
  assembled: Object.freeze({ rx: 108, ry: 80 }),
  exploded: Object.freeze({ rx: 152, ry: 136 }),
});
export const RING = Object.freeze({
  assembled: ELLIPSE.assembled.rx,
  exploded: ELLIPSE.exploded.rx,
  inner: ELLIPSE.assembled,
  outer: ELLIPSE.exploded,
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

const ORBITERS = ECOSYSTEM_SLUGS.filter(
  (slug): slug is Exclude<EcosystemSlug, "interface"> => slug !== "interface",
);

/** Provenance stays on the near (south) rim so explode moves it down the page. */
const ORBIT_ANGLES: Readonly<Record<Exclude<EcosystemSlug, "interface">, number>> = Object.freeze({
  "agentic-compute": -90,
  "scientific-review": -40,
  "wet-lab": 42,
  "data-knowledge": 175,
  "provenance-dlt": 90,
});

export const ellipsePoint = (ring: { rx: number; ry: number }, deg: number): Point => {
  const rad = (deg * Math.PI) / 180;
  return point(
    Number((CENTER.x + ring.rx * Math.cos(rad)).toFixed(2)),
    Number((CENTER.y + ring.ry * Math.sin(rad)).toFixed(2)),
  );
};

const LABEL_OUT = NODE_RADIUS + 28;

const LABELS: Readonly<Record<EcosystemSlug, PartGeometry["label"]>> = {
  interface: Object.freeze({ x: HUB_RADIUS + 14, y: -10, anchor: "start" }),
  "agentic-compute": Object.freeze({ x: 0, y: -LABEL_OUT, anchor: "middle" }),
  "scientific-review": Object.freeze({ x: LABEL_OUT - 16, y: -18, anchor: "start" }),
  "wet-lab": Object.freeze({ x: LABEL_OUT - 16, y: -8, anchor: "start" }),
  "data-knowledge": Object.freeze({ x: 0, y: LABEL_OUT, anchor: "middle" }),
  "provenance-dlt": Object.freeze({ x: 0, y: LABEL_OUT, anchor: "middle" }),
};

export const PARTS: readonly PartGeometry[] = Object.freeze(
  ECOSYSTEM_SLUGS.map((slug) => {
    const orbitIndex = slug === "interface" ? -1 : ORBITERS.indexOf(slug);
    const deg = orbitIndex === -1 ? 0 : ORBIT_ANGLES[ORBITERS[orbitIndex]!];
    const assembled =
      orbitIndex === -1 ? point(CENTER.x, CENTER.y) : ellipsePoint(ELLIPSE.assembled, deg);
    const exploded =
      orbitIndex === -1 ? point(CENTER.x, CENTER.y) : ellipsePoint(ELLIPSE.exploded, deg);
    const depth = orbitIndex === -1 ? 0 : Number(Math.sin((deg * Math.PI) / 180).toFixed(3));
    return Object.freeze({
      slug,
      assembled,
      exploded,
      tone: TONES[slug],
      glyph: GLYPHS[slug],
      dashed: slug === "provenance-dlt",
      label: LABELS[slug],
      center: slug === "interface",
      depth,
    });
  }),
);

const part = (slug: EcosystemSlug): PartGeometry => PARTS[ECOSYSTEM_SLUGS.indexOf(slug)]!;

const edge = (from: EcosystemSlug, to: EcosystemSlug, kind: EdgeKind, dashed = false): Edge => {
  const a = part(from).exploded;
  const b = part(to).exploded;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (CENTER.x - mx) * -0.22;
  const cy = my + (CENTER.y - my) * -0.12;
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
