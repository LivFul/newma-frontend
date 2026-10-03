import Link from "next/link";
import { formatCredits } from "@/lib/credits";
import type { Commitment } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { SimulatedLabel } from "../../_components/simulated-label";
import { CopyHash } from "./copy-hash";

/** The signed settlement commitment (A-P5A-09); verified on the W6 single-event page. */
export function CommitmentCard({ commitment }: { commitment: Commitment }) {
  const { summary } = commitment;
  return (
    <div
      data-testid="commitment-card"
      className="space-y-3 rounded-md border border-border p-4 text-sm"
    >
      <p className="flex flex-wrap items-center gap-2">
        <SimulatedLabel label="Demo signature, not production key" />
        <span>Committed {formatInstant(commitment.committed_at)}</span>
      </p>
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <div>
          <dt className="text-fg-muted">Manifest SHA-256</dt>
          <dd>
            <CopyHash value={commitment.manifest_sha256} label="manifest SHA-256" />
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Signature</dt>
          <dd>
            <CopyHash value={commitment.signature} label="signature" />
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Key id</dt>
          <dd className="font-mono">{commitment.kid}</dd>
        </div>
        <div data-testid="commitment-summary">
          <dt className="text-fg-muted">Summary</dt>
          <dd>
            {formatCredits(summary.distributable_demo_credits)} distributable,{" "}
            {formatCredits(summary.ledger_total_demo_credits)} posted
          </dd>
        </div>
      </dl>
      <Link
        href={`/demo/w6-provenance/events/${encodeURIComponent(commitment.event_id)}`}
        className="inline-block underline underline-offset-4"
      >
        Verify in W6
      </Link>
    </div>
  );
}
