"use client";
import { ActionDialog } from "./action-dialog";

type Draft = Readonly<{ anchor: boolean }>;

/** Final reconciliation (A20): signs the commitment; anchoring is optional and simulated. */
export function AuditDialog({ settlementId }: { settlementId: string }) {
  return (
    <ActionDialog<Draft>
      trigger="Final reconciliation and commitment"
      title="Final reconciliation and commitment"
      description="Reconciles receipts, calculation and ledger, then signs the settlement commitment with the demo key."
      submitLabel="Run final reconciliation"
      endpoint={`/api/demo/settlements/${encodeURIComponent(settlementId)}/audit`}
      initial={{ anchor: true }}
      toBody={(draft, key) => ({ anchor: draft.anchor, idempotency_key: key })}
      fields={(draft, set) => (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.anchor}
            onChange={(event) => set({ anchor: event.target.checked })}
            className="h-4 w-4"
          />
          Anchor (optional, simulated)
        </label>
      )}
    />
  );
}
