"use client";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Button, type ButtonProps, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useAction } from "@/lib/demo/use-action";
import { W7ErrorNotice } from "./w7-error-notice";

type Props<D> = Readonly<{
  trigger: string;
  title: string;
  description?: string;
  submitLabel: string;
  endpoint: string;
  initial: D;
  fields: (draft: D, set: (patch: Partial<D>) => void) => ReactNode;
  toBody: (draft: D, key: string) => unknown;
  triggerVariant?: ButtonProps["variant"];
  /** When set the trigger is disabled and this text says why. */
  disabledReason?: string;
  /** Receives the 2xx body; default is router.refresh(). */
  onDone?: (data: unknown) => void;
}>;

/**
 * A form dialog over one idempotent POST: the key is minted when the dialog opens and reused by
 * every submit, so a double submit or a retry is a replay (Review Focus 2). The draft resets on open.
 */
export function ActionDialog<D>({
  trigger,
  title,
  description,
  submitLabel,
  endpoint,
  initial,
  fields,
  toBody,
  triggerVariant,
  disabledReason,
  onDone,
}: Props<D>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [draft, setDraft] = useState<D>(initial);
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  const onOpenChange = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    setError(undefined);
    if (next) {
      setKey(crypto.randomUUID());
      setDraft(initial);
    }
  };

  const submit = () => {
    if (busy) return;
    setError(undefined);
    void run(async () => {
      const result = await postJson<unknown>(endpoint, toBody(draft, key));
      if (!result.ok) return setError(result.error);
      setOpen(false);
      if (onDone) onDone(result.data);
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant={triggerVariant} disabled={disabledReason !== undefined}>
            {trigger}
          </Button>
        </DialogTrigger>
        <DialogContent title={title} description={description}>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {fields(draft, (patch) => setDraft((d) => ({ ...d, ...patch })))}
            <W7ErrorNotice error={error} />
            <Button type="submit" aria-busy={busy || undefined}>
              {submitLabel}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {disabledReason ? <span className="text-sm text-fg-muted">{disabledReason}</span> : null}
    </div>
  );
}
