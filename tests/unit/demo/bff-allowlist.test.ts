import { afterEach, describe, expect, it } from "vitest";
import { DemoApiError } from "@/lib/demo/api";
import { withSession } from "@/lib/demo/bff";
import { armBff, bffRequest, disarmBff } from "./bff-helpers";

const WITH_DETAILS = [
  "job_terminal",
  "validation_error",
  "idempotency_conflict",
  "persona_forbidden",
  "invalid_cursor",
  "source_not_cleared",
  "claim_quarantined",
  "claim_not_approved",
  "gate_requirements_missing",
  "gate_not_decidable",
  "evidence_package_stale",
  "reconciliation_hold",
  "retraining_not_authorized",
];
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

const failWith = (code: string) =>
  withSession(async () => {
    throw new DemoApiError(409, { code, message: `${code} message`, details: { secret: 1 } });
  });

describe("BFF details allowlist (P3 contract)", () => {
  afterEach(disarmBff);

  it.each(WITH_DETAILS)("forwards details for %s", async (code) => {
    armBff([]);
    const body = await (await failWith(code)(bffRequest("/x"))).json();
    expect(body).toEqual({ code, message: `${code} message`, details: { secret: 1 } });
  });

  it.each(WITHOUT_DETAILS)("drops details for %s", async (code) => {
    armBff([]);
    const response = await failWith(code)(bffRequest("/x"));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code, message: `${code} message` });
  });
});
