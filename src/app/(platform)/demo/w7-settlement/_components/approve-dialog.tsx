"use client";
import type { Calculation } from "@/lib/demo/types";
import { TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

const PREVIEW_LENGTH = 12;

type Props = Readonly<{
  settlementId: string;
  calculation: Calculation;
  disabledReason?: string;
}>;

/** One of the two distinct-persona approvals (A18); it binds the calculation hash it shows. */
export function ApproveDialog({ settlementId, calculation, disabledReason }: Props) {
  return (
    <ActionDialog<{ rationale: string }>
      trigger="Approve distribution"
      title="Approve distribution"
      description="Your approval binds the illustrative calculation below. A second, different approver persona must also approve."
      submitLabel="Confirm approval"
      endpoint={`/api/demo/settlements/${encodeURIComponent(settlementId)}/approvals`}
      initial={{ rationale: "" }}
      disabledReason={disabledReason}
      keyScope={calculation.sha256}
      toBody={(draft, key) => ({
        calculation_sha256: calculation.sha256,
        rationale: draft.rationale,
        idempotency_key: key,
      })}
      fields={(draft, set) => (
        <>
          <p className="text-sm">
            Approving calculation{" "}
            <code data-testid="approve-hash" className="font-mono text-xs">
              {calculation.sha256.slice(0, PREVIEW_LENGTH)}…
            </code>
          </p>
          <TextField
            label="Rationale"
            value={draft.rationale}
            onChange={(rationale) => set({ rationale })}
            multiline
          />
        </>
      )}
    />
  );
}
