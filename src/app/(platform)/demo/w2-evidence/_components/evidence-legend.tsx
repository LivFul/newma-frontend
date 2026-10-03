import { EvidenceLabelBadge } from "@/components/evidence/evidence-label-badge";
import { EVIDENCE_LABELS, type EvidenceLabel } from "@/lib/evidence";

// PRD §3.2: the six evidence distinctions are never merged.
const MEANING: Readonly<Record<EvidenceLabel, string>> = {
  literature_reported: "Stated in a (synthetic) source; not checked by NEWMA.",
  tentative_annotation: "Proposed identity or link awaiting confirmation.",
  computational_prediction: "Produced by simulated compute; never evidence of activity.",
  measured_observation: "A synthetic assay measurement.",
  scientist_accepted: "Reviewed and accepted by a NEWMA scientist.",
  unresolved_conflicting: "Sources disagree; held for review.",
};

export function EvidenceLegend() {
  return (
    <ul aria-label="Evidence label legend" className="grid list-none gap-2 p-0 sm:grid-cols-2">
      {EVIDENCE_LABELS.map((label) => (
        <li key={label} className="flex items-start gap-2 text-sm">
          <EvidenceLabelBadge label={label} />
          <span className="text-fg-muted">{MEANING[label]}</span>
        </li>
      ))}
    </ul>
  );
}
