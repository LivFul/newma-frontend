import {
  WORKFLOW_CONTROLS,
  WORKFLOW_EDGE_LABELS,
  WORKFLOW_LANE_NAMES,
  WORKFLOW_NODE_LABELS,
} from "@/content/home/workflow";
import { WORKFLOW_EDGES, WORKFLOW_NODES, type LaneId } from "@/lib/workflow/graph";

// Reading order of the text version: the path a piece of work takes, lane by lane.
const LANE_ORDER: readonly LaneId[] = [
  "governance",
  "execution",
  "learning",
  "confirmation",
  "outcome",
];

const labelOf = (id: string) => WORKFLOW_NODE_LABELS[id]?.text ?? id;

// The text twin of the diagram: every step with the steps it leads to, readable without sight of the
// drawing. A native details element keeps it working with no JavaScript.
export function WorkflowText() {
  return (
    <details className="border-t border-border pt-4">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-display text-xl">
        {WORKFLOW_CONTROLS.textSummary.text}
      </summary>
      <div className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
        {LANE_ORDER.map((lane) => (
          <div key={lane} className="space-y-4">
            <h3 id={`workflow-text-${lane}`} className="text-xl font-semibold">
              {WORKFLOW_LANE_NAMES[lane]?.text}
            </h3>
            <ul role="list" aria-labelledby={`workflow-text-${lane}`} className="space-y-4">
              {WORKFLOW_NODES.filter((node) => node.lane === lane).map((node) => {
                const outgoing = WORKFLOW_EDGES.filter((edge) => edge.from === node.id);
                return (
                  <li key={node.id} className="space-y-1">
                    <p className="font-display text-lg">{labelOf(node.id)}</p>
                    {outgoing.length === 0 ? (
                      <p className="text-fg-muted">{WORKFLOW_CONTROLS.textEnds.text}</p>
                    ) : (
                      <ul role="list" className="space-y-1 text-fg-muted">
                        {outgoing.map((edge) => (
                          <li key={edge.id}>
                            <span className="sr-only">{WORKFLOW_CONTROLS.textLeadsTo.text} </span>
                            <span aria-hidden="true">→ </span>
                            {labelOf(edge.to)}
                            {WORKFLOW_EDGE_LABELS[edge.id] ? (
                              <span className="block text-sm">
                                {WORKFLOW_EDGE_LABELS[edge.id]?.text}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
