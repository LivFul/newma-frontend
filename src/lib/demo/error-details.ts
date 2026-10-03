import { P5B_PICKERS } from "./error-details-p5b";
import { isFiniteNumber, isRecord, isStringArray } from "./guards";
import { type Picker, isString, pickReasons, pickRecord } from "./pick-details";

// Backend `details` reach the browser only through these per-code pickers: documented keys with
// the expected types, nothing else (no echoed input, no future debug fields). A shape mismatch
// drops the details; the code and message still pass.
function pickValidation(details: unknown): unknown[] | undefined {
  if (!Array.isArray(details)) return undefined;
  const entries: unknown[] = [];
  for (const item of details) {
    if (
      !isRecord(item) ||
      !Array.isArray(item.loc) ||
      !isString(item.msg) ||
      !isString(item.type)
    ) {
      return undefined;
    }
    entries.push({
      loc: item.loc.filter((p) => isString(p) || isFiniteNumber(p)),
      msg: item.msg,
      type: item.type,
    });
  }
  return entries;
}

const PICKERS: Readonly<Record<string, Picker>> = {
  ...P5B_PICKERS,
  persona_forbidden: (d) => pickRecord(d, { persona: isString, allowed: isStringArray }),
  gate_requirements_missing: (d) =>
    pickRecord(d, { stage: isString, missing_requirements: isStringArray }),
  gate_not_decidable: (d) => pickRecord(d, { stage: isString, status: isString, reason: isString }),
  evidence_package_stale: (d) => pickRecord(d, { current_version: isFiniteNumber }),
  job_terminal: (d) => pickRecord(d, { state: isString }),
  claim_not_approved: (d) => pickRecord(d, { claim_ids: isStringArray }),
  reconciliation_hold: (d) => pickRecord(d, { open_items: isStringArray }),
  claim_quarantined: (d) => pickRecord(d, { reason: isString }),
  retraining_not_authorized: (d) => pickRecord(d, { reason: isString }),
  validation_error: pickValidation,
  source_not_cleared: (d) => {
    if (!isRecord(d) || !isString(d.policy_decision_id)) return undefined;
    const reasons = pickReasons(d.reasons);
    return reasons ? { policy_decision_id: d.policy_decision_id, reasons } : undefined;
  },
};

/** The browser-safe details for a backend error code, or undefined (omit the field). */
export function pickDetails(code: string, details: unknown): unknown {
  return PICKERS[code]?.(details);
}
