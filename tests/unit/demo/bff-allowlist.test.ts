import { afterEach, describe, expect, it } from "vitest";
import { DemoApiError } from "@/lib/demo/api";
import { withSession } from "@/lib/demo/bff";
import { armBff, bffRequest, disarmBff } from "./bff-helpers";

// Code, the details the backend sends, and what the browser may receive (documented keys only).
const WITH_DETAILS: ReadonlyArray<readonly [string, unknown, unknown]> = [
  ["job_terminal", { state: "FAILED", secret: 1 }, { state: "FAILED" }],
  [
    "validation_error",
    [{ loc: ["body"], msg: "m", type: "t", input: "x" }],
    [{ loc: ["body"], msg: "m", type: "t" }],
  ],
  [
    "persona_forbidden",
    { persona: "scientist", allowed: ["approver"], secret: 1 },
    { persona: "scientist", allowed: ["approver"] },
  ],
  [
    "source_not_cleared",
    { policy_decision_id: "d", reasons: [{ code: "c", message: "m", secret: 1 }], secret: 1 },
    { policy_decision_id: "d", reasons: [{ code: "c", message: "m" }] },
  ],
  ["claim_quarantined", { reason: "ambiguous", secret: 1 }, { reason: "ambiguous" }],
  ["claim_not_approved", { claim_ids: ["c"], secret: 1 }, { claim_ids: ["c"] }],
  [
    "gate_requirements_missing",
    { stage: "H2", missing_requirements: ["r"], secret: 1 },
    { stage: "H2", missing_requirements: ["r"] },
  ],
  [
    "gate_not_decidable",
    { stage: "H2", status: "HOLD", reason: "x", secret: 1 },
    { stage: "H2", status: "HOLD", reason: "x" },
  ],
  ["evidence_package_stale", { current_version: 2, secret: 1 }, { current_version: 2 }],
  ["reconciliation_hold", { open_items: ["S-03"], secret: 1 }, { open_items: ["S-03"] }],
  ["retraining_not_authorized", { reason: "C-04", secret: 1 }, { reason: "C-04" }],
];
// Allow-listed in the contract but carrying no details to the browser.
const DETAILS_DROPPED = ["idempotency_conflict", "invalid_cursor"];
const WITHOUT_DETAILS = [
  "not_found",
  "subject_not_found",
  "asset_not_found",
  "target_not_found",
  "rights_already_withdrawn",
  "claim_already_decided",
  "step_up_mismatch",
  "eln_record_not_ready",
  "disposition_already_recorded",
  "import_not_reviewable",
];

const failWith = (code: string, details: unknown) =>
  withSession(async () => {
    throw new DemoApiError(409, { code, message: `${code} message`, details });
  });

describe("BFF details allowlist (P3 contract)", () => {
  afterEach(disarmBff);

  it.each(WITH_DETAILS)(
    "forwards only the documented details of %s",
    async (code, details, expected) => {
      armBff([]);
      const body = await (await failWith(code, details)(bffRequest("/x"))).json();
      expect(body).toEqual({ code, message: `${code} message`, details: expected });
    },
  );

  it.each([...DETAILS_DROPPED, ...WITHOUT_DETAILS])("drops details for %s", async (code) => {
    armBff([]);
    const response = await failWith(code, { secret: 1 })(bffRequest("/x"));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code, message: `${code} message` });
  });
});
