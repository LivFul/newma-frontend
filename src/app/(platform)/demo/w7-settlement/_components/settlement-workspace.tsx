"use client";
import { useState } from "react";
import { canAct } from "@/lib/demo/persona-actions";
import type { Settlement } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { ActionBar } from "./action-bar";
import { ApprovalsPanel } from "./approvals-panel";
import { CalculationTable } from "./calculation-table";
import { CommitmentCard } from "./commitment-card";
import { LedgerTable } from "./ledger-table";
import { ReceiptsTable } from "./receipts-table";
import { RecordReceiptForm } from "./record-receipt-form";
import { SettlementHeader } from "./settlement-header";
import { SettlementPoller } from "./settlement-poller";

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
      <section aria-labelledby="calc-heading" className="space-y-3">
        <h2 id="calc-heading" className="text-xl font-semibold">
          Calculation
        </h2>
        <CalculationTable calculation={settlement.calculation} />
      </section>
      <section aria-labelledby="actions-heading" className="space-y-3">
        <h2 id="actions-heading" className="text-xl font-semibold">
          Actions
        </h2>
        <ActionBar settlement={settlement} persona={persona} />
      </section>
      <section aria-labelledby="approvals-heading" className="space-y-3">
        <h2 id="approvals-heading" className="text-xl font-semibold">
          Approvals
        </h2>
        <ApprovalsPanel settlement={settlement} persona={persona} />
      </section>
      <section aria-labelledby="ledger-heading" className="space-y-3">
        <h2 id="ledger-heading" className="text-xl font-semibold">
          Distribution ledger
        </h2>
        <LedgerTable ledger={settlement.ledger} calculation={settlement.calculation} />
      </section>
      <section aria-labelledby="commitment-heading" className="space-y-3">
        <h2 id="commitment-heading" className="text-xl font-semibold">
          Signed commitment
        </h2>
        {settlement.commitment ? (
          <CommitmentCard commitment={settlement.commitment} />
        ) : (
          <p className="text-sm text-fg-muted">The commitment is signed at final reconciliation.</p>
        )}
      </section>
      <section aria-labelledby="anchor-heading" className="space-y-3">
        <h2 id="anchor-heading" className="text-xl font-semibold">
          Anchoring
        </h2>
        <SettlementPoller settlement={settlement} />
      </section>
    </div>
  );
}
