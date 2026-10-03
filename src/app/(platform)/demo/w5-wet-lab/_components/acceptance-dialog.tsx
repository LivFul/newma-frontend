"use client";
import { useState } from "react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useAction } from "@/lib/demo/use-action";
import type { AssayImport } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { TextField } from "../../_components/fields";

type Props = Readonly<{ assayImport: AssayImport; onAccepted: (accepted: AssayImport) => void }>;

/** Scientist acceptance (LAB-08); one idempotency key per dialog open. */
export function AcceptanceDialog({ assayImport, onAccepted }: Props) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  const onOpenChange = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    setError(undefined);
    if (next) setKey(crypto.randomUUID());
  };

  const submit = () => {
    if (busy) return;
    void run(async () => {
      const result = await postJson<AssayImport>(
        `/api/demo/assay-imports/${encodeURIComponent(assayImport.id)}/acceptance`,
        { rationale, idempotency_key: key },
      );
      if (!result.ok) return setError(result.error);
      setOpen(false);
      onAccepted(result.data);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Accept results</Button>
      </DialogTrigger>
      <DialogContent
        title="Accept assay results"
        description="A NEWMA scientist accepts the reconciled synthetic observations."
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <TextField label="Rationale" value={rationale} onChange={setRationale} multiline />
          <ErrorNotice error={error} />
          <Button type="submit" aria-busy={busy || undefined}>
            Confirm acceptance
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
