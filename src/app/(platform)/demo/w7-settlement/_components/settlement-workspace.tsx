"use client";
import { useState } from "react";
import { canAct } from "@/lib/demo/persona-actions";
import type { Settlement } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { ActionBar } from "./action-bar";
import { ReceiptsTable } from "./receipts-table";
import { RecordReceiptForm } from "./record-receipt-form";
import { SettlementHeader } from "./settlement-header";

type Props = Readonly<{ settlement: Settlement; persona: PersonaId }>;

/** Client shell of the settlement page; the server re-renders it with fresh data after each action. */
export function SettlementWorkspace({ settlement, persona }: Props) {
  const [highlightId, setHighlightId] = useState<string | undefined>();
  const finance = canAct(persona, "settlement_finance");
  return (
    <div className="space-y-8">
      <SettlementHeader settlement={settlement} />
      <section aria-labelledby="receipts-heading" className="space-y-3">
        <h2 id="receipts-heading" className="text-xl font-semibold">
          Receipts
        </h2>
        <ReceiptsTable
          receipts={settlement.receipts}
          totals={settlement.totals}
          highlightId={highlightId}
        />
        <RecordReceiptForm
          settlementId={settlement.id}
          allowed={finance}
          recordable={settlement.next_actions.includes("record_receipt")}
          onDuplicate={setHighlightId}
        />
      </section>
      <section aria-labelledby="actions-heading" className="space-y-3">
        <h2 id="actions-heading" className="text-xl font-semibold">
          Actions
        </h2>
        <ActionBar settlement={settlement} persona={persona} />
      </section>
    </div>
  );
}
