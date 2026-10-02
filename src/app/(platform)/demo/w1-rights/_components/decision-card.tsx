import { useId } from "react";
import type { PolicyDecision } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { DecisionBadge } from "./decision-badge";

/** allow | hold | deny with every reason code, message and remediation (RM §1.3). */
export function DecisionCard({ decision }: { decision: PolicyDecision }) {
  const headingId = useId();
  return (
    <section
      role="region"
      aria-label="Policy decision"
      aria-describedby={headingId}
      className="space-y-3 rounded-md border border-border p-4"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-lg font-semibold">
        Policy decision <DecisionBadge decision={decision.decision} />
      </h3>
      <ul className="space-y-2">
        {decision.reasons.map((reason) => (
          <li key={reason.code} className="text-sm">
            <span className="font-mono" data-testid="reason-code">
              {reason.code}
            </span>
            : {reason.message}
            {reason.remediation ? (
              <p className="text-fg-muted">Remediation: {reason.remediation}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-muted">
        Policy version {decision.policy_version} · evaluated {formatInstant(decision.evaluated_at)}
        {decision.cache_entry_id ? " · cache entry created" : ""}
      </p>
    </section>
  );
}
