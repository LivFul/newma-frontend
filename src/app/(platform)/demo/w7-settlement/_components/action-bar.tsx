import type { Settlement } from "@/lib/demo/types";
import { canAct } from "@/lib/demo/persona-actions";
import type { PersonaId } from "@/lib/personas";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { ActionButton } from "./action-button";
import { DisputeDialog } from "./dispute-dialog";
import { EvidenceApprovalDialog } from "./evidence-approval-dialog";
import { ResolveDialog } from "./resolve-dialog";

type Props = Readonly<{ settlement: Settlement; persona: PersonaId }>;

const HOLD_TEXT =
  "Resolve the disputed receipt first; reconciliation, approval and payout stay unavailable until then.";

/**
 * One control per `next_actions` entry the persona hint allows (the backend stays the authority);
 * every hidden control is explained in text. Receipt recording lives in its own form.
 */
export function ActionBar({ settlement, persona }: Props) {
  const finance = canAct(persona, "settlement_finance");
  const has = (action: Settlement["next_actions"][number]) =>
    settlement.next_actions.includes(action);
  const id = encodeURIComponent(settlement.id);
  const onHold =
    settlement.state === "disputed" || settlement.receipts.some((r) => r.status === "disputed");
  const financeActions = settlement.next_actions.filter(
    (a) => a !== "record_receipt" && a !== "approve_distribution",
  );
  return (
    <div data-testid="action-bar" className="space-y-3">
      {finance && has("review") ? (
        <ActionButton label="Mark reviewed" endpoint={`/api/demo/settlements/${id}/review`} />
      ) : null}
      {finance && has("evidence_approval") ? (
        <EvidenceApprovalDialog settlementId={settlement.id} />
      ) : null}
      {finance && has("dispute") ? (
        <DisputeDialog settlementId={settlement.id} receipts={settlement.receipts} />
      ) : null}
      {finance && has("resolve") ? (
        <ResolveDialog settlementId={settlement.id} receipts={settlement.receipts} />
      ) : null}
      {!finance && financeActions.length > 0 ? (
        <PersonaForbiddenNotice allowed={["finance"]} />
      ) : null}
      {onHold ? (
        <p role="note" className="text-sm text-fg-muted">
          {HOLD_TEXT}
        </p>
      ) : null}
      {settlement.next_actions.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No further actions: this settlement is {settlement.state.replaceAll("_", " ")}.
        </p>
      ) : null}
    </div>
  );
}
