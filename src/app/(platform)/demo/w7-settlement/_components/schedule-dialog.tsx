"use client";
import { TextField } from "../../_components/fields";
import { ActionDialog } from "./action-dialog";

/** Community liaison schedules a planned benefit (A22). */
export function ScheduleDialog({ benefitId }: { benefitId: string }) {
  return (
    <ActionDialog<{ scheduled_for: string }>
      trigger="Schedule"
      title="Schedule benefit"
      description="Choose the date the non-monetary benefit is scheduled for."
      submitLabel="Confirm schedule"
      endpoint={`/api/demo/benefits/${encodeURIComponent(benefitId)}/schedule`}
      initial={{ scheduled_for: "" }}
      triggerVariant="secondary"
      toBody={(draft, key) => ({ ...draft, idempotency_key: key })}
      fields={(draft, set) => (
        <TextField
          label="Scheduled for"
          type="date"
          value={draft.scheduled_for}
          onChange={(scheduled_for) => set({ scheduled_for })}
        />
      )}
    />
  );
}
