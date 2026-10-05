import { Badge, type BadgeProps, VisuallyHidden } from "@/components/ui";
import { Mark, type MarkKind } from "@/components/ui/mark";
import type { AgentQuery, AgentStepStatus } from "@/lib/demo/types";

const TONE = {
  pending: "neutral",
  running: "accent",
  done: "success",
  held: "warning",
  failed: "danger",
} as const satisfies Record<AgentStepStatus, NonNullable<BadgeProps["tone"]>>;

const ICON: Readonly<Record<AgentStepStatus, MarkKind>> = {
  pending: "ring",
  running: "half",
  done: "dot",
  held: "pause",
  failed: "cross",
};

/** The ten TA §2 steps, in order, with an icon and the status as text. */
export function AgentSteps({ steps }: { steps: AgentQuery["steps"] }) {
  return (
    <ol aria-label="Agent steps" className="space-y-2">
      {steps.map((step, index) => (
        <li
          key={step.key}
          data-step={step.key}
          data-status={step.status}
          className="flex flex-wrap items-baseline gap-2 text-sm"
        >
          <span className="w-4">
            <Mark kind={ICON[step.status]} />
          </span>
          <span className="font-mono text-fg-muted">{index + 1}.</span>
          <span className="font-medium">{step.title}</span>
          <Badge tone={TONE[step.status]}>
            <VisuallyHidden>Status: </VisuallyHidden>
            {step.status}
          </Badge>
          {step.detail ? <span className="text-fg-muted">{step.detail}</span> : null}
        </li>
      ))}
    </ol>
  );
}
