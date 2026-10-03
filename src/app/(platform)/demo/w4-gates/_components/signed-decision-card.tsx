import Link from "next/link";
import type { GateDecision } from "@/lib/demo/types";
import { SimulatedLabel } from "../../_components/simulated-label";
import { CopyValue } from "./copy-value";

const SIGNATURE_PREVIEW = 24;

/** The signed result: hash, truncated signature (copyable), kid and the demo-key label. */
export function SignedDecisionCard({
  decision,
  replayed,
}: {
  decision: GateDecision;
  replayed: boolean;
}) {
  return (
    <section
      aria-label="Signed decision"
      className="space-y-2 rounded-md border border-success p-4 text-sm"
      data-testid="signed-decision"
      data-decision-id={decision.id}
    >
      <p className="flex flex-wrap items-center gap-2 font-semibold">
        {decision.stage} {decision.decision} → {decision.status_after}
        <SimulatedLabel label="Demo signature, not production key" />
      </p>
      {replayed ? (
        <p>Replayed: the original signed decision is shown (no second decision).</p>
      ) : null}
      <dl className="grid gap-1">
        <div>
          <dt className="inline text-fg-muted">Manifest SHA-256: </dt>
          <dd className="inline break-all font-mono">{decision.manifest_sha256}</dd>
        </div>
        <div>
          <dt className="inline text-fg-muted">Signature: </dt>
          <dd className="inline font-mono">
            {decision.signature.slice(0, SIGNATURE_PREVIEW)}…{" "}
            <CopyValue value={decision.signature} label="Copy signature" />
          </dd>
        </div>
        <div>
          <dt className="inline text-fg-muted">Key id: </dt>
          <dd className="inline font-mono">{decision.kid}</dd>
        </div>
      </dl>
      <Link
        href={`/demo/w6-provenance/gate/${encodeURIComponent(decision.gate_id)}`}
        className="underline underline-offset-4"
      >
        View signed provenance for this gate
      </Link>
    </section>
  );
}
