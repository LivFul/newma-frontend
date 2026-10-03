"use client";
import { formatCredits } from "@/lib/credits";
import type { Receipt } from "@/lib/demo/types";
import { SelectField, TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

type Draft = Readonly<{ receipt_id: string; reason: string }>;

/** Finance disputes one recorded receipt (A14); no payout is possible until it is resolved. */
export function DisputeDialog({
  settlementId,
  receipts,
}: {
  settlementId: string;
  receipts: readonly Receipt[];
}) {
  const recorded = receipts.filter((r) => r.status === "recorded");
  return (
    <ActionDialog<Draft>
      trigger="Dispute a receipt"
      title="Dispute a receipt"
      description="The amount is held, not payable, until the dispute is resolved."
      submitLabel="Raise dispute"
      endpoint={`/api/demo/settlements/${encodeURIComponent(settlementId)}/dispute`}
      initial={{ receipt_id: recorded[0]?.id ?? "", reason: "" }}
      disabledReason={
        recorded.length === 0 ? "There is no recorded receipt to dispute." : undefined
      }
      toBody={(draft, key) => ({ ...draft, idempotency_key: key })}
      fields={(draft, set) => (
        <>
          <SelectField
            label="Receipt"
            value={draft.receipt_id}
            onChange={(receipt_id) => set({ receipt_id })}
            options={recorded.map((r) => ({
              value: r.id,
              label: `${r.external_ref} · ${formatCredits(r.amount_demo_credits)}`,
            }))}
          />
          <TextField
            label="Reason"
            value={draft.reason}
            onChange={(reason) => set({ reason })}
            multiline
          />
        </>
      )}
    />
  );
}
