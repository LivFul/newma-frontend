"use client";
import { formatCredits } from "@/lib/credits";
import type { Receipt } from "@/lib/demo/types";
import { SelectField, TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

type Draft = Readonly<{ receipt_id: string; rationale: string }>;

/** Finance reinstates a disputed receipt (A15); reinstatement is the only outcome. */
export function ResolveDialog({
  settlementId,
  receipts,
}: {
  settlementId: string;
  receipts: readonly Receipt[];
}) {
  const disputed = receipts.filter((r) => r.status === "disputed");
  return (
    <ActionDialog<Draft>
      trigger="Resolve a disputed receipt"
      title="Resolve a disputed receipt"
      description="The receipt is reinstated as recorded; the settlement returns to reviewed once none is disputed."
      submitLabel="Reinstate receipt"
      endpoint={`/api/demo/settlements/${encodeURIComponent(settlementId)}/resolve`}
      initial={{ receipt_id: disputed[0]?.id ?? "", rationale: "" }}
      disabledReason={disputed.length === 0 ? "No receipt is disputed." : undefined}
      toBody={(draft, key) => ({ ...draft, idempotency_key: key })}
      fields={(draft, set) => (
        <>
          <SelectField
            label="Receipt"
            value={draft.receipt_id}
            onChange={(receipt_id) => set({ receipt_id })}
            options={disputed.map((r) => ({
              value: r.id,
              label: `${r.external_ref} · ${formatCredits(r.amount_demo_credits)}`,
            }))}
          />
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
