import {
  WORKFLOW_CONTROLS,
  WORKFLOW_LEGEND_ITEMS,
  WORKFLOW_TONE_NAMES,
} from "@/content/home/workflow";
import { EDGE_TONES } from "@/lib/workflow/graph";
import "./workflow-diagram.css";

export function WorkflowLegend() {
  return (
    <div className="space-y-4">
      <ul
        role="list"
        aria-label={WORKFLOW_CONTROLS.legend.text}
        className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted"
      >
        {EDGE_TONES.map((tone) => (
          <li key={tone} className="flex items-center gap-2">
            <span aria-hidden="true" className="plate-surface rounded-full px-2 py-1">
              <svg width="36" height="8" viewBox="0 0 36 8" focusable="false">
                <line className="wf-edge" data-tone={tone} x1="2" y1="4" x2="34" y2="4" />
              </svg>
            </span>
            {WORKFLOW_TONE_NAMES[tone]?.text}
          </li>
        ))}
      </ul>
      <dl className="grid gap-3 text-sm text-fg-muted sm:grid-cols-2">
        {WORKFLOW_LEGEND_ITEMS.map((item) => (
          <div key={item.label.id}>
            <dt className="font-medium text-fg">{item.label.text}</dt>
            <dd>{item.text.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
