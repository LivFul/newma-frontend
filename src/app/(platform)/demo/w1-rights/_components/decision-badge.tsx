import { Badge, type BadgeProps, VisuallyHidden } from "@/components/ui";
import type { Decision } from "@/lib/demo/types";

const DECISION_TONE = {
  allow: "success",
  hold: "warning",
  deny: "danger",
} as const satisfies Record<Decision, NonNullable<BadgeProps["tone"]>>;

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <Badge tone={DECISION_TONE[decision]} data-testid="policy-decision" data-decision={decision}>
      <VisuallyHidden>Decision: </VisuallyHidden>
      {decision}
    </Badge>
  );
}
