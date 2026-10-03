"use client";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useStableKey } from "@/lib/demo/idempotency";
import { useAction } from "@/lib/demo/use-action";
import { W7ErrorNotice } from "./w7-error-notice";

type Props = Readonly<{
  label: string;
  endpoint: string;
  body?: Readonly<Record<string, unknown>>;
  variant?: ButtonProps["variant"];
  /** When set the control is disabled and this text says why. */
  disabledReason?: string;
  /** Receives the 2xx body; default is router.refresh(). */
  onDone?: (data: unknown) => void;
  /** Extra content under the error notice (for example a link in a conflict). */
  extraError?: (error: ClientError) => ReactNode;
  testId?: string;
}>;

/**
 * One idempotent POST from a button. The key is stable per mounted button: a double click or a
 * retry after a timeout replays instead of acting twice; it resets only after a success.
 */
export function ActionButton({
  label,
  endpoint,
  body,
  variant,
  disabledReason,
  onDone,
  extraError,
  testId,
}: Props) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  const click = () => {
    if (busy) return;
    setError(undefined);
    void run(async () => {
      const result = await postJson<unknown>(endpoint, { ...body, idempotency_key: key });
      if (!result.ok) return setError(result.error);
      reset();
      if (onDone) onDone(result.data);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={variant}
          onClick={click}
          disabled={disabledReason !== undefined}
          aria-busy={busy || undefined}
          data-testid={testId}
        >
          {label}
        </Button>
        {disabledReason ? <span className="text-sm text-fg-muted">{disabledReason}</span> : null}
      </div>
      <W7ErrorNotice error={error} />
      {error && extraError ? extraError(error) : null}
    </div>
  );
}
