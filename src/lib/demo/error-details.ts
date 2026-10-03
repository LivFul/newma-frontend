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
