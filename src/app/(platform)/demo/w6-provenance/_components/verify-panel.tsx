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

/** The status region is always mounted so screen readers announce the result when it appears. */
export function VerifyPanel({ result, error, busy, onVerify }: Props) {
  return (
    <div className="space-y-2">
      <Button onClick={onVerify} aria-busy={busy || undefined} aria-disabled={busy || undefined}>
        Verify signature
      </Button>
      <ErrorNotice error={error} />
      <div role="status" aria-live="polite" aria-label="Verification result">
        {result ? (
          <p
            data-testid="verify-result"
            data-valid={result.valid ? "true" : "false"}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${result.valid ? "border-success-ink" : "border-danger"}`}
          >
            {result.valid
              ? "Valid"
              : `Invalid: ${result.reasons.join(", ") || "signature_mismatch"}`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
