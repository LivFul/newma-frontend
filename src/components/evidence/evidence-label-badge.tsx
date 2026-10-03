import { Badge, type BadgeProps } from "@/components/ui/badge";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { EVIDENCE_LABEL_TEXT, type EvidenceLabel } from "@/lib/evidence";

// Colour and text together, never colour alone (PRD §3.2).
const LABEL_TONE = {
  literature_reported: "neutral",
  tentative_annotation: "warning",
  computational_prediction: "accent",
  measured_observation: "success",
  scientist_accepted: "success",
  unresolved_conflicting: "danger",
} as const satisfies Record<EvidenceLabel, NonNullable<BadgeProps["tone"]>>;

export function EvidenceLabelBadge({ label }: { label: EvidenceLabel }) {
  return (
    <Badge tone={LABEL_TONE[label]} data-testid="evidence-label" data-label={label}>
      <VisuallyHidden>Evidence: </VisuallyHidden>
      {EVIDENCE_LABEL_TEXT[label]}
    </Badge>
  );
}
