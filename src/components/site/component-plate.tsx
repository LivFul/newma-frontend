import { PARTS, PLATE } from "@/components/ecosystem-graphic/geometry";
import { PLATE_SIDE, PLATE_TOP, toneStyle } from "@/components/ecosystem-graphic/ecosystem-svg";
import { Glyph } from "@/components/ecosystem-graphic/glyphs";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import "@/components/ecosystem-graphic/ecosystem-graphic.css";

// The component's own layer lifted out of the hero stack, at title-block scale. Decorative: the page
// heading names the component.
export function ComponentPlate({ slug, className }: { slug: EcosystemSlug; className?: string }) {
  const part = PARTS.find((p) => p.slug === slug);
  if (!part) return null;
  const dashed = part.dashed || undefined;
  return (
    <svg
      viewBox={`${-PLATE.halfWidth - 4} ${-PLATE.halfHeight - 4} ${PLATE.halfWidth * 2 + 8} ${PLATE.halfHeight * 2 + PLATE.thickness + 8}`}
      className={className}
      style={toneStyle(part)}
      aria-hidden="true"
      focusable="false"
    >
      <path className="eco-plate-side" d={PLATE_SIDE} data-dashed={dashed} />
      <path
        className="eco-plate-top"
        d={PLATE_TOP}
        data-dashed={dashed}
        style={{ fill: "color-mix(in srgb, var(--eco-tone) 22%, var(--color-bg-elevated))" }}
      />
      <Glyph glyph={part.glyph} />
    </svg>
  );
}
