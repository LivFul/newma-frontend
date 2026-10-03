"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { Grievance } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { ErrorNotice } from "../../_components/error-notice";
import { formatInstant } from "../../_components/fields";

function AcknowledgeButton({ grievance }: { grievance: Grievance }) {
  const router = useRouter();
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  const acknowledge = () => {
    if (busy) return;
    setError(undefined);
    void run(async () => {
      const result = await postJson(
        `/api/demo/grievances/${encodeURIComponent(grievance.id)}/acknowledge`,
        undefined,
      );
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={acknowledge}
        aria-busy={busy || undefined}
        aria-label={`Acknowledge the concern about ${grievance.subject_display_name}`}
      >
        Acknowledge
      </Button>
      <ErrorNotice error={error} />
    </>
  );
}

type Props = Readonly<{ grievances: readonly Grievance[]; canAcknowledge: boolean }>;

/** The queue every allowed persona can read; only the data steward can acknowledge. */
export function GrievanceQueue({ grievances, canAcknowledge }: Props) {
  if (grievances.length === 0) {
    return <p className="text-sm text-fg-muted">No grievances in the queue.</p>;
  }
  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="group"
      aria-label="Grievance queue (scrollable)"
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Grievance queue, newest first</caption>
        <thead>
          <tr className="border-b border-border">
            {["Record", "Category", "Status", "Raised", "Description", "Action"].map((name) => (
              <th key={name} scope="col" className="p-2">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grievances.map((grievance) => (
            <tr
              key={grievance.id}
              data-testid="grievance-row"
              data-status={grievance.status}
              className="border-b border-border align-top"
            >
              <th scope="row" className="p-2 font-medium">
                {grievance.subject_display_name}
              </th>
              <td className="p-2">{grievance.category_text}</td>
              <td className="p-2">{grievance.status === "open" ? "Open" : "Acknowledged"}</td>
              <td className="p-2">{formatInstant(grievance.raised_at)}</td>
              <td className="p-2">{grievance.description}</td>
              <td className="p-2">
                {canAcknowledge && grievance.status === "open" ? (
                  <AcknowledgeButton grievance={grievance} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
