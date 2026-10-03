import type { ReactElement } from "react";
import { PLATE, type GlyphKey } from "./geometry";

// Abstract botanical-geometric glyphs: no plants, species, people or communities. Each is drawn in a
// +-22 unit box and projected onto the slab's top face so it reads as printed on the plate.
const BOX = 44;
const PROJECTION = [
  (PLATE.halfWidth * 2) / (2 * BOX),
  (PLATE.halfHeight * 2) / (2 * BOX),
  -(PLATE.halfWidth * 2) / (2 * BOX),
  (PLATE.halfHeight * 2) / (2 * BOX),
] as const;
export const GLYPH_MATRIX = `matrix(${PROJECTION.map((n) => n.toFixed(4)).join(" ")} 0 0)`;

const GOLDEN_ANGLE = (137.508 * Math.PI) / 180;
const SPIRAL_DOTS = Array.from({ length: 7 }, (_, i) => {
  const radius = 5.4 * Math.sqrt(i + 1);
  return {
    cx: Number((radius * Math.cos((i + 1) * GOLDEN_ANGLE)).toFixed(2)),
    cy: Number((radius * Math.sin((i + 1) * GOLDEN_ANGLE)).toFixed(2)),
  };
});
const LEAF_LENS = "M-14 0Q0 -8 14 0Q0 8 -14 0Z";

const GLYPH_SHAPES: Readonly<Record<GlyphKey, () => ReactElement>> = {
  "frame-midrib": () => (
    <g>
      <rect x={-16} y={-12} width={32} height={24} rx={6} />
      <path d="M-16 0H16" />
    </g>
  ),
  phyllotaxis: () => (
    <g>
      {SPIRAL_DOTS.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={2.3}
          fill="currentColor"
          stroke="none"
          className="eco-glyph-fill"
        />
      ))}
    </g>
  ),
  "gate-ring": () => (
    <g>
      <path d="M-5 -13A13 13 0 1 0 5 -13" />
      <path d="M-13 9L13 -9" />
    </g>
  ),
  "teardrop-circle": () => (
    <g>
      <path d="M-5 -14C3 -5 5 0 2 6A7.5 7.5 0 0 1 -12 6C-15 0 -13 -5 -5 -14Z" />
      <circle cx={12} cy={10} r={4.2} />
    </g>
  ),
  "stacked-vesica": () => (
    <g>
      <path d={LEAF_LENS} transform="translate(0 -10)" />
      <path d={LEAF_LENS} />
      <path d={LEAF_LENS} transform="translate(0 10)" />
    </g>
  ),
  "linked-rings": () => (
    <g>
      <circle cx={-6.5} cy={0} r={10} />
      <circle cx={6.5} cy={0} r={10} strokeDasharray="3.5 3" />
    </g>
  ),
};

/** The bare shapes as plain elements (no component wrapper), for the Open Graph renderer. */
export function glyphShapes(glyph: GlyphKey): ReactElement {
  return GLYPH_SHAPES[glyph]();
}

export function Glyph({ glyph }: { glyph: GlyphKey }) {
  const Shapes = GLYPH_SHAPES[glyph];
  return (
    <g className="eco-glyph" transform={GLYPH_MATRIX} aria-hidden="true">
      <Shapes />
    </g>
  );
}
