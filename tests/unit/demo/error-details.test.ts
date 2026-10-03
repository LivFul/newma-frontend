import { describe, expect, it } from "vitest";
import { pickDetails } from "@/lib/demo/error-details";

describe("pickDetails keeps only the documented keys per code", () => {
  const extra = { secret: "x", trace: "y" };

  it.each([
    [
      "persona_forbidden",
      { persona: "scientist", allowed: ["a"], ...extra },
      { persona: "scientist", allowed: ["a"] },
    ],
    [
      "gate_requirements_missing",
      { stage: "H2", missing_requirements: ["r"], ...extra },
      { stage: "H2", missing_requirements: ["r"] },
    ],
    [
      "gate_not_decidable",
      { stage: "H2", status: "HOLD", reason: "earlier", ...extra },
      { stage: "H2", status: "HOLD", reason: "earlier" },
    ],
    ["evidence_package_stale", { current_version: 3, ...extra }, { current_version: 3 }],
    ["job_terminal", { state: "SUCCEEDED", ...extra }, { state: "SUCCEEDED" }],
    ["claim_not_approved", { claim_ids: ["c1"], ...extra }, { claim_ids: ["c1"] }],
    ["reconciliation_hold", { open_items: ["S-03"], ...extra }, { open_items: ["S-03"] }],
    ["claim_quarantined", { reason: "ambiguous", ...extra }, { reason: "ambiguous" }],
    [
      "retraining_not_authorized",
      { reason: "needs authorization", ...extra },
      { reason: "needs authorization" },
    ],
  ])("%s", (code, input, expected) => {
    expect(pickDetails(code, input)).toEqual(expected);
  });

  it("source_not_cleared keeps the decision id and reason code, message, remediation only", () => {
    expect(
      pickDetails("source_not_cleared", {
        policy_decision_id: "d",
        reasons: [
          {
            code: "no_rights_record",
            message: "m",
            remediation: null,
            rights_record_id: "r",
            ...extra,
          },
        ],
        ...extra,
      }),
    ).toEqual({
      policy_decision_id: "d",
      reasons: [{ code: "no_rights_record", message: "m", remediation: null }],
    });
  });

  it("validation_error keeps loc, msg and type only (no input echo)", () => {
    expect(
      pickDetails("validation_error", [
        {
          loc: ["body", "reason"],
          msg: "too short",
          type: "string_too_short",
          input: "secret",
          ctx: {},
        },
      ]),
    ).toEqual([{ loc: ["body", "reason"], msg: "too short", type: "string_too_short" }]);
  });

  it.each(["idempotency_conflict", "invalid_cursor", "not_found", "something_else"])(
    "%s carries no details",
    (code) => {
      expect(pickDetails(code, { anything: 1 })).toBeUndefined();
    },
  );

  it("drops details of the wrong shape and values of the wrong type", () => {
    expect(pickDetails("persona_forbidden", "nope")).toBeUndefined();
    expect(pickDetails("persona_forbidden", { persona: 3, allowed: "x" })).toBeUndefined();
    expect(pickDetails("evidence_package_stale", { current_version: "3" })).toBeUndefined();
    expect(pickDetails("validation_error", [{ loc: "x" }])).toBeUndefined();
  });
});
