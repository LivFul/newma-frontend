import { PLATE, PARTS } from "@/components/ecosystem-graphic/geometry";
import { toneStyle } from "@/components/ecosystem-graphic/ecosystem-svg";
import { Glyph } from "@/components/ecosystem-graphic/glyphs";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import "@/components/ecosystem-graphic/ecosystem-graphic.css";

const PLATE_TOP = `M0 ${-PLATE.halfHeight}L${PLATE.halfWidth} 0L0 ${PLATE.halfHeight}L${-PLATE.halfWidth} 0Z`;
const PLATE_SIDE =
  `M${-PLATE.halfWidth} 0L0 ${PLATE.halfHeight}L${PLATE.halfWidth} 0` +
  `V${PLATE.thickness}L0 ${PLATE.halfHeight + PLATE.thickness}L${-PLATE.halfWidth} ${PLATE.thickness}Z`;

export function ComponentPlate({ slug, className }: { slug: EcosystemSlug; className?: string }) {
  const part = PARTS.find((p) => p.slug === slug);
  if (!part) return null;
  const pad = 8;
  const w = PLATE.halfWidth + pad;
  const h = PLATE.halfHeight + PLATE.thickness + pad;
  return (
    <svg
      viewBox={`${-w} ${-PLATE.halfHeight - pad} ${w * 2} ${h + PLATE.halfHeight}`}
      className={className}
      style={toneStyle(part)}
      aria-hidden="true"
      focusable="false"
    >
      <path className="eco-plate-side" d={PLATE_SIDE} data-dashed={part.dashed || undefined} />
      <path className="eco-plate-top" d={PLATE_TOP} data-dashed={part.dashed || undefined} />
      <Glyph glyph={part.glyph} />
    </svg>
  );
}
