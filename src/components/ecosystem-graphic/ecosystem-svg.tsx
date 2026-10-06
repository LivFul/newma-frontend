import type { CSSProperties, SVGProps } from "react";
import { HERO_STAGES, HERO_SVG_DESC, HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import {
  ecosystemHref,
  HERO_INTERFACE_FACES,
  HERO_LABELS,
  heroAriaLabel,
} from "@/content/ecosystem/registry";
import {
  CARD,
  CENTER,
  EDGES,
  FLOW_GATES,
  hitRadius,
  LABEL_FONT,
  LABEL_LINE,
  LOOP,
  PARTS,
  STAGES,
  TWIN_GAP,
  TWIN_RADIUS,
  VIEWBOX,
  type Stage,
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
  const { width, height, radius } = CARD;
  return (
    <g className="eco-bob">
      <ellipse className="eco-node-shadow" cx={0} cy={height / 2 + 6} rx={width * 0.42} ry={5} />
      <rect
        className="eco-node eco-card"
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={radius}
        data-dashed={part.dashed || undefined}
      />
      <rect
        className="eco-node-sheen"
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={radius}
        fill={`url(#${svgId}-sheen)`}
      />
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

const STAGE_COPY: Readonly<Record<Stage["id"], { text: string }>> = {
  input: HERO_STAGES.input,
  core: HERO_STAGES.core,
  validation: HERO_STAGES.validation,
};

function Pipeline() {
  return (
    <g className="eco-pipeline" aria-hidden="true">
      {STAGES.map((stage) => (
        <g key={stage.id} className="eco-stage-group" data-stage={stage.id}>
          <rect
            className="eco-stage"
            data-stage={stage.id}
            x={stage.x}
            y={stage.y}
            width={stage.width}
            height={stage.height}
            rx={16}
          />
          <text
            className="eco-stage-title"
            x={stage.x + stage.width / 2}
            y={stage.y + 24}
            textAnchor="middle"
            fontSize={LABEL_FONT.title}
          >
            {STAGE_COPY[stage.id].text}
          </text>
        </g>
      ))}
      {FLOW_GATES.map((gate, index) => (
        <g key={index} className="eco-flow" transform={`translate(${gate.x} ${gate.y})`}>
          <path className="eco-chevron" d="M-8 -11 L4 0 L-8 11" />
          <path className="eco-chevron" d="M0 -11 L12 0 L0 11" />
        </g>
      ))}
      <g className="eco-loop" transform={`translate(${LOOP.x} ${LOOP.y})`}>
        <circle className="eco-loop-disc" r={LOOP.radius} />
        <g className="eco-loop-spin">
          <path className="eco-loop-mark" d="M-6 0h12M0 -6v12" />
          <path className="eco-loop-arc" d="M11 -4 A12 12 0 0 1 4 11" />
          <path className="eco-loop-arc" d="M-11 4 A12 12 0 0 1 -4 -11" />
        </g>
      </g>
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
      <Pipeline />
      <Edges arrowId={arrowId} />
      {PARTS.map((part, index) => (
        <Part key={part.slug} geometry={part} index={index} view={view}>
          <PartBody part={part} svgId={svgId} />
        </Part>
      ))}
    </svg>
  );
}
