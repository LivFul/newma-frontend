"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { RightsRecord, WithdrawResult } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { TextField } from "../../_components/fields";

type Props = Readonly<{ record: RightsRecord; allowed: boolean }>;

const REASON_REQUIRED: ClientError = { code: "validation_error", message: "A reason is required." };

/** Community liaison only; other personas see a disabled control (the backend decides). */
export function WithdrawDialog({ record, allowed }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const name = `Withdraw consent for ${record.subject_display_name}`;

  if (!allowed) {
    return (
      <Button variant="secondary" size="sm" aria-disabled="true" aria-label={name}>
        Withdraw consent
      </Button>
    );
  }

  const submit = () => {
    if (pending) return;
    if (reason.trim().length === 0) return setError(REASON_REQUIRED);
    startTransition(async () => {
      const result = await postJson<WithdrawResult>(
        `/api/demo/rights/records/${encodeURIComponent(record.id)}/withdraw`,
        { reason: reason.trim() },
      );
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger" size="sm" aria-label={name}>
          Withdraw consent
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Withdraw consent"
        description={`Withdrawing invalidates every cached retrieval governed by this record (${record.subject_display_name}).`}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <TextField label="Reason" value={reason} onChange={setReason} multiline />
          <ErrorNotice error={error} />
          <Button type="submit" variant="danger" aria-busy={pending || undefined}>
            Confirm withdrawal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
