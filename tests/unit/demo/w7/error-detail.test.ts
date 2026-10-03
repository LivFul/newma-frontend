import { describe, expect, it } from "vitest";
import { errorDetailLine, policyReasons } from "@/lib/demo/w7-errors";

const err = (code: string, details?: unknown) => ({ code, message: "m", details });

describe("errorDetailLine renders the allow-listed details as one readable line", () => {
  it.each([
    ["agreement_superseded", { latest_agreement_id: "a2" }, "Latest agreement: a2"],
    [
      "settlement_state_conflict",
      { state: "disputed", attempted: "reconcile" },
      "Settlement is disputed; attempted reconcile.",
    ],
    [
      "license_state_conflict",
      { state: "approved", attempted: "decide" },
      "License is approved; attempted decide.",
    ],
    ["approver_already_approved", { persona: "finance" }, "Finance has already approved."],
    [
      "calculation_stale",
      { current_sha256: "abcdef0123456789" },
      "The calculation changed (now abcdef012345…); review it again.",
    ],
    [
      "conservation_violation",
      { distributable_demo_credits: 10, ledger_demo_credits: 9 },
      "Distributable 10 demo credits, ledger 9 demo credits.",
    ],
    [
      "credential_check_failed",
      { reason: "credential_expired" },
      "Credential check failed: credential expired.",
    ],
    ["license_not_approved", { status: "requested" }, "License status: requested."],
    ["settlement_exists", { settlement_id: "s1" }, "Settlement already exists: s1"],
    ["receipt_not_disputable", { status: "duplicate" }, "Receipt status: duplicate."],
    ["receipt_not_disputed", { status: "recorded" }, "Receipt status: recorded."],
    ["benefit_state_conflict", { state: "delivered" }, "Benefit is delivered."],
    [
      "settlement_has_disputed_receipts",
      { receipt_ids: ["r1", "r2"] },
      "2 disputed receipts must be resolved first.",
    ],
  ])("%s", (code, details, expected) => {
    expect(errorDetailLine(err(code, details))).toBe(expected);
  });

  it("returns undefined without details, with the wrong shape or for other codes", () => {
    expect(errorDetailLine(err("agreement_superseded"))).toBeUndefined();
    expect(
      errorDetailLine(err("agreement_superseded", { latest_agreement_id: 3 })),
    ).toBeUndefined();
    expect(errorDetailLine(err("not_found", { a: "b" }))).toBeUndefined();
  });
});

describe("policyReasons", () => {
  it("reads reasons from license_rights_not_allowed", () => {
    expect(
      policyReasons(
        err("license_rights_not_allowed", {
          policy_decision_id: "d",
          reasons: [
            { code: "purpose_not_permitted", message: "Purpose not permitted" },
            { code: "x" },
          ],
        }),
      ),
    ).toEqual([
      { code: "purpose_not_permitted", message: "Purpose not permitted" },
      { code: "x", message: undefined },
    ]);
  });
  it("is empty for other codes or malformed details", () => {
    expect(policyReasons(err("not_found", { reasons: [] }))).toEqual([]);
    expect(policyReasons(err("license_rights_not_allowed", { reasons: "x" }))).toEqual([]);
  });
});

describe("prototype keys render nothing", () => {
  it.each(["constructor", "__proto__", "toString"])("%s", (code) => {
    expect(errorDetailLine({ code, message: "m", details: { a: "b" } })).toBeUndefined();
  });
});
