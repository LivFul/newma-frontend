import Link from "next/link";
import { isRecord } from "@/lib/demo/guards";
import { decisionTimelineHref } from "./w8-href";

type Reason = Readonly<{ code: string; message?: string; remediation?: string | null }>;
type Refusal = Readonly<{
  policy_decision_id: string;
  decision: string;
  reasons: readonly Reason[];
}>;

const isReason = (value: unknown): value is Reason =>
  isRecord(value) && typeof value.code === "string";

// The BFF picker already shapes `details`; this guards the browser side as well.
function readRefusal(details: unknown): Refusal | undefined {
  if (!isRecord(details) || typeof details.policy_decision_id !== "string") return undefined;
  const { policy_decision_id, decision, reasons } = details;
  if (typeof decision !== "string" || !Array.isArray(reasons) || !reasons.every(isReason)) {
    return undefined;
  }
  return { policy_decision_id, decision, reasons };
}

export const isRefusalCode = (code: string): boolean =>
  code === "export_denied" || code === "export_held";

/** export_denied and export_held: the decision, every reason with remediation, no export created. */
export function ExportRefusal({ message, details }: { message: string; details: unknown }) {
  const refusal = readRefusal(details);
  return (
    <div
      role="alert"
      aria-label="Export refused"
      className="space-y-2 rounded-md border border-danger p-4 text-sm"
    >
      <h3 className="text-lg font-semibold">Export refused</h3>
      <p>{message}</p>
      {refusal ? (
        <>
          <p>
            Decision: <strong>{refusal.decision}</strong>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {refusal.reasons.map((reason) => (
              <li key={reason.code}>
                <span className="font-mono">{reason.code}</span>
                {reason.message ? <>: {reason.message}</> : null}
                {reason.remediation ? <> Remediation: {reason.remediation}</> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="font-medium">No export was created.</p>
      {refusal ? (
        <Link
          href={decisionTimelineHref(refusal.policy_decision_id)}
          className="underline underline-offset-4"
        >
          Show signed events
        </Link>
      ) : null}
    </div>
  );
}
