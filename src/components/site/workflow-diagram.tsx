import {
  WORKFLOW_CONTROLS,
  WORKFLOW_EDGE_LABELS,
  WORKFLOW_NODE_LABELS,
  WORKFLOW_NOTE_TEXT,
  WORKFLOW_SECTION,
} from "@/content/home/workflow";
import { textsOf } from "@/lib/workflow/copy";
import { SVG_TEXT } from "@/lib/workflow/footprints";
import { EDGE_TONES, type EdgeTone } from "@/lib/workflow/graph";
import { buildSvgLayout, type SvgNodeShape } from "@/lib/workflow/svg-layout";
import { ScrollRegion } from "./scroll-region";
import "./workflow-diagram.css";

// Built once per server process: the layout depends only on static data and copy.
export const WORKFLOW_SVG_LAYOUT = buildSvgLayout({
  nodeLabels: textsOf(WORKFLOW_NODE_LABELS),
  edgeLabels: textsOf(WORKFLOW_EDGE_LABELS),
  noteText: textsOf(WORKFLOW_NOTE_TEXT),
});

const TITLE_ID = "workflow-svg-title";
const DESC_ID = "workflow-svg-desc";
// Square corners: plates on a survey sheet, not rounded app cards.
const NODE_RADIUS = 0;
const NOTE_RADIUS = 0;
const TAG_RADIUS = 0;

const arrowId = (tone: EdgeTone) => `workflow-arrow-${tone}`;

/** Text lines centred on a point; `central` baselines keep multi-line labels visually centred. */
function Lines({
  lines,
  x,
  y,
  className,
  anchor = "middle",
}: {
  lines: readonly string[];
  x: number;
  y: number;
  className: string;
  anchor?: "start" | "middle";
}) {
  const top = y - ((lines.length - 1) * SVG_TEXT.linePx) / 2;
  return (
    <text className={className} textAnchor={anchor} fontSize={SVG_TEXT.fontPx}>
      {lines.map((line, index) => (
        <tspan key={index} x={x} y={top + index * SVG_TEXT.linePx} dominantBaseline="central">
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Node({ node }: { node: SvgNodeShape }) {
  const common = { className: "wf-node", "data-lane": node.lane, "data-kind": node.kind } as const;

  if (node.kind === "start" || node.kind === "end") {
    const radius = node.width / 2;
    return (
      <g>
        <circle {...common} cx={node.cx} cy={node.cy} r={radius} />
        {node.kind === "end" ? (
          <circle className="wf-node-core" cx={node.cx} cy={node.cy} r={radius - 5} />
        ) : null}
        <Lines
          lines={node.lines}
          x={node.cx + radius + SVG_TEXT.besideGapPx}
          y={node.cy}
          className="wf-label"
          anchor="start"
        />
      </g>
    );
  }

  return (
    <g>
      {node.hexagon ? (
        <polygon {...common} points={node.hexagon} strokeLinejoin="round" />
      ) : (
        <rect
          {...common}
          x={node.cx - node.width / 2}
          y={node.cy - node.height / 2}
          width={node.width}
          height={node.height}
          rx={NODE_RADIUS}
        />
      )}
      <Lines lines={node.lines} x={node.cx} y={node.cy} className="wf-label" />
    </g>
  );
}

// Server component with no client JavaScript: a complete, working diagram on its own. The viewer
// offers a three-dimensional twin on request; this is what everyone else keeps.
export function WorkflowDiagram() {
  const layout = WORKFLOW_SVG_LAYOUT;
  return (
    <ScrollRegion className="wf-scroll surface plate-surface" label={WORKFLOW_CONTROLS.region.text}>
      <div className="wf-frame" data-workflow-frame>
        <svg
          className="wf-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-labelledby={TITLE_ID}
          aria-describedby={DESC_ID}
        >
          <title id={TITLE_ID}>{WORKFLOW_SECTION.svgTitle.text}</title>
          <desc id={DESC_ID}>{WORKFLOW_SECTION.svgDesc.text}</desc>
          <defs>
            {EDGE_TONES.map((tone) => (
              <marker
                key={tone}
                id={arrowId(tone)}
                viewBox="0 0 8 8"
                refX={7}
                refY={4}
                markerWidth={8}
                markerHeight={8}
                orient="auto"
              >
                <path d="M0 0L8 4L0 8Z" className="wf-arrow" data-tone={tone} />
              </marker>
            ))}
          </defs>
          <g>
            {layout.edges.map((edge) => (
              <path
                key={edge.id}
                className="wf-edge"
                d={edge.d}
                data-tone={edge.tone}
                markerEnd={`url(#${arrowId(edge.tone)})`}
              >
                {edge.label ? <title>{edge.label}</title> : null}
              </path>
            ))}
          </g>
          <g>
            {layout.edges.map((edge) =>
              edge.tag ? (
                <g key={edge.id}>
                  <rect
                    className="wf-tag"
                    x={edge.tag.x}
                    y={edge.tag.y}
                    width={edge.tag.width}
                    height={edge.tag.height}
                    rx={TAG_RADIUS}
                  />
                  <Lines
                    lines={edge.tag.lines}
                    x={edge.tag.x + edge.tag.width / 2}
                    y={edge.tag.y + edge.tag.height / 2}
                    className="wf-tag-text"
                  />
                </g>
              ) : null,
            )}
          </g>
          <g>
            {layout.notes.map((note) => (
              <g key={note.id}>
                <line
                  className="wf-leader"
                  x1={note.leader.x1}
                  y1={note.leader.y1}
                  x2={note.leader.x2}
                  y2={note.leader.y2}
                />
                <rect
                  className="wf-note"
                  x={note.x}
                  y={note.y}
                  width={note.width}
                  height={note.height}
                  rx={NOTE_RADIUS}
                />
                <Lines
                  lines={note.lines}
                  x={note.x + SVG_TEXT.padX}
                  y={note.y + note.height / 2}
                  className="wf-note-text"
                  anchor="start"
                />
              </g>
            ))}
          </g>
          <g>
            {layout.nodes.map((node) => (
              <Node key={node.id} node={node} />
            ))}
          </g>
        </svg>
      </div>
    </ScrollRegion>
  );
}
