import { EvidenceLabelBadge } from "@/components/evidence/evidence-label-badge";
import { SyntheticBadge } from "@/components/ui";
import type { Hypothesis } from "@/lib/demo/types";

export function HypothesisList({ hypotheses }: { hypotheses: readonly Hypothesis[] }) {
  if (hypotheses.length === 0) return <p className="text-fg-muted">No hypotheses yet.</p>;
  return (
    <ol aria-label="Ranked hypotheses" className="space-y-3">
      {hypotheses.map((h) => (
        <li
          key={`${h.rank}:${h.compound_id}`}
          className="space-y-1 rounded-md border border-border p-3 text-sm"
        >
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">#{h.rank}</span>
            <span className="font-mono">{h.display_id}</span>
            <span>score {h.score_synthetic}</span>
            <SyntheticBadge />
            <EvidenceLabelBadge label={h.evidence_label} />
          </p>
          <p>Uncertainty: {h.uncertainty}</p>
          <ul className="list-disc pl-5 text-fg-muted">
            {h.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
