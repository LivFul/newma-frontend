"use client";
import { TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

/** Finance approves the evidence (A16): `reviewed` to `approved`. */
export function EvidenceApprovalDialog({ settlementId }: { settlementId: string }) {
  return (
    <ActionDialog<{ rationale: string }>
      trigger="Approve evidence"
      title="Approve evidence"
      description="Confirms the recorded receipts are complete enough to reconcile."
      submitLabel="Confirm evidence approval"
      endpoint={`/api/demo/settlements/${encodeURIComponent(settlementId)}/evidence-approval`}
      initial={{ rationale: "" }}
      toBody={(draft, key) => ({ ...draft, idempotency_key: key })}
      fields={(draft, set) => (
        <TextField
          label="Rationale"
          value={draft.rationale}
          onChange={(rationale) => set({ rationale })}
          multiline
        />
      )}
    />
  );
}
