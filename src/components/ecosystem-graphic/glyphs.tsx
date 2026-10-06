import type { ReactElement } from "react";
import type { GlyphKey } from "./geometry";

const GOLDEN_ANGLE = (137.508 * Math.PI) / 180;
const SPIRAL_DOTS = Array.from({ length: 7 }, (_, i) => {
  const radius = 5.4 * Math.sqrt(i + 1);
  return {
    cx: Number((radius * Math.cos((i + 1) * GOLDEN_ANGLE)).toFixed(2)),
    cy: Number((radius * Math.sin((i + 1) * GOLDEN_ANGLE)).toFixed(2)),
  };
});
const LEAF = "M-12 8C-4 -14 8 -16 12 -2C6 14 -6 16 -12 8Z";

const GLYPH_SHAPES: Readonly<Record<GlyphKey, () => ReactElement>> = {
  "frame-midrib": () => (
    <g>
      <path d={LEAF} />
      <path d="M-2 10C2 2 4 -6 6 -12" />
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
      <rect x={-11} y={-6} width={22} height={12} rx={6} />
      <path d="M-4 -6V6M4 -6V6" />
    </g>
  ),
  "teardrop-circle": () => (
    <g>
      <path d={LEAF} transform="rotate(-35)" />
    </g>
  ),
  "stacked-vesica": () => (
    <g>
      <rect x={-12} y={-6} width={24} height={12} rx={6} />
    </g>
  ),
  "linked-rings": () => (
    <g>
      <rect x={-13} y={-6} width={26} height={12} rx={6} strokeDasharray="3.5 3" />
    </g>
  ),
};

export function glyphShapes(glyph: GlyphKey): ReactElement {
  return GLYPH_SHAPES[glyph]();
}

export function Glyph({ glyph }: { glyph: GlyphKey }) {
  const Shapes = GLYPH_SHAPES[glyph];
  return (
    <g className="eco-glyph" aria-hidden="true">
      <Shapes />
    </g>
  );
}
