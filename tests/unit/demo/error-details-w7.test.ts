import { describe, expect, it } from "vitest";
import { pickDetails } from "@/lib/demo/error-details";

const extra = { secret: "x", trace: "y" };

// [code, valid input, expected picked output]
const CASES: readonly (readonly [string, Record<string, unknown>, Record<string, unknown>])[] = [
  [
    "settlement_state_conflict",
    { state: "disputed", attempted: "reconcile" },
    { state: "disputed", attempted: "reconcile" },
  ],
  [
    "license_state_conflict",
    { state: "approved", attempted: "decide" },
    { state: "approved", attempted: "decide" },
  ],
  [
    "receipt_duplicate",
    { duplicate_of: "r1", receipt_id: "r2" },
    { duplicate_of: "r1", receipt_id: "r2" },
  ],
  ["settlement_has_disputed_receipts", { receipt_ids: ["r1"] }, { receipt_ids: ["r1"] }],
  ["approver_already_approved", { persona: "finance" }, { persona: "finance" }],
  ["calculation_stale", { current_sha256: "abc" }, { current_sha256: "abc" }],
  [
    "conservation_violation",
    { distributable_demo_credits: 10, ledger_demo_credits: 9 },
    { distributable_demo_credits: 10, ledger_demo_credits: 9 },
  ],
  ["credential_check_failed", { reason: "credential_expired" }, { reason: "credential_expired" }],
  ["license_not_approved", { status: "requested" }, { status: "requested" }],
  ["settlement_exists", { settlement_id: "s1" }, { settlement_id: "s1" }],
  ["agreement_superseded", { latest_agreement_id: "a2" }, { latest_agreement_id: "a2" }],
  ["receipt_not_disputable", { status: "duplicate" }, { status: "duplicate" }],
  ["receipt_not_disputed", { status: "recorded" }, { status: "recorded" }],
  ["benefit_state_conflict", { state: "delivered" }, { state: "delivered" }],
];

describe("W7 allow-list (Contract: fifteen codes forwarded with details)", () => {
  it.each(CASES)("%s keeps only the documented keys", (code, input, expected) => {
    expect(pickDetails(code, { ...input, ...extra })).toEqual(expected);
  });

  it.each(CASES)("%s drops the details on a wrong type or missing key", (code, input) => {
    const [firstKey] = Object.keys(input);
    expect(pickDetails(code, { ...input, [firstKey]: { nested: true } })).toBeUndefined();
    expect(pickDetails(code, {})).toBeUndefined();
    expect(pickDetails(code, null)).toBeUndefined();
  });

  it("license_rights_not_allowed keeps the decision id and reason code, message, remediation", () => {
    expect(
      pickDetails("license_rights_not_allowed", {
        policy_decision_id: "d1",
        reasons: [{ code: "purpose_not_permitted", message: "m", remediation: null, ...extra }],
        ...extra,
      }),
    ).toEqual({
      policy_decision_id: "d1",
      reasons: [{ code: "purpose_not_permitted", message: "m", remediation: null }],
    });
    expect(pickDetails("license_rights_not_allowed", { policy_decision_id: "d1" })).toBeUndefined();
  });

  it.each([
    "agreement_not_found",
    "licensee_not_found",
    "credential_not_provided",
    "no_recorded_receipts",
    "invalid_agreement_rules",
    "receipt_not_found",
    "not_found",
    "idempotency_conflict",
  ])("%s passes without details", (code) => {
    expect(pickDetails(code, { anything: "x" })).toBeUndefined();
  });
});
