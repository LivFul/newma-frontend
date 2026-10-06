import type { CSSProperties, SVGProps } from "react";
import { HERO_SVG_DESC, HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import { ecosystemHref, HERO_LABELS, heroAriaLabel } from "@/content/ecosystem/registry";
import {
  CENTER,
  EDGES,
  ELLIPSE,
  HUB_RADIUS,
  LABEL_FONT,
  LABEL_LINE,
  NODE_RADIUS,
  PARTS,
  VIEWBOX,
  type PartGeometry,
} from "./geometry";
import { Glyph } from "./glyphs";
import type { HeroView, PartComponent } from "./part-props";
import { wrapHeroLabel } from "./wrap-label";

export type EcosystemSvgProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "role"> & {
  Part: PartComponent;
  svgId: string;
  view?: HeroView;
  layer?: "static" | "interactive";
};

const HIT = Object.freeze({
  x: -NODE_RADIUS - 12,
  y: -NODE_RADIUS - 12,
  width: NODE_RADIUS * 2 + 24,
  height: NODE_RADIUS * 2 + 24,
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

function LabelLines({
  lines,
  className,
  x,
  y,
  anchor,
  size,
  center,
}: {
  lines: readonly string[];
  className: string;
  x: number;
  y: number;
  anchor: PartGeometry["label"]["anchor"];
  size: number;
  center?: boolean;
}) {
  return (
    <text
      className={className}
      data-center={center || undefined}
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
    >
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : LABEL_LINE}>
          {line}
          {index < lines.length - 1 ? " " : ""}
        </tspan>
      ))}
    </text>
  );
}

function PartLabel({ part }: { part: PartGeometry }) {
  const copy = HERO_LABELS[part.slug];
  const titleLines = wrapHeroLabel(copy.title);
  const descLines = wrapHeroLabel(copy.descriptor);
  const extra = titleLines.length + descLines.length - 1;
  const startY = part.label.y <= -24 ? part.label.y - extra * LABEL_LINE : part.label.y;
  return (
    <g className="eco-label" aria-hidden="true">
      <LabelLines
        className="eco-title"
        lines={titleLines}
        x={part.label.x}
        y={startY}
        anchor={part.label.anchor}
        size={LABEL_FONT.title}
        center={part.center}
      />
      <LabelLines
        className="eco-desc"
        lines={descLines}
        x={part.label.x}
        y={startY + titleLines.length * LABEL_LINE}
        anchor={part.label.anchor}
        size={LABEL_FONT.descriptor}
      />
    </g>
  );
}

function PartBody({ part, svgId }: { part: PartGeometry; svgId: string }) {
  const radius = part.center ? HUB_RADIUS : NODE_RADIUS;
  return (
    <>
      <a
        className="eco-link"
        href={ecosystemHref(part.slug)}
        aria-label={heroAriaLabel(part.slug)}
        style={toneStyle(part)}
      >
        <rect className="eco-hit" {...HIT} rx={radius + 8} />
        <g className="eco-bob">
          <ellipse className="eco-node-shadow" cx={0} cy={radius + 7} rx={radius * 0.78} ry={5} />
          <circle
            className="eco-node"
            r={radius}
            data-dashed={part.dashed || undefined}
            data-center={part.center || undefined}
            fill={part.center ? `url(#${svgId}-hub)` : undefined}
          />
          <circle className="eco-node-sheen" r={radius} fill={`url(#${svgId}-sheen)`} />
          <Glyph glyph={part.glyph} />
        </g>
      </a>
      <PartLabel part={part} />
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
      <ellipse
        className="eco-disc"
        cx={CENTER.x}
        cy={CENTER.y + ELLIPSE.assembled.ry * 0.22}
        rx={ELLIPSE.exploded.rx + 10}
        ry={22}
      />
      <ellipse
        className="eco-orbit eco-orbit-inner"
        cx={CENTER.x}
        cy={CENTER.y}
        rx={ELLIPSE.assembled.rx}
        ry={ELLIPSE.assembled.ry}
      />
      <ellipse
        className="eco-orbit eco-orbit-outer"
        cx={CENTER.x}
        cy={CENTER.y}
        rx={ELLIPSE.exploded.rx}
        ry={ELLIPSE.exploded.ry}
      />
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
      style={
        {
          "--eco-cx": `${CENTER.x}px`,
          "--eco-cy": `${CENTER.y}px`,
        } as CSSProperties
      }
    >
      <title id={titleId}>{HERO_SVG_TITLE.text}</title>
      <desc id={descId}>{HERO_SVG_DESC.text}</desc>
      <defs>
        <radialGradient id={`${svgId}-hub`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--color-bg-elevated)" />
          <stop offset="100%" stopColor="var(--color-bg-deep)" />
        </radialGradient>
        <radialGradient id={`${svgId}-sheen`} cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="58%" stopColor="white" stopOpacity="0" />
        </radialGradient>
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
          <PartBody part={part} svgId={svgId} />
        </Part>
      ))}
    </svg>
  );
}
