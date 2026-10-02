import { Badge, type BadgeProps, VisuallyHidden } from "@/components/ui";
import type { JobState } from "@/lib/demo/jobs";

// RM §1.5 job states; colour never carries the meaning alone.
const STATE_TONE = {
  QUEUED: "neutral",
  RUNNING: "accent",
  RETRYING: "warning",
  HELD: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
} as const satisfies Record<JobState, NonNullable<BadgeProps["tone"]>>;

export function JobStateBadge({ state }: { state: JobState }) {
  return (
    <Badge tone={STATE_TONE[state]} data-state={state} data-testid="job-state">
      <VisuallyHidden>State: </VisuallyHidden>
      {state}
    </Badge>
  );
}
