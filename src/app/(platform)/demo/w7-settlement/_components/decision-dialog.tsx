"use client";
import type { License } from "@/lib/demo/types";
import { SelectField, TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

type Draft = Readonly<{ decision: "approve" | "deny"; rationale: string }>;

function disabledReason(license: License, allowed: boolean): string | undefined {
  if (!allowed) return "Only Tenant admin can do this. Switch persona in the header.";
  if (!license.next_actions.includes("decide")) return "This license has already been decided.";
  return undefined;
}

/** Tenant-admin decision (A6). Deny is always available; approve is blocked after a failed check. */
export function DecisionDialog({ license, allowed }: { license: License; allowed: boolean }) {
  const failed = license.credential.status === "failed";
  const initial: Draft = { decision: failed ? "deny" : "approve", rationale: "" };
  return (
    <ActionDialog<Draft>
      trigger="Decide license"
      title="Decide license"
      description="Approve or deny with a rationale. The rights policy is evaluated again on approval."
      submitLabel="Record decision"
      endpoint={`/api/demo/licenses/${encodeURIComponent(license.id)}/decision`}
      initial={initial}
      disabledReason={disabledReason(license, allowed)}
      toBody={(draft, key) => ({ ...draft, idempotency_key: key })}
      fields={(draft, set) => (
        <>
          <SelectField
            label="Decision"
            value={draft.decision}
            onChange={(decision) => set({ decision: decision as Draft["decision"] })}
            options={[
              { value: "approve", label: "Approve", disabled: failed },
              { value: "deny", label: "Deny" },
            ]}
          />
          {failed ? (
            <p className="text-sm text-fg-muted">
              Approval is not possible after a failed credential check; deny is still allowed.
            </p>
          ) : null}
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
