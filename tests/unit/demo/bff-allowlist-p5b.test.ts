import { afterEach, describe, expect, it } from "vitest";
import { DemoApiError } from "@/lib/demo/api";
import { withSession } from "@/lib/demo/bff";
import { pickDetails } from "@/lib/demo/error-details";
import { P5B_PICKERS } from "@/lib/demo/error-details-p5b";
import { armBff, bffRequest, disarmBff } from "./bff-helpers";

const extra = { secret: "x", trace: "y" };
const reasons = [{ code: "consent_withdrawn", message: "m", remediation: null, secret: 1 }];

const CASES: ReadonlyArray<readonly [string, unknown, unknown]> = [
  [
    "quota_exhausted",
    { credit_quota: 100, committed: 95, requested: 10, remaining: 5, ...extra },
    { credit_quota: 100, committed: 95, requested: 10, remaining: 5 },
  ],
  [
    "export_denied",
    { policy_decision_id: "d", decision: "deny", reasons, ...extra },
    {
      policy_decision_id: "d",
      decision: "deny",
      reasons: [{ code: "consent_withdrawn", message: "m", remediation: null }],
    },
  ],
  [
    "export_held",
    { policy_decision_id: "d", decision: "hold", reasons, ...extra },
    {
      policy_decision_id: "d",
      decision: "hold",
      reasons: [{ code: "consent_withdrawn", message: "m", remediation: null }],
    },
  ],
  ["export_expiry_invalid", { max_days: 90, ...extra }, { max_days: 90 }],
  ["charter_version_conflict", { current_version: 3, ...extra }, { current_version: 3 }],
];

describe("P5b error details pickers (Review Focus: no echoed input)", () => {
  it("is the five documented codes", () => {
    expect(Object.keys(P5B_PICKERS).sort()).toEqual(
      [
        "charter_version_conflict",
        "export_denied",
        "export_expiry_invalid",
        "export_held",
        "quota_exhausted",
      ].sort(),
    );
  });

  it.each(CASES)("%s keeps documented keys and drops everything else", (code, input, expected) => {
    expect(pickDetails(code, input)).toEqual(expected);
  });

  it.each(CASES.map(([code]) => [code]))("%s drops details on a shape mismatch", (code) => {
    expect(pickDetails(code, { unrelated: true })).toBeUndefined();
    expect(pickDetails(code, "text")).toBeUndefined();
    expect(pickDetails(code, null)).toBeUndefined();
  });

  it("rejects a decision that is not allow, hold or deny", () => {
    expect(
      pickDetails("export_denied", { policy_decision_id: "d", decision: "maybe", reasons }),
    ).toBeUndefined();
  });

  it("keeps the earlier P3 pickers working", () => {
    expect(pickDetails("job_terminal", { state: "FAILED", ...extra })).toEqual({ state: "FAILED" });
  });
});

describe("BFF forwards P5b details through the pickers", () => {
  afterEach(disarmBff);
  const failWith = (code: string, details: unknown, status = 409) =>
    withSession(async () => {
      throw new DemoApiError(status, { code, message: `${code} message`, details });
    });

  it.each(CASES)(
    "%s reaches the browser with only the documented keys",
    async (code, input, out) => {
      armBff([]);
      const response = await failWith(code, input)(bffRequest("/x"));
      expect(await response.json()).toEqual({ code, message: `${code} message`, details: out });
    },
  );

  it("forwards grievance_already_acknowledged without details", async () => {
    armBff([]);
    const response = await failWith("grievance_already_acknowledged", { secret: 1 })(
      bffRequest("/x"),
    );
    expect(await response.json()).toEqual({
      code: "grievance_already_acknowledged",
      message: "grievance_already_acknowledged message",
    });
  });
});
