import { isFiniteNumber, isRecord, isStringArray } from "./guards";

// Backend `details` reach the browser only through these per-code pickers: documented keys with
// the expected types, nothing else (no echoed input, no future debug fields). A shape mismatch
// drops the details; the code and message still pass.
type Picker = (details: unknown) => unknown;

const isString = (value: unknown): value is string => typeof value === "string";

function pickRecord(details: unknown, keys: Readonly<Record<string, (v: unknown) => boolean>>) {
  if (!isRecord(details)) return undefined;
  const picked: Record<string, unknown> = {};
  for (const [key, valid] of Object.entries(keys)) {
    if (!valid(details[key])) return undefined;
    picked[key] = details[key];
  }
  return picked;
}

function pickReasons(value: unknown): unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const reasons: unknown[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isString(item.code)) return undefined;
    reasons.push({
      code: item.code,
      ...(isString(item.message) ? { message: item.message } : {}),
      ...(isString(item.remediation) || item.remediation === null
        ? { remediation: item.remediation }
        : {}),
    });
  }
  return reasons;
}

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
  return PICKERS[code]?.(details);
}
