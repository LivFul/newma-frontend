import type { CSSProperties, SVGProps } from "react";
import { HERO_SVG_DESC, HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import {
  ecosystemHref,
  HERO_INTERFACE_FACES,
  HERO_LABELS,
  heroAriaLabel,
} from "@/content/ecosystem/registry";
import {
  CENTER,
  EDGES,
  ELLIPSE,
  hitRadius,
  LABEL_FONT,
  LABEL_LINE,
  NODE_RADIUS,
  PARTS,
  TWIN_GAP,
  TWIN_RADIUS,
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

function hitBox(radius: number) {
  const pad = 16;
  return {
    x: -radius - pad,
    y: -radius - pad,
    width: (radius + pad) * 2,
    height: (radius + pad) * 2,
  };
}

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
  if (part.shape === "twin") {
    return (
      <g className="eco-label" aria-hidden="true">
        <LabelLines
          className="eco-title"
          lines={[copy.title]}
          x={part.label.x}
          y={part.label.y}
          anchor={part.label.anchor}
          size={LABEL_FONT.title}
        />
        <LabelLines
          className="eco-desc"
          lines={[copy.descriptor]}
          x={part.label.x}
          y={part.label.y + LABEL_LINE}
          anchor={part.label.anchor}
          size={LABEL_FONT.descriptor}
        />
        <text
          className="eco-title"
          x={TWIN_RADIUS + 12}
          y={-TWIN_GAP + 4}
          textAnchor="start"
          fontSize={LABEL_FONT.title}
        >
          {HERO_INTERFACE_FACES.people.title}
        </text>
        <text
          className="eco-title"
          x={TWIN_RADIUS + 12}
          y={TWIN_GAP + 4}
          textAnchor="start"
          fontSize={LABEL_FONT.title}
        >
          {HERO_INTERFACE_FACES.apps.title}
        </text>
      </g>
    );
  }
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

function ServerBody({ part }: { part: PartGeometry }) {
  const dashed = part.dashed || undefined;
  return (
    <g className="eco-bob">
      <ellipse className="eco-node-shadow" cx={4} cy={22} rx={28} ry={6} />
      <g className="eco-server-body">
        <path className="eco-server-side" d="M16 -6 L30 -18 L30 8 L16 20Z" data-dashed={dashed} />
        <path
          className="eco-server-front"
          d="M-26 -4 L16 -4 L16 20 L-26 20Z"
          data-dashed={dashed}
        />
        <path
          className="eco-server-top"
          d="M-26 -4 L-12 -16 L30 -18 L16 -4Z"
          data-dashed={dashed}
        />
        <path className="eco-server-bay" d="M-18 4 H8 M-18 10 H8 M-18 16 H8" data-dashed={dashed} />
      </g>
      <g transform="translate(-4 8)">
        <Glyph glyph={part.glyph} />
      </g>
    </g>
  );
}

function TwinBody({ part }: { part: PartGeometry }) {
  return (
    <g className="eco-bob">
      <ellipse className="eco-node-shadow" cx={0} cy={TWIN_GAP + TWIN_RADIUS + 6} rx={16} ry={4} />
      <line className="eco-twin-join" x1={0} y1={-2} x2={0} y2={2} />
      <g transform={`translate(0 ${-TWIN_GAP})`}>
        <circle className="eco-node" r={TWIN_RADIUS} />
        <Glyph glyph={part.glyph} />
      </g>
      <g transform={`translate(0 ${TWIN_GAP})`}>
        <circle className="eco-node" r={TWIN_RADIUS} data-apps="true" />
        <g className="eco-glyph" aria-hidden="true">
          <rect x={-10} y={-6} width={20} height={12} rx={3} />
          <path d="M-4 -6V-10M4 -6V-10M-4 6V10M4 6V10" />
        </g>
      </g>
    </g>
  );
}

function NodeBody({ part, svgId }: { part: PartGeometry; svgId: string }) {
  const radius = NODE_RADIUS;
  return (
    <g className="eco-bob">
      <ellipse className="eco-node-shadow" cx={0} cy={radius + 7} rx={radius * 0.78} ry={5} />
      <circle
        className="eco-node"
        r={radius}
        data-dashed={part.dashed || undefined}
        fill={part.center ? `url(#${svgId}-hub)` : undefined}
      />
      <circle className="eco-node-sheen" r={radius} fill={`url(#${svgId}-sheen)`} />
      <Glyph glyph={part.glyph} />
    </g>
  );
}

function PartBody({ part, svgId }: { part: PartGeometry; svgId: string }) {
  const radius = hitRadius(part);
  return (
    <>
      <a
        className="eco-link"
        href={ecosystemHref(part.slug)}
        aria-label={heroAriaLabel(part.slug)}
        style={toneStyle(part)}
      >
        <rect className="eco-hit" {...hitBox(radius)} rx={radius + 8} />
        {part.shape === "server" ? (
          <ServerBody part={part} />
        ) : part.shape === "twin" ? (
          <TwinBody part={part} />
        ) : (
          <NodeBody part={part} svgId={svgId} />
        )}
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
        cy={CENTER.y + ELLIPSE.assembled.ry * 0.28}
        rx={ELLIPSE.exploded.rx + 8}
        ry={20}
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
