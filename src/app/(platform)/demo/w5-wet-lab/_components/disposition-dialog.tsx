"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { Disposition, ReconciliationItem } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { SelectField, TextField, humanize } from "../../_components/fields";

const DISPOSITIONS: readonly Disposition[] = [
  "repeat_sample",
  "exclude_sample",
  "accept_with_deviation",
];

export function DispositionDialog({ item }: { item: ReconciliationItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [disposition, setDisposition] = useState<Disposition>("exclude_sample");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (pending) return;
    startTransition(async () => {
      const result = await postJson(
        `/api/demo/reconciliation/items/${encodeURIComponent(item.id)}/disposition`,
        { disposition, rationale },
      );
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button size="sm" aria-label={`Record disposition for ${item.sample_ref}`}>
          Record disposition
        </Button>
      </DialogTrigger>
      <DialogContent
        title={`Disposition for ${item.sample_ref}`}
        description={`Sample status: ${humanize(item.status)}.`}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <SelectField
            label="Disposition"
            value={disposition}
            onChange={(v) => setDisposition(v as Disposition)}
            options={DISPOSITIONS.map((d) => ({ value: d, label: humanize(d) }))}
          />
          <TextField label="Rationale" value={rationale} onChange={setRationale} multiline />
          <ErrorNotice error={error} />
          <Button type="submit" aria-busy={pending || undefined}>
            Record disposition
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
