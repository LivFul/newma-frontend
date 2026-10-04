import { WORKFLOW_CONTROLS, WORKFLOW_SECTION } from "@/content/home/workflow";
import { WorkflowDiagram, WORKFLOW_SVG_LAYOUT } from "./workflow-diagram";
import { WorkflowLegend } from "./workflow-legend";
import { WorkflowText } from "./workflow-text";
import { WorkflowViewer } from "./workflow-viewer";

// Sits between the product introduction and the six components. The diagram, its caption and the text
// version are plain server HTML; only the small viewer wrapper is client code, and it loads the
// three-dimensional scene on request.
export function WorkflowSection() {
  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className="border-t border-border py-12 md:py-16"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-8">
        <div className="space-y-3">
          <h2 id="workflow-heading" className="font-display text-3xl tracking-tight text-balance">
            {WORKFLOW_SECTION.heading.text}
          </h2>
          <p className="max-w-[58ch] text-fg-muted">{WORKFLOW_SECTION.intro.text}</p>
        </div>
        <figure className="space-y-3">
          <WorkflowViewer
            aspect={WORKFLOW_SVG_LAYOUT.aspect}
            labels={{
              explore: WORKFLOW_CONTROLS.explore.text,
              close: WORKFLOW_CONTROLS.close.text,
              loading: WORKFLOW_CONTROLS.loading.text,
              ready: WORKFLOW_CONTROLS.ready.text,
              failed: WORKFLOW_CONTROLS.failed.text,
              unavailable: WORKFLOW_CONTROLS.unavailable.text,
            }}
          >
            <WorkflowDiagram />
          </WorkflowViewer>
          <WorkflowLegend />
          <figcaption className="max-w-[58ch] text-sm text-fg-muted">
            {WORKFLOW_SECTION.caption.text}
          </figcaption>
        </figure>
        <WorkflowText />
      </div>
    </section>
  );
}
