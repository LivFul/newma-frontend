import { EvidenceLabelBadge } from "@/components/evidence/evidence-label-badge";
import { Badge, SyntheticBadge } from "@/components/ui";
import type { Claim } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";
import { ClaimReviewDialog } from "./claim-review-dialog";

const reviewable = (claim: Claim) =>
  claim.status === "pending_review" || claim.status === "quarantined";

export function CurationQueue({ claims, allowed }: { claims: readonly Claim[]; allowed: boolean }) {
  if (claims.length === 0) return <p className="text-fg-muted">The curation queue is empty.</p>;
  return (
    <ul className="grid list-none gap-2 p-0" aria-label="Curation queue">
      {claims.map((claim) => (
        <li
          key={claim.id}
          className="space-y-2 rounded-md border border-border p-3 text-sm"
          data-status={claim.status}
        >
          <p className="font-medium">{claim.statement_synthetic}</p>
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceLabelBadge label={claim.evidence_label} />
            <Badge tone={claim.status === "quarantined" ? "warning" : "neutral"}>
              {humanize(claim.status)}
            </Badge>
            {claim.quarantine_reason ? (
              <span className="text-fg-muted">{humanize(claim.quarantine_reason)}</span>
            ) : null}
            <span className="text-fg-muted">
              {claim.source_location} · {claim.extraction_method} · confidence {claim.confidence}
            </span>
            <SyntheticBadge />
            {reviewable(claim) ? <ClaimReviewDialog claim={claim} allowed={allowed} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
