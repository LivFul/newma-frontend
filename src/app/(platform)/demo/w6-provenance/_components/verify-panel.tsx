import { Button } from "@/components/ui";
import type { ClientError } from "@/lib/demo/client";
import type { VerifyResult } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";

type Props = Readonly<{
  result: VerifyResult | undefined;
  error: ClientError | undefined;
  busy: boolean;
  onVerify: () => void;
}>;

export function VerifyPanel({ result, error, busy, onVerify }: Props) {
  return (
    <div className="space-y-2">
      <Button onClick={onVerify} aria-busy={busy || undefined}>
        Verify signature
      </Button>
      <ErrorNotice error={error} />
      {result?.valid ? (
        <p
          role="status"
          data-testid="verify-result"
          className="rounded-md border border-success px-3 py-2 text-sm font-semibold"
        >
          Valid
        </p>
      ) : null}
      {result && !result.valid ? (
        <p
          role="alert"
          data-testid="verify-result"
          className="rounded-md border border-danger px-3 py-2 text-sm font-semibold"
        >
          Invalid: {result.reasons.join(", ") || "signature_mismatch"}
        </p>
      ) : null}
    </div>
  );
}
