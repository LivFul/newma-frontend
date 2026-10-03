import { isFiniteNumber } from "./guards";
import { type Picker, isString, pickReasons, pickRecord } from "./pick-details";

// P5b error details (Contract table, "New error codes"): documented keys only, one picker per code.
// grievance_already_acknowledged is forwarded without details, so it has no entry.
const DECISIONS: ReadonlySet<string> = new Set(["allow", "hold", "deny"]);

function pickExportRefusal(details: unknown): unknown {
  const base = pickRecord(details, {
    policy_decision_id: isString,
    decision: (value) => isString(value) && DECISIONS.has(value),
  });
  const reasons = pickReasons((details as { reasons?: unknown } | null)?.reasons);
  return base && reasons ? { ...base, reasons } : undefined;
}

export const P5B_PICKERS: Readonly<Record<string, Picker>> = Object.freeze({
  quota_exhausted: (d) =>
    pickRecord(d, {
      credit_quota: isFiniteNumber,
      committed: isFiniteNumber,
      requested: isFiniteNumber,
      remaining: isFiniteNumber,
    }),
  export_denied: pickExportRefusal,
  export_held: pickExportRefusal,
  export_expiry_invalid: (d) => pickRecord(d, { max_days: isFiniteNumber }),
  charter_version_conflict: (d) => pickRecord(d, { current_version: isFiniteNumber }),
});
