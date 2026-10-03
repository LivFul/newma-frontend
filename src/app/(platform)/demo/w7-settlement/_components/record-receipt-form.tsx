"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { isRecord } from "@/lib/demo/guards";
import { useStableKey } from "@/lib/demo/idempotency";
import { useAction } from "@/lib/demo/use-action";
import { TextField } from "../../_components/fields";
import { allowedLabels } from "../../_components/persona-forbidden-notice";
import { W7ErrorNotice } from "./w7-error-notice";

type Props = Readonly<{
  settlementId: string;
  allowed: boolean;
  /** False once the state no longer accepts receipts. */
  recordable?: boolean;
  onDuplicate: (originalId: string) => void;
}>;

const WHOLE_NUMBER: ClientError = {
  code: "validation_error",
  message: "Enter a whole number of demo credits (1 or more).",
};
const INTEGER = /^\d{1,9}$/;

function duplicateOf(error: ClientError): string | undefined {
  if (error.code !== "receipt_duplicate" || !isRecord(error.details)) return undefined;
  return typeof error.details.duplicate_of === "string" ? error.details.duplicate_of : undefined;
}

/** Finance records a receipt (A12). A stable key per distinct submission: retries replay. */
export function RecordReceiptForm({
  settlementId,
  allowed,
  recordable = true,
  onDuplicate,
}: Props) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<ClientError | undefined>();
  const [duplicate, setDuplicate] = useState(false);
  const { busy, run } = useAction();
  const blocked = !allowed || !recordable;

  const edited = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setDuplicate(false);
    reset();
  };

  const submit = () => {
    if (busy || blocked) return;
    setError(undefined);
    setDuplicate(false);
    if (!INTEGER.test(amount) || Number(amount) < 1) return setError(WHOLE_NUMBER);
    void run(async () => {
      const result = await postJson<unknown>(
        `/api/demo/settlements/${encodeURIComponent(settlementId)}/receipts`,
        {
          external_ref: reference.trim(),
          amount_demo_credits: Number(amount),
          idempotency_key: key,
        },
      );
      if (result.ok) {
        setReference("");
        setAmount("");
        return router.refresh();
      }
      const original = duplicateOf(result.error);
      if (original === undefined) return setError(result.error);
      setDuplicate(true);
      onDuplicate(original);
      router.refresh();
    });
  };

  return (
    <form
      aria-label="Record a receipt"
      className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextField label="Reference" value={reference} onChange={edited(setReference)} />
      <TextField
        label="Amount (demo credits)"
        value={amount}
        onChange={edited(setAmount)}
        hint="A whole number; amounts are demo credits, never a currency."
      />
      <div className="space-y-2 sm:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={blocked} aria-busy={busy || undefined}>
            Record receipt
          </Button>
          {!allowed ? (
            <span className="text-sm text-fg-muted">
              Only {allowedLabels(["finance"])} can do this. Switch persona in the header.
            </span>
          ) : null}
          {allowed && !recordable ? (
            <span className="text-sm text-fg-muted">
              Receipts can no longer be recorded in this state.
            </span>
          ) : null}
        </div>
        {duplicate ? (
          <div role="alert" className="rounded-md border border-danger px-3 py-2 text-sm">
            <p>Duplicate receipt rejected — not counted</p>
            <p className="text-fg-muted">
              The reference is already live on this agreement; the original row is highlighted.
            </p>
          </div>
        ) : null}
        <W7ErrorNotice error={error} />
      </div>
    </form>
  );
}
