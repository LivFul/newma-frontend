import Link from "next/link";
import type { Settlement } from "@/lib/demo/types";
import { isPersonaId, personaLabel, type PersonaId } from "@/lib/personas";
import { formatInstant } from "../../_components/fields";
import { allowedLabels } from "../../_components/persona-forbidden-notice";
import { ApproveDialog } from "./approve-dialog";

type Props = Readonly<{ settlement: Settlement; persona: PersonaId }>;

const label = (persona: string) => (isPersonaId(persona) ? personaLabel(persona) : persona);

function progressText(count: number, required: number): string {
  if (count >= required) return `${count} of ${required} approvals`;
  if (count === 0) return `0 of ${required} approvals`;
  return `${count} of ${required} approvals — a different approver persona must also approve`;
}

function blockedReason({ settlement, persona }: Props): string | undefined {
  const { eligible_personas: eligible, items } = settlement.approvals;
  if (!eligible.includes(persona)) {
    return `Only ${allowedLabels(eligible)} can do this. Switch persona in the header.`;
  }
  if (items.some((a) => a.persona === persona)) {
    return `${label(persona)} has already approved; a different approver persona must approve next.`;
  }
  return undefined;
}

/** Dual approval (A-P5A-05): two approvals from two distinct personas authorise the distribution. */
export function ApprovalsPanel({ settlement, persona }: Props) {
  const { items, required, eligible_personas: eligible } = settlement.approvals;
  const open = settlement.next_actions.includes("approve_distribution");
  const authorised = items.length >= required;
  const calculation = settlement.calculation;
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Dual approval: two different approver personas (
        {allowedLabels(eligible).replace(", ", " and ")}) must approve.
      </p>
      <p data-testid="approval-progress" className="text-sm font-medium">
        {progressText(items.length, required)}
      </p>
      {items.length > 0 ? (
        <ul
          aria-label="Approvals"
          className="divide-y divide-border rounded-md border border-border text-sm"
        >
          {items.map((approval) => (
            <li key={approval.persona} className="space-y-0.5 px-3 py-2">
              <p className="font-medium">{label(approval.persona)}</p>
              <p>{approval.rationale}</p>
              <p className="text-fg-muted">
                {formatInstant(approval.approved_at)} ·{" "}
                <Link
                  href={`/demo/w6-provenance/events/${encodeURIComponent(approval.event_id)}`}
                  className="underline underline-offset-4"
                >
                  Verify approval event in W6
                </Link>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {authorised ? <p className="text-sm font-semibold">Distribution authorised</p> : null}
      {open && calculation ? (
        <ApproveDialog
          settlementId={settlement.id}
          calculation={calculation}
          disabledReason={blockedReason({ settlement, persona })}
        />
      ) : null}
      {!open && !authorised ? (
        <p className="text-sm text-fg-muted">
          Approvals open once the receipts are reconciled and no receipt is disputed.
        </p>
      ) : null}
    </div>
  );
}
