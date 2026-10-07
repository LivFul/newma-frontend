import { WORKFLOW_SOFTWARE } from "@/content/home/workflow";

export function WorkflowSoftwareFlow() {
  return (
    <section
      aria-labelledby="software-flow-heading"
      className="space-y-4 rounded-lg border border-border bg-bg-elevated/60 p-6"
    >
      <h3
        id="software-flow-heading"
        className="font-display text-2xl font-medium tracking-[-0.015em]"
      >
        {WORKFLOW_SOFTWARE.heading.text}
      </h3>
      <p className="max-w-[60ch] leading-relaxed text-fg-muted">{WORKFLOW_SOFTWARE.intro.text}</p>
      <p className="break-words font-mono text-sm leading-relaxed text-fg">
        {WORKFLOW_SOFTWARE.chain.text}
      </p>
      <p className="max-w-[60ch] leading-relaxed text-fg-muted">{WORKFLOW_SOFTWARE.body.text}</p>
      <p className="max-w-[60ch] text-sm leading-relaxed text-fg-muted">
        {WORKFLOW_SOFTWARE.disclaimer.text}
      </p>
      <p className="max-w-[60ch] text-sm leading-relaxed text-fg-muted">
        {WORKFLOW_SOFTWARE.reproducibility.text}
      </p>
    </section>
  );
}
