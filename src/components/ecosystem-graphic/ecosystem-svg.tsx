import type { CSSProperties, SVGProps } from "react";
import { HERO_SVG_DESC, HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import { ecosystemHref, heroAriaLabel, heroRowCopy } from "@/content/ecosystem/registry";
import { HERO_CONTROLS } from "@/content/home/hero-help";
import {
  EDGES,
  LABEL_BOX,
  LABEL_FONT,
  PARTS,
  PILL,
  SPINE,
  VIEWBOX,
  type PartGeometry,
} from "./geometry";
import type { HeroView, PartComponent } from "./part-props";

export type EcosystemSvgProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "role"> & {
  Part: PartComponent;
  svgId: string;
  view?: HeroView;
  layer?: "static" | "interactive";
};

const HIT = Object.freeze({
  x: -PILL.halfWidth - 6,
  y: LABEL_BOX.top,
  width: LABEL_BOX.offsetX + LABEL_BOX.width + PILL.halfWidth + 6,
  height: LABEL_BOX.bottom - LABEL_BOX.top,
});

const FIRST = PARTS[0]!;
const LAST = PARTS.at(-1)!;

const STROKE_INK: Partial<Record<PartGeometry["tone"], string>> = {
  "--color-eco-compute": "--color-eco-compute-ink",
  "--color-warning": "--color-warning-ink",
  "--color-success": "--color-success-ink",
  "--color-border-strong": "--color-fg-muted",
};

// Data & Knowledge draws its strokes in slate and its ink in the muted foreground.
export function toneStyle(part: PartGeometry): CSSProperties {
  const ink = STROKE_INK[part.tone] ?? part.tone;
  const stroke =
    part.tone === "--color-border-strong" ? part.tone : (STROKE_INK[part.tone] ?? part.tone);
  return {
    "--eco-tone": `var(${part.tone})`,
    "--eco-stroke": `var(${stroke})`,
    "--eco-ink": `var(${ink})`,
  } as CSSProperties;
}

function PartBody({ part }: { part: PartGeometry }) {
  const label = heroRowCopy(part.slug);
  // The first and last ticks are the bracket's own hooks, so they start where the curve ends.
  const end = part.slug === FIRST.slug || part.slug === LAST.slug;
  const tickFrom = SPINE.x - FIRST.assembled.x + (end ? SPINE.radius : 0);
  return (
    <a
      className="eco-link"
      href={ecosystemHref(part.slug)}
      aria-label={heroAriaLabel(part.slug)}
      style={toneStyle(part)}
    >
      <rect className="eco-hit" {...HIT} rx={10} />
      <path className="eco-tick" d={`M${tickFrom} 0H${-PILL.halfWidth}`} />
      <rect
        className="eco-bar"
        x={-PILL.halfWidth}
        y={-PILL.halfHeight}
        width={PILL.halfWidth * 2}
        height={PILL.halfHeight * 2}
        rx={PILL.halfHeight}
      />
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

const bracket = (top: number, bottom: number): string => {
  const { x, radius: r } = SPINE;
  return `M${x + r} ${top}Q${x} ${top} ${x} ${top + r}V${bottom - r}Q${x} ${bottom} ${x + r} ${bottom}`;
};

/** A bracket that hooks into the first and last rows, with every tick hanging from it. There is one
 *  for each view, crossfaded, so the bracket always reaches the rows wherever they sit. */
function StageMarks() {
  return (
    <g aria-hidden="true">
      <path className="eco-spine eco-rest" d={bracket(FIRST.assembled.y, LAST.assembled.y)} />
      <path className="eco-spine eco-open" d={bracket(FIRST.exploded.y, LAST.exploded.y)} />
    </g>
  );
}

// Only the flow arrows are drawn. The Data & Knowledge rails stay in the geometry (the TA flow), but the
// bracket spine already shows every row hanging from one record, and a second bracket beside it is noise.
const DRAWN_EDGES = EDGES.filter((edge) => edge.kind === "flow");

function Edges({ arrowId }: { arrowId: string }) {
  return (
    <g className="eco-edges" aria-hidden="true">
      {DRAWN_EDGES.map((edge) => (
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
      <desc id={descId}>
        {layer === "interactive"
          ? `${HERO_SVG_DESC.text} ${HERO_CONTROLS.text}`
          : HERO_SVG_DESC.text}
      </desc>
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
      <StageMarks />
      <Edges arrowId={arrowId} />
      {PARTS.map((part, index) => (
        <Part key={part.slug} geometry={part} index={index} view={view}>
          <PartBody part={part} />
        </Part>
      ))}
    </svg>
  );
}
