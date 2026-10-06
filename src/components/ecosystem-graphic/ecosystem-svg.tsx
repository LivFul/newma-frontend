import type { CSSProperties, SVGProps } from "react";
import { HERO_SVG_DESC, HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import { ecosystemHref, HERO_LABELS, heroAriaLabel } from "@/content/ecosystem/registry";
import {
  CENTER,
  EDGES,
  LABEL_FONT,
  NODE_RADIUS,
  PARTS,
  RING,
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
  x: -NODE_RADIUS - 8,
  y: -NODE_RADIUS - 8,
  width: NODE_RADIUS * 2 + 16,
  height: NODE_RADIUS * 2 + 16,
});

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
    <>
      <a
        className="eco-link"
        href={ecosystemHref(part.slug)}
        aria-label={heroAriaLabel(part.slug)}
        style={toneStyle(part)}
      >
        <rect className="eco-hit" {...HIT} rx={NODE_RADIUS + 8} />
        <circle
          className="eco-node"
          r={part.center ? NODE_RADIUS + 6 : NODE_RADIUS}
          data-dashed={part.dashed || undefined}
          data-center={part.center || undefined}
        />
        <Glyph glyph={part.glyph} />
      </a>
      <g aria-hidden="true">
        <text
          className="eco-title"
          data-center={part.center || undefined}
          x={part.label.x}
          y={part.label.y}
          textAnchor={part.label.anchor}
          fontSize={LABEL_FONT.title}
        >
          {label.title}
        </text>
        <text
          className="eco-desc"
          x={part.label.x}
          y={part.label.y + LABEL_FONT.descriptor}
          textAnchor={part.label.anchor}
          fontSize={LABEL_FONT.descriptor}
        >
          {label.descriptor}
        </text>
      </g>
    </>
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

function Orbits() {
  return (
    <g className="eco-orbits" aria-hidden="true">
      <circle className="eco-orbit eco-orbit-inner" cx={CENTER.x} cy={CENTER.y} r={RING.inner} />
      <circle className="eco-orbit eco-orbit-outer" cx={CENTER.x} cy={CENTER.y} r={RING.outer} />
    </g>
  );
}

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
      <Orbits />
      <Edges arrowId={arrowId} />
      {PARTS.map((part, index) => (
        <Part key={part.slug} geometry={part} index={index} view={view}>
          <PartBody part={part} />
        </Part>
      ))}
    </svg>
  );
}
