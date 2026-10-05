import type { CSSProperties, SVGProps } from "react";
import { HERO_SVG_DESC, HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import { ecosystemHref, HERO_LABELS, heroAriaLabel } from "@/content/ecosystem/registry";
import {
  EDGES,
  LABEL_BOX,
  LABEL_FONT,
  LEADER,
  PARTS,
  PLATE,
  VIEWBOX,
  type PartGeometry,
} from "./geometry";
import { Glyph } from "./glyphs";
import type { HeroView, PartComponent } from "./part-props";

export type EcosystemSvgProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "role"> & {
  Part: PartComponent;
  svgId: string;
  view?: HeroView;
  layer?: "static" | "interactive";
};

const HIT = Object.freeze({
  x: -PLATE.halfWidth - 6,
  y: -PLATE.halfHeight - 6,
  width: LABEL_BOX.offsetX + LABEL_BOX.width + PLATE.halfWidth + 6,
  height: PLATE.halfHeight * 2 + PLATE.thickness + 12,
});
export const PLATE_TOP = `M0 ${-PLATE.halfHeight}L${PLATE.halfWidth} 0L0 ${PLATE.halfHeight}L${-PLATE.halfWidth} 0Z`;
export const PLATE_SIDE =
  `M${-PLATE.halfWidth} 0L0 ${PLATE.halfHeight}L${PLATE.halfWidth} 0` +
  `V${PLATE.thickness}L0 ${PLATE.halfHeight + PLATE.thickness}L${-PLATE.halfWidth} ${PLATE.thickness}Z`;

// Light fills keep their hue for the plate but stroke and print in a darker ink of the same family,
// so every outline and glyph holds 3:1 on the survey paper (WCAG 1.4.11). Data & Knowledge is the one
// exception: it strokes in --color-border-strong (already 3:1) and prints in --color-fg-muted.
const STROKE_INK: Partial<Record<PartGeometry["tone"], string>> = {
  "--color-warning": "--color-warning-ink",
  "--color-success": "--color-success-ink",
  "--color-border-strong": "--color-fg-muted",
};
export function toneStyle(part: PartGeometry): CSSProperties {
  const ink = STROKE_INK[part.tone] ?? part.tone;
  return {
    "--eco-tone": `var(${part.tone})`,
    "--eco-stroke": `var(${part.tone === "--color-border-strong" ? part.tone : ink})`,
    "--eco-ink": `var(${ink})`,
  } as CSSProperties;
}

function PartBody({ part }: { part: PartGeometry }) {
  const label = HERO_LABELS[part.slug];
  return (
    <a
      className="eco-link"
      href={ecosystemHref(part.slug)}
      aria-label={heroAriaLabel(part.slug)}
      style={toneStyle(part)}
    >
      <rect className="eco-hit" {...HIT} rx={10} />
      <path className="eco-plate-side" d={PLATE_SIDE} data-dashed={part.dashed || undefined} />
      <path className="eco-plate-top" d={PLATE_TOP} data-dashed={part.dashed || undefined} />
      <Glyph glyph={part.glyph} />
      <path className="eco-leader" d={`M${LEADER.fromX} 0H${LEADER.toX}`} />
      <text
        className="eco-title"
        x={LABEL_BOX.offsetX}
        y={LABEL_BOX.titleBaseline}
        fontSize={LABEL_FONT.title}
      >
        {label.title}
      </text>
      <text
        className="eco-desc"
        x={LABEL_BOX.offsetX}
        y={LABEL_BOX.descriptorBaseline}
        fontSize={LABEL_FONT.descriptor}
      >
        {label.descriptor}
      </text>
    </a>
  );
}

function Edges({ arrowId }: { arrowId: string }) {
  return (
    <g className="eco-edges" aria-hidden="true">
      {EDGES.map((edge) => (
        <path
          key={edge.id}
          d={edge.d}
          data-kind={edge.kind}
          data-dashed={edge.dashed || undefined}
          markerEnd={edge.kind === "flow" ? `url(#${arrowId})` : undefined}
        />
      ))}
    </g>
  );
}

// Presentational and hook-free, so the server (static layer) and the client (Motion layer) render the
// same markup; only the Part wrapper differs.
export function EcosystemSvg({
  Part,
  svgId,
  view = "assembled",
  layer = "static",
  className,
  ...rest
}: EcosystemSvgProps) {
  const titleId = `${svgId}-title`;
  const descId = `${svgId}-desc`;
  const arrowId = `${svgId}-arrow`;
  return (
    <svg
      {...rest}
      id={svgId}
      className={["eco-svg", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-layer={layer}
      data-view={view}
    >
      <title id={titleId}>{HERO_SVG_TITLE.text}</title>
      <desc id={descId}>{HERO_SVG_DESC.text}</desc>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={7}
          markerHeight={7}
          orient="auto"
        >
          <path d="M0 0L8 4L0 8Z" className="eco-arrowhead" />
        </marker>
      </defs>
      <Edges arrowId={arrowId} />
      {PARTS.map((part, index) => (
        <Part key={part.slug} geometry={part} index={index} view={view}>
          <PartBody part={part} />
        </Part>
      ))}
    </svg>
  );
}
