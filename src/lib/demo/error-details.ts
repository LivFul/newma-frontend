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

function pickPolicyDecision(d: unknown): unknown {
  if (!isRecord(d) || !isString(d.policy_decision_id)) return undefined;
  const reasons = pickReasons(d.reasons);
  return reasons ? { policy_decision_id: d.policy_decision_id, reasons } : undefined;
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
  source_not_cleared: pickPolicyDecision,
  // W7 (D-17): the fifteen settlement and license codes forwarded with details.
  settlement_state_conflict: (d) => pickRecord(d, { state: isString, attempted: isString }),
  license_state_conflict: (d) => pickRecord(d, { state: isString, attempted: isString }),
  receipt_duplicate: (d) => pickRecord(d, { duplicate_of: isString, receipt_id: isString }),
  settlement_has_disputed_receipts: (d) => pickRecord(d, { receipt_ids: isStringArray }),
  approver_already_approved: (d) => pickRecord(d, { persona: isString }),
  calculation_stale: (d) => pickRecord(d, { current_sha256: isString }),
  conservation_violation: (d) =>
    pickRecord(d, {
      distributable_demo_credits: isFiniteNumber,
      ledger_demo_credits: isFiniteNumber,
    }),
  license_rights_not_allowed: pickPolicyDecision,
  credential_check_failed: (d) => pickRecord(d, { reason: isString }),
  license_not_approved: (d) => pickRecord(d, { status: isString }),
  settlement_exists: (d) => pickRecord(d, { settlement_id: isString }),
  agreement_superseded: (d) => pickRecord(d, { latest_agreement_id: isString }),
  receipt_not_disputable: (d) => pickRecord(d, { status: isString }),
  receipt_not_disputed: (d) => pickRecord(d, { status: isString }),
  benefit_state_conflict: (d) => pickRecord(d, { state: isString }),
};

/** The browser-safe details for a backend error code, or undefined (omit the field). */
export function pickDetails(code: string, details: unknown): unknown {
  return Object.hasOwn(PICKERS, code) ? PICKERS[code](details) : undefined;
}
