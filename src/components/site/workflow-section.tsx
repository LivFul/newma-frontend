import { WORKFLOW_CONTROLS, WORKFLOW_SECTION } from "@/content/home/workflow";
import { WorkflowDiagram, WORKFLOW_SVG_LAYOUT } from "./workflow-diagram";
import { WorkflowLegend } from "./workflow-legend";
import { WorkflowScientificAlt } from "./workflow-scientific-alt";
import { WorkflowSoftwareFlow } from "./workflow-software-flow";
import { WorkflowViewer } from "./workflow-viewer";
import { CONTAINER, H2, SECTION } from "./type";

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className={`${SECTION} plate-surface`}
      data-reveal
    >
      <div className={`${CONTAINER} space-y-12`}>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <h2 id="workflow-heading" className={H2}>
              {WORKFLOW_SECTION.heading.text}
            </h2>
            <p className="max-w-[48ch] text-lg leading-relaxed text-fg-muted">
              {WORKFLOW_SECTION.intro.text}
            </p>
          </div>
          <p className="max-w-[48ch] text-lg leading-relaxed text-fg-muted lg:col-span-5 lg:mt-3">
            {WORKFLOW_SECTION.supporting.text}
          </p>
        </div>
        <figure className="space-y-4">
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
          <figcaption className="max-w-[70ch] text-sm leading-relaxed text-fg-muted">
            {WORKFLOW_SECTION.caption.text}
          </figcaption>
        </figure>
        <WorkflowScientificAlt />
        <WorkflowSoftwareFlow />
      </div>
    </section>
  );
}
