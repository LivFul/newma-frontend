import { WORKFLOW_CONTROLS, WORKFLOW_TONE_NAMES } from "@/content/home/workflow";
import type { EdgeTone } from "@/lib/workflow/graph";
import "./workflow-diagram.css";

const TONES: readonly EdgeTone[] = ["pass", "remediate", "fail", "learn"];

// A key for the line styles. Colour is never the only carrier: each kind also has its own stroke
// pattern, shown here exactly as the diagram draws it.
export function WorkflowLegend() {
  return (
    <ul
      role="list"
      aria-label={WORKFLOW_CONTROLS.legend.text}
      className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted"
    >
      {TONES.map((tone) => (
        <li key={tone} className="flex items-center gap-2">
          <svg width="36" height="8" viewBox="0 0 36 8" aria-hidden="true" focusable="false">
            <line className="wf-edge" data-tone={tone} x1="2" y1="4" x2="34" y2="4" />
          </svg>
          {WORKFLOW_TONE_NAMES[tone]?.text}
        </li>
      ))}
    </ul>
  );
}
