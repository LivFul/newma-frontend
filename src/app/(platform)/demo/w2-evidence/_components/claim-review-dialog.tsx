"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { Claim } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { TextField } from "../../_components/fields";

type Props = Readonly<{ claim: Claim; allowed: boolean }>;

const RATIONALE_REQUIRED: ClientError = {
  code: "validation_error",
  message: "A rationale is required.",
};

/** Data steward approves or rejects; quarantine and double decisions are refused by the backend. */
export function ClaimReviewDialog({ claim, allowed }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const name = `Review claim ${claim.statement_synthetic}`;

  if (!allowed) {
    return (
      <Button size="sm" variant="secondary" aria-disabled="true" aria-label={name}>
        Review
      </Button>
    );
  }

  const decide = (decision: "approve" | "reject") => {
    if (pending) return;
    if (!rationale.trim()) return setError(RATIONALE_REQUIRED);
    setError(undefined);
    startTransition(async () => {
      const result = await postJson<Claim>(
        `/api/demo/curation/claims/${encodeURIComponent(claim.id)}/decisions`,
        {
          decision,
          rationale: rationale.trim(),
        },
      );
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setRationale("");
      setError(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" aria-label={name}>
          Review
        </Button>
      </DialogTrigger>
      <DialogContent title="Review extracted claim" description={claim.statement_synthetic}>
        <div className="space-y-3">
          <dl className="grid gap-1 text-sm">
            <div>
              <dt className="inline text-fg-muted">Source location: </dt>
              <dd className="inline">{claim.source_location}</dd>
            </div>
            <div>
              <dt className="inline text-fg-muted">Extraction method: </dt>
              <dd className="inline">{claim.extraction_method}</dd>
            </div>
            <div>
              <dt className="inline text-fg-muted">Confidence: </dt>
              <dd className="inline">{claim.confidence} (synthetic)</dd>
            </div>
          </dl>
          <TextField label="Rationale" value={rationale} onChange={setRationale} multiline />
          <ErrorNotice error={error} />
          <div className="flex gap-3">
            <Button onClick={() => decide("approve")} aria-busy={pending || undefined}>
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() => decide("reject")}
              aria-busy={pending || undefined}
            >
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
