"use client";
import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useAction } from "@/lib/demo/use-action";
import type { RetrainingProposal } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { formatInstant } from "../../_components/fields";

/** IP C-04: retraining is never executed in the demo; Execute exists to show the refusal. */
export function RetrainingProposalCard({ proposal }: { proposal: RetrainingProposal }) {
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();
  const execute = () =>
    void run(async () => {
      const result = await postJson(
        `/api/demo/retraining-proposals/${encodeURIComponent(proposal.id)}/execute`,
        undefined,
      );
      setError(
        result.ok
          ? { code: "unexpected_success", message: "Retraining was not refused." }
          : result.error,
      );
    });
  return (
    <div
      className="space-y-2 rounded-md border border-border p-3 text-sm"
      data-testid="retraining-proposal"
    >
      <p className="flex flex-wrap items-center gap-2">
        <Badge tone="warning">Blocked pending separate authorization (IP C-04)</Badge>
        <span className="text-fg-muted">created {formatInstant(proposal.created_at)}</span>
      </p>
      <p>{proposal.reason}</p>
      <Button size="sm" variant="secondary" onClick={execute} aria-busy={busy || undefined}>
        Execute retraining
      </Button>
      <ErrorNotice error={error} />
    </div>
  );
}
