"use client";
import { TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

/** Community liaison marks a scheduled benefit delivered with an evidence note (A23). */
export function DeliverDialog({ benefitId }: { benefitId: string }) {
  return (
    <ActionDialog<{ evidence_note: string }>
      trigger="Mark delivered"
      title="Mark benefit delivered"
      description="Record what evidences the delivery. No monetary value is attached to a benefit."
      submitLabel="Confirm delivery"
      endpoint={`/api/demo/benefits/${encodeURIComponent(benefitId)}/deliver`}
      initial={{ evidence_note: "" }}
      triggerVariant="secondary"
      toBody={(draft, key) => ({ ...draft, idempotency_key: key })}
      fields={(draft, set) => (
        <TextField
          label="Evidence note"
          value={draft.evidence_note}
          onChange={(evidence_note) => set({ evidence_note })}
          multiline
        />
      )}
    />
  );
}
