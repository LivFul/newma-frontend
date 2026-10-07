import { WORKFLOW_CONTROLS, WORKFLOW_SCIENTIFIC_STEPS } from "@/content/home/workflow";

export function WorkflowScientificAlt() {
  return (
    <details className="border-t border-border pt-4">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-display text-xl">
        {WORKFLOW_CONTROLS.textSummary.text}
      </summary>
      <ol role="list" className="mt-6 space-y-6">
        {WORKFLOW_SCIENTIFIC_STEPS.map((step, index) => (
          <li key={step.title.id} className="space-y-1">
            <p className="font-display text-lg">
              <span className="sr-only">
                {WORKFLOW_CONTROLS.textStepPrefix.text} {index + 1}.{" "}
              </span>
              {step.title.text}
            </p>
            <p className="max-w-[60ch] leading-relaxed text-fg-muted">{step.text.text}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
