import type { ClientError } from "@/lib/demo/client";
import { errorDetailLine, policyReasons } from "@/lib/demo/w7-errors";
import { ErrorNotice } from "../../_components/error-notice";

/** ErrorNotice plus the allow-listed W7 details (state, hash, reasons) inside the same alert. */
export function W7ErrorNotice({ error }: { error: ClientError | undefined }) {
  if (!error) return null;
  const line = errorDetailLine(error);
  const reasons = policyReasons(error);
  return (
    <ErrorNotice error={error}>
      {line ? <p data-testid="error-detail">{line}</p> : null}
      {reasons.length > 0 ? (
        <ul aria-label="Policy reasons" className="list-disc pl-5">
          {reasons.map((reason) => (
            <li key={reason.code}>
              <span className="font-mono">{reason.code}</span>
              {reason.message ? `: ${reason.message}` : null}
            </li>
          ))}
        </ul>
      ) : null}
    </ErrorNotice>
  );
}
