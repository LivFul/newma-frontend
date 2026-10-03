import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { load } from "@/lib/demo/server-data";
import type { Candidate, Items } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { formatInstant } from "../_components/fields";
import { SimulatedLabel } from "../_components/simulated-label";
import { WorkflowHeader } from "../_components/workflow-header";

export default async function GatesPage() {
  const candidates = await load<Items<Candidate>>("/v1/candidates");
  const items = [...(candidates.data?.items ?? [])].sort((a, b) => a.rank - b.rank);
  return (
    <>
      <WorkflowHeader
        id="W4"
        title="Scientific review & gates"
        labels={<SimulatedLabel label="Demo signature, not production key" />}
      >
        Candidates move through H0–L1 only on a signed decision by the scientific approver, with
        automated checks and missing requirements shown for every gate.
      </WorkflowHeader>
      <section aria-labelledby="candidates-heading" className="space-y-3">
        <h2 id="candidates-heading" className="text-xl font-semibold">
          Candidates
        </h2>
        <ErrorNotice error={candidates.error} />
        <ul className="grid list-none gap-2 p-0" aria-label="Candidates">
          {items.map((candidate) => (
            <li
              key={candidate.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
              data-rank={candidate.rank}
            >
              <span className="font-mono text-fg-muted">#{candidate.rank}</span>
              <Link
                href={`/demo/w4-gates/${encodeURIComponent(candidate.id)}`}
                className="font-mono underline underline-offset-4"
              >
                {candidate.display_id}
              </Link>
              <span className="text-sm">Current stage {candidate.current_stage}</span>
              <span className="text-sm text-fg-muted" data-testid="last-reviewed-update">
                Last reviewed update:{" "}
                {candidate.last_reviewed_update_at
                  ? formatInstant(candidate.last_reviewed_update_at)
                  : "none"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-fg-muted">
          Gate statuses use the production vocabulary: <StatusBadge status="PASS" />{" "}
          <StatusBadge status="HOLD" /> <StatusBadge status="NOT_STARTED" />
        </p>
      </section>
    </>
  );
}
