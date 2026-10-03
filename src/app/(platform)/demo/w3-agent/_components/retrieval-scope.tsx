import { EvidenceLabelBadge } from "@/components/evidence/evidence-label-badge";
import { Withheld } from "@/components/ui";
import type { AgentQuery } from "@/lib/demo/types";

/** What the agent was allowed to read (with labels) and what policy withheld (with reason). */
export function RetrievalScope({ scope }: { scope: AgentQuery["retrieval_scope"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium">Included evidence</h3>
        <ul aria-label="Included evidence" className="space-y-1 text-sm">
          {scope.included.map((item) => (
            <li key={item.subject_id} className="flex flex-wrap items-center gap-2">
              {item.display_name} <EvidenceLabelBadge label={item.evidence_label} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium">Withheld by policy</h3>
        <ul aria-label="Withheld subjects" className="space-y-1 text-sm">
          {scope.withheld.length === 0 ? <li className="text-fg-muted">none</li> : null}
          {scope.withheld.map((item) => (
            <li key={item.subject_id} className="flex flex-wrap items-center gap-2">
              <Withheld field={item.subject_id} />
              <span className="font-mono">{item.reason_code}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
