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

export const VIEWBOX = Object.freeze({ width: 400, height: 500 });
export const PLATE = Object.freeze({ halfWidth: 28, halfHeight: 28, thickness: 0 });
export const NODE_RADIUS = 28;
export const LABEL_FONT = Object.freeze({ title: 18, descriptor: 16 });
export const LABEL_BOX = Object.freeze({
  offsetX: 0,
  width: 100,
  top: -18,
  bottom: 34,
  titleBaseline: 0,
  descriptorBaseline: 16,
});
export const LEADER = Object.freeze({ fromX: 0, toX: 0 });
export const RAIL_X = 18;
export const CENTER = Object.freeze({ x: 200, y: 230 });
export const RING = Object.freeze({ assembled: 70, exploded: 112, inner: 70, outer: 112 });

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
const polar = (radius: number, deg: number): Point => {
  const rad = (deg * Math.PI) / 180;
  return point(
    Number((CENTER.x + radius * Math.cos(rad)).toFixed(2)),
    Number((CENTER.y + radius * Math.sin(rad)).toFixed(2)),
  );
};

const LABELS: Readonly<Record<EcosystemSlug, PartGeometry["label"]>> = {
  interface: Object.freeze({ x: 0, y: -46, anchor: "middle" }),
  "agentic-compute": Object.freeze({ x: 0, y: 42, anchor: "middle" }),
  "scientific-review": Object.freeze({ x: 0, y: 42, anchor: "middle" }),
  "wet-lab": Object.freeze({ x: 0, y: 42, anchor: "middle" }),
  "data-knowledge": Object.freeze({ x: 0, y: 42, anchor: "middle" }),
  "provenance-dlt": Object.freeze({ x: 0, y: 42, anchor: "middle" }),
};

const ORBIT_ANGLES = Object.freeze([-90, -30, 30, 150, 90]);

export const PARTS: readonly PartGeometry[] = Object.freeze(
  ECOSYSTEM_SLUGS.map((slug) => {
    const orbitIndex = slug === "interface" ? -1 : ORBITERS.indexOf(slug);
    const assembled =
      orbitIndex === -1
        ? point(CENTER.x, CENTER.y)
        : polar(RING.assembled, ORBIT_ANGLES[orbitIndex]!);
    const exploded =
      orbitIndex === -1
        ? point(CENTER.x, CENTER.y)
        : polar(RING.exploded, ORBIT_ANGLES[orbitIndex]!);
    return Object.freeze({
      slug,
      assembled,
      exploded,
      tone: TONES[slug],
      glyph: GLYPHS[slug],
      dashed: slug === "provenance-dlt",
      label: LABELS[slug],
      center: slug === "interface",
    });
  }),
);

const part = (slug: EcosystemSlug): PartGeometry => PARTS[ECOSYSTEM_SLUGS.indexOf(slug)]!;

const edge = (from: EcosystemSlug, to: EcosystemSlug, kind: EdgeKind, dashed = false): Edge => {
  const a = part(from).exploded;
  const b = part(to).exploded;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (CENTER.x - mx) * -0.18;
  const cy = my + (CENTER.y - my) * -0.18;
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
