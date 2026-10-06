import { NODE_RADIUS, PARTS } from "@/components/ecosystem-graphic/geometry";
import { toneStyle } from "@/components/ecosystem-graphic/ecosystem-svg";
import { Glyph } from "@/components/ecosystem-graphic/glyphs";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import "@/components/ecosystem-graphic/ecosystem-graphic.css";

export function ComponentPlate({ slug, className }: { slug: EcosystemSlug; className?: string }) {
  const part = PARTS.find((p) => p.slug === slug);
  if (!part) return null;
  const r = NODE_RADIUS;
  return (
    <svg
      viewBox={`${-r - 6} ${-r - 6} ${r * 2 + 12} ${r * 2 + 12}`}
      className={className}
      style={toneStyle(part)}
      aria-hidden="true"
      focusable="false"
    >
      <circle className="eco-node" r={r} data-dashed={part.dashed || undefined} />
      <Glyph glyph={part.glyph} />
    </svg>
  );
}
