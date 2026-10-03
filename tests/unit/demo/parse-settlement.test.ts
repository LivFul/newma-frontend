import { describe, expect, it } from "vitest";
import {
  parseApproval,
  parseAudit,
  parseCredentialCheck,
  parseDeliver,
  parseDispute,
  parseLicenseDecision,
  parseLicenseRequest,
  parseOutage,
  parseRationaleRequest,
  parseReceipt,
  parseResolve,
  parseSchedule,
  parseSettlementCreate,
} from "@/lib/demo/parse-settlement";

const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const SHA = "a".repeat(64);
const long = "x".repeat(501);

describe("W7 body guards (undefined means reject with 422)", () => {
  describe("parseLicenseRequest", () => {
    const valid = {
      agreement_id: ID,
      licensee_organization_id: ID,
      purpose: "research",
      scope_summary: "Illustrative scope",
      term_months: 12,
      credential_ref: "DEMO-CRED-VALID-001",
      idempotency_key: "k-1",
    };
    it("accepts a valid body and drops unknown keys", () => {
      expect(parseLicenseRequest({ ...valid, extra: 1 })).toEqual(valid);
    });
    it("makes the credential optional and mints a key when absent", () => {
      const rest = Object.fromEntries(
        Object.entries(valid).filter(([k]) => k !== "credential_ref" && k !== "idempotency_key"),
      );
      const parsed = parseLicenseRequest(rest);
      expect(parsed).toBeDefined();
      expect(parsed).not.toHaveProperty("credential_ref");
      expect(parsed?.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    });
    it.each([
      { purpose: "disclosure" },
      { purpose: "model_training" },
      { scope_summary: "ab" },
      { scope_summary: long },
      { term_months: 0 },
      { term_months: 121 },
      { term_months: 1.5 },
      { term_months: true },
      { agreement_id: "nope" },
      { licensee_organization_id: 5 },
      { credential_ref: "has space" },
      { idempotency_key: "bad key!" },
    ])("rejects %j", (patch) => {
      expect(parseLicenseRequest({ ...valid, ...patch })).toBeUndefined();
    });
    it("rejects a non-object body", () => {
      expect(parseLicenseRequest(null)).toBeUndefined();
      expect(parseLicenseRequest([])).toBeUndefined();
    });
  });

  it("parseCredentialCheck keeps only the key and mints one when absent", () => {
    expect(parseCredentialCheck({ idempotency_key: "k", x: 1 })).toEqual({ idempotency_key: "k" });
    expect(parseCredentialCheck({})?.idempotency_key).toBeTruthy();
    expect(parseCredentialCheck({ idempotency_key: "bad key" })).toBeUndefined();
    expect(parseCredentialCheck("x")).toBeUndefined();
  });

  describe("parseLicenseDecision", () => {
    it("accepts approve and deny with a trimmed rationale", () => {
      expect(
        parseLicenseDecision({
          decision: "approve",
          rationale: "  Scope fits  ",
          idempotency_key: "k",
        }),
      ).toEqual({ decision: "approve", rationale: "Scope fits", idempotency_key: "k" });
      expect(
        parseLicenseDecision({ decision: "deny", rationale: "No", idempotency_key: "k" }),
      ).toBeUndefined();
      expect(
        parseLicenseDecision({ decision: "deny", rationale: "Nope", idempotency_key: "k" }),
      ).toBeDefined();
    });
    it.each([{ decision: "maybe" }, { rationale: long }, { rationale: "  a " }])(
      "rejects %j",
      (patch) => {
        expect(
          parseLicenseDecision({
            decision: "approve",
            rationale: "Fine",
            idempotency_key: "k",
            ...patch,
          }),
        ).toBeUndefined();
      },
    );
  });

  it("parseSettlementCreate needs a license uuid", () => {
    expect(parseSettlementCreate({ license_id: ID, idempotency_key: "k" })).toEqual({
      license_id: ID,
      idempotency_key: "k",
    });
    expect(parseSettlementCreate({ license_id: "x" })).toBeUndefined();
  });

  describe("parseReceipt", () => {
    const valid = { external_ref: "DEMO-E2E-001", amount_demo_credits: 600, idempotency_key: "k" };
    it("accepts a valid receipt", () => {
      expect(parseReceipt(valid)).toEqual(valid);
      expect(parseReceipt({ ...valid, amount_demo_credits: 100000000 })).toBeDefined();
    });
    it.each([
      { amount_demo_credits: 600.5 },
      { amount_demo_credits: -1 },
      { amount_demo_credits: 0 },
      { amount_demo_credits: true },
      { amount_demo_credits: "600" },
      { amount_demo_credits: 100000001 },
      { amount_demo_credits: Number.MAX_SAFE_INTEGER + 1 },
      { external_ref: "" },
      { external_ref: "has space" },
      { external_ref: "x".repeat(61) },
      { idempotency_key: "k".repeat(129) },
    ])("rejects %j", (patch) => {
      expect(parseReceipt({ ...valid, ...patch })).toBeUndefined();
    });
  });

  it("parseDispute and parseResolve need a receipt uuid and a 3-500 text", () => {
    expect(
      parseDispute({ receipt_id: ID, reason: "Amount mismatch", idempotency_key: "k" }),
    ).toEqual({
      receipt_id: ID,
      reason: "Amount mismatch",
      idempotency_key: "k",
    });
    expect(parseDispute({ receipt_id: ID, reason: "no" })).toBeUndefined();
    expect(parseDispute({ receipt_id: "x", reason: "Valid reason" })).toBeUndefined();
    expect(parseResolve({ receipt_id: ID, rationale: "Reinstated", idempotency_key: "k" })).toEqual(
      {
        receipt_id: ID,
        rationale: "Reinstated",
        idempotency_key: "k",
      },
    );
    expect(parseResolve({ receipt_id: ID, rationale: long })).toBeUndefined();
  });

  it("parseRationaleRequest validates the rationale", () => {
    expect(parseRationaleRequest({ rationale: "Evidence ok", idempotency_key: "k" })).toEqual({
      rationale: "Evidence ok",
      idempotency_key: "k",
    });
    expect(parseRationaleRequest({ rationale: "" })).toBeUndefined();
  });

  it("parseApproval needs a 64-hex calculation hash", () => {
    expect(
      parseApproval({ calculation_sha256: SHA, rationale: "Checked", idempotency_key: "k" }),
    ).toEqual({ calculation_sha256: SHA, rationale: "Checked", idempotency_key: "k" });
    expect(parseApproval({ calculation_sha256: "abc", rationale: "Checked" })).toBeUndefined();
    expect(
      parseApproval({ calculation_sha256: SHA.toUpperCase(), rationale: "Checked" }),
    ).toBeUndefined();
  });

  it("parseAudit needs a real boolean for anchor", () => {
    expect(parseAudit({ anchor: true, idempotency_key: "k" })).toEqual({
      anchor: true,
      idempotency_key: "k",
    });
    expect(parseAudit({ anchor: false, idempotency_key: "k" })?.anchor).toBe(false);
    expect(parseAudit({ anchor: "true" })).toBeUndefined();
    expect(parseAudit({})).toBeUndefined();
  });

  it("parseSchedule needs an ISO date and parseDeliver a 3-500 note", () => {
    expect(parseSchedule({ scheduled_for: "2026-11-02", idempotency_key: "k" })).toEqual({
      scheduled_for: "2026-11-02",
      idempotency_key: "k",
    });
    expect(parseSchedule({ scheduled_for: "2026-13-02" })).toBeUndefined();
    expect(parseDeliver({ evidence_note: "Photos filed", idempotency_key: "k" })).toEqual({
      evidence_note: "Photos filed",
      idempotency_key: "k",
    });
    expect(parseDeliver({ evidence_note: "x" })).toBeUndefined();
  });

  it("parseOutage takes a boolean and no idempotency key", () => {
    expect(parseOutage({ active: true, extra: 1 })).toEqual({ active: true });
    expect(parseOutage({ active: false })).toEqual({ active: false });
    expect(parseOutage({ active: "yes" })).toBeUndefined();
    expect(parseOutage({})).toBeUndefined();
  });
});
