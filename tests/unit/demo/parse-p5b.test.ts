import { describe, expect, it } from "vitest";
import { parseConfigUpdate } from "@/lib/demo/parse-config";
import {
  parseCharterEdit,
  parseQuotaEdit,
  parseThresholds,
  THRESHOLD_LIMITS,
} from "@/lib/demo/parse-campaigns";
import {
  MAX_FIELD_PATHS,
  nullWithheldValues,
  parseEvidenceQuery,
  parseExportRequest,
  parseLimitQuery,
  sanitiseExport,
} from "@/lib/demo/parse-exports";
import {
  GRIEVANCE_REDIRECT_ERRORS,
  grievanceFromForm,
  parseGrievanceListQuery,
  parseGrievanceRequest,
} from "@/lib/demo/parse-grievances";

const ASSET = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const exportBody = {
  asset_id: ASSET,
  purpose: "research",
  recipient: "Partner Biologics A — fictional",
  expires_at: "2030-01-01T00:00:00Z",
};

describe("parseExportRequest", () => {
  it("accepts a valid request, mints a key and drops unknown keys", () => {
    const parsed = parseExportRequest({ ...exportBody, stage: "H1", evil: 1 });
    expect(parsed).toMatchObject({ ...exportBody, stage: "H1" });
    expect(parsed).not.toHaveProperty("evil");
    expect(typeof parsed?.idempotency_key).toBe("string");
  });

  it("keeps a client idempotency key and rejects a malformed one", () => {
    expect(parseExportRequest({ ...exportBody, idempotency_key: "k-1" })?.idempotency_key).toBe(
      "k-1",
    );
    expect(parseExportRequest({ ...exportBody, idempotency_key: "bad key!" })).toBeUndefined();
  });

  it.each([
    ["a recipient without fictional", { recipient: "Partner Biologics A" }],
    ["a recipient shorter than 3 characters", { recipient: "ab" }],
    ["a recipient longer than 120 characters", { recipient: `${"x".repeat(115)} fictional` }],
    ["an unknown purpose", { purpose: "model_training" }],
    ["an unknown stage", { stage: "H9" }],
    ["an expiry that is not UTC RFC 3339", { expires_at: "2030-01-01" }],
    ["an expiry with an offset", { expires_at: "2030-01-01T00:00:00+02:00" }],
    ["an impossible expiry", { expires_at: "2030-02-31T00:00:00Z" }],
    ["an unsafe asset id", { asset_id: "../x" }],
    [
      "a 41st field path",
      { field_paths: Array.from({ length: MAX_FIELD_PATHS + 1 }, (_, i) => `s.f${i}`) },
    ],
    ["a non-string field path", { field_paths: [1] }],
  ])("rejects %s", (_name, override) => {
    expect(parseExportRequest({ ...exportBody, ...override })).toBeUndefined();
  });

  it("accepts the recipient word in any case and up to 40 paths", () => {
    const paths = Array.from({ length: MAX_FIELD_PATHS }, (_, i) => `s.f${i}`);
    expect(
      parseExportRequest({ ...exportBody, recipient: "Org B - FICTIONAL", field_paths: paths }),
    ).toBeDefined();
  });

  it("rejects a non-object body", () => {
    expect(parseExportRequest(null)).toBeUndefined();
    expect(parseExportRequest([])).toBeUndefined();
  });
});

describe("query parsers", () => {
  it("validates stage and purpose for the evidence read", () => {
    expect(parseEvidenceQuery(new URLSearchParams("stage=H1&purpose=commercial"))).toEqual({
      stage: "H1",
      purpose: "commercial",
    });
    expect(parseEvidenceQuery(new URLSearchParams(""))).toEqual({});
    expect(parseEvidenceQuery(new URLSearchParams("stage=H9"))).toBeUndefined();
    expect(parseEvidenceQuery(new URLSearchParams("purpose=disclosure"))).toBeUndefined();
  });

  it("validates the export list limit 1-100", () => {
    expect(parseLimitQuery(new URLSearchParams("limit=25"))).toEqual({ limit: "25" });
    expect(parseLimitQuery(new URLSearchParams(""))).toEqual({});
    for (const bad of ["0", "101", "x", "1.5", "-1"]) {
      expect(parseLimitQuery(new URLSearchParams(`limit=${bad}`))).toBeUndefined();
    }
  });

  it("validates the grievance list filters", () => {
    expect(
      parseGrievanceListQuery(new URLSearchParams("status=open&rights_record_id=r-1")),
    ).toEqual({ status: "open", rights_record_id: "r-1" });
    expect(parseGrievanceListQuery(new URLSearchParams("status=closed"))).toBeUndefined();
    expect(parseGrievanceListQuery(new URLSearchParams("rights_record_id=../x"))).toBeUndefined();
  });
});

describe("withheld values never pass (Review Focus 2)", () => {
  const hostile = (status: "disclosed" | "withheld") => ({
    path: "s.f",
    section: "s",
    label: "F",
    status,
    value: "SECRET",
    withheld_reason: null,
    synthetic: true,
  });

  it("nulls the value of a withheld row inside an evidence pack", () => {
    const pack = { fields: [hostile("withheld"), hostile("disclosed")], other: 1 };
    const clean = nullWithheldValues(pack) as { fields: { value: unknown }[]; other: number };
    expect(clean.fields.map((f) => f.value)).toEqual([null, "SECRET"]);
    expect(clean.other).toBe(1);
    expect(pack.fields[0].value).toBe("SECRET");
  });

  it("nulls every row of an export's withheld list even when it claims disclosed", () => {
    const record = {
      status: "active",
      disclosed: [hostile("disclosed"), hostile("withheld")],
      withheld: [hostile("disclosed")],
    };
    const clean = sanitiseExport(record) as {
      disclosed: { value: unknown }[];
      withheld: { value: unknown }[];
    };
    expect(clean.disclosed.map((f) => f.value)).toEqual(["SECRET", null]);
    expect(clean.withheld.map((f) => f.value)).toEqual([null]);
  });

  it.each(["expired", "suspended"])("drops the body of a %s export", (status) => {
    const clean = sanitiseExport({ status, disclosed: [hostile("disclosed")], withheld: [] });
    expect(clean).toMatchObject({ status, disclosed: [] });
  });

  it("passes non-record input through untouched", () => {
    expect(nullWithheldValues(null)).toBeNull();
    expect(sanitiseExport("x")).toBe("x");
  });
});

describe("W9 charter and quota bodies", () => {
  const thresholds = { potency_um_max: 10, replicates_min: 3, controls_required: true };

  it("parses a closed thresholds object and drops other keys", () => {
    expect(parseThresholds({ ...thresholds, note: "n", extra: 1 })).toEqual({
      ...thresholds,
      note: "n",
    });
    expect(parseThresholds(thresholds)).toEqual(thresholds);
  });

  it.each([
    ["zero potency", { potency_um_max: 0 }],
    ["potency above the limit", { potency_um_max: THRESHOLD_LIMITS.potencyMax + 1 }],
    ["non-numeric potency", { potency_um_max: "10" }],
    ["fractional replicates", { replicates_min: 2.5 }],
    ["replicates below 1", { replicates_min: 0 }],
    ["replicates above 10", { replicates_min: 11 }],
    ["a non-boolean controls flag", { controls_required: "yes" }],
    ["an over-long note", { note: "n".repeat(201) }],
  ])("rejects thresholds with %s", (_name, override) => {
    expect(parseThresholds({ ...thresholds, ...override })).toBeUndefined();
  });

  it("parses a charter edit with a stable key", () => {
    const parsed = parseCharterEdit({
      thresholds,
      change_reason: "tighten the replicate count",
      expected_version: 2,
      idempotency_key: "k",
      extra: 1,
    });
    expect(parsed).toEqual({
      thresholds,
      change_reason: "tighten the replicate count",
      expected_version: 2,
      idempotency_key: "k",
    });
  });

  it.each([
    ["a short reason", { change_reason: "ab" }],
    ["a long reason", { change_reason: "r".repeat(301) }],
    ["a missing version", { expected_version: undefined }],
    ["a zero version", { expected_version: 0 }],
    ["bad thresholds", { thresholds: { ...thresholds, replicates_min: 0 } }],
  ])("rejects a charter edit with %s", (_name, override) => {
    const base = { thresholds, change_reason: "valid reason", expected_version: 1 };
    expect(parseCharterEdit({ ...base, ...override })).toBeUndefined();
  });

  it("parses the quota edit 0-1,000,000", () => {
    expect(parseQuotaEdit({ credit_quota: 0, reason: "freeze", extra: 1 })).toEqual({
      credit_quota: 0,
      reason: "freeze",
    });
    expect(parseQuotaEdit({ credit_quota: 1_000_000, reason: "max" })).toBeDefined();
    for (const bad of [-1, 1_000_001, 1.5, "10", null]) {
      expect(parseQuotaEdit({ credit_quota: bad, reason: "valid" })).toBeUndefined();
    }
    expect(parseQuotaEdit({ credit_quota: 5, reason: "x" })).toBeUndefined();
  });
});

describe("W10 grievance bodies", () => {
  const valid = {
    rights_record_id: "rec-1",
    category: "obligation_not_met",
    description: "The promised report did not arrive.",
    idempotency_key: "k-1",
  };

  it("parses a grievance and drops unknown keys", () => {
    expect(parseGrievanceRequest({ ...valid, obligation_id: "ob-1", extra: 1 })).toEqual({
      ...valid,
      obligation_id: "ob-1",
    });
  });

  it.each([
    ["a description of 9 characters", { description: "too short" }],
    ["a whitespace-only description", { description: "          " }],
    ["a 1001-character description", { description: "d".repeat(1001) }],
    ["an unknown category", { category: "rude" }],
    ["an unsafe record id", { rights_record_id: "a/b" }],
    ["an unsafe obligation id", { obligation_id: "a b" }],
  ])("rejects %s", (_name, override) => {
    expect(parseGrievanceRequest({ ...valid, ...override })).toBeUndefined();
  });

  it("builds the request body from form fields and treats an empty obligation as absent", () => {
    const form = new URLSearchParams({
      rights_record_id: "rec-1",
      obligation_id: "",
      category: "other",
      description: "A written concern about the agreement.",
      idempotency_key: "k-2",
    });
    expect(grievanceFromForm(form)).toEqual({
      rights_record_id: "rec-1",
      category: "other",
      description: "A written concern about the agreement.",
      idempotency_key: "k-2",
    });
  });

  it("lists exactly the allow-listed redirect error codes", () => {
    expect([...GRIEVANCE_REDIRECT_ERRORS]).toEqual([
      "persona_forbidden",
      "validation_error",
      "not_found",
      "idempotency_conflict",
      "upstream_error",
    ]);
  });
});

describe("parseConfigUpdate (demo speed)", () => {
  it("accepts 1-10 or null", () => {
    expect(parseConfigUpdate({ speed_factor: 4, extra: 1 })).toEqual({ speed_factor: 4 });
    expect(parseConfigUpdate({ speed_factor: null })).toEqual({ speed_factor: null });
    expect(parseConfigUpdate({ speed_factor: 1 })).toBeDefined();
    expect(parseConfigUpdate({ speed_factor: 10 })).toBeDefined();
  });

  it.each([0, 11, -1, "4", Number.NaN, undefined])("rejects %s", (bad) => {
    expect(parseConfigUpdate({ speed_factor: bad })).toBeUndefined();
  });
});
