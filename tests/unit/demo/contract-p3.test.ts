import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ASSET_TYPES, POLICY_ACTIONS, PURPOSES, SUBJECT_TYPES } from "@/lib/demo/types";

// P3: each workflow switches to the generated contract once its D-item spec is pinned.
const root = path.resolve(__dirname, "../../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const schema = read("src/lib/api/generated/schema.d.ts");
const types = read("src/lib/demo/types.ts");
const contractPaths = read("src/lib/demo/contract-paths.ts");

const enumOf = (schemaName: string, field: string): string[] => {
  const block = schema.slice(schema.indexOf(`        ${schemaName}: {`));
  const start = block.indexOf(`            ${field}`);
  const line =
    block
      .slice(start)
      .split("\n")
      .find((l) => l.includes("|") || /: "/.test(l)) ?? "";
  return [...line.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
};

describe("P3 contract — D-11 (W1)", () => {
  it("pins the W1 paths", () => {
    for (const p of [
      "/v1/rights/records",
      "/v1/rights/records/{record_id}",
      "/v1/rights/records/{record_id}/withdraw",
      "/v1/policy/evaluate",
      "/v1/retrieval/cache",
    ]) {
      expect(schema).toContain(`"${p}": {`);
    }
    expect(contractPaths).not.toMatch(/W1Paths/);
  });

  it("derives W1 types from the generated schema", () => {
    for (const name of [
      "RightsRecordOut",
      "CacheEntryOut",
      "PolicyDecisionOut",
      "PolicyEvaluateRequest",
      "WithdrawResult",
      "PolicyReasonOut",
    ]) {
      expect(types).toContain(`Schemas["${name}"]`);
    }
  });

  it("keeps the W1 vocabularies equal to the schema enums", () => {
    expect([...PURPOSES]).toEqual(enumOf("PolicyEvaluateRequest", "purpose"));
    expect([...POLICY_ACTIONS]).toEqual(enumOf("PolicyEvaluateRequest", "action"));
    expect([...ASSET_TYPES]).toEqual(enumOf("PolicyEvaluateRequest", "asset_type"));
    expect([...SUBJECT_TYPES]).toEqual(enumOf("RightsRecordCreate", "subject_type"));
  });
});

describe("P3 contract — D-12 (W2)", () => {
  it("pins the W2 paths and drops the hand-written block", () => {
    for (const p of [
      "/v1/taxa",
      "/v1/compounds",
      "/v1/observations",
      "/v1/curation/source-records",
      "/v1/ingestion/runs",
      "/v1/curation/queue",
      "/v1/curation/claims/{claim_id}/decisions",
      "/v1/curation/releases",
    ]) {
      expect(schema).toContain(`"${p}": {`);
    }
    expect(contractPaths).not.toMatch(/W2Paths/);
  });

  it("derives W2 types from the generated schema", () => {
    for (const name of [
      "TaxonOut",
      "CompoundOut",
      "ObservationOut",
      "EvidenceRefOut",
      "SourceRecordOut",
      "ClaimOut",
      "IngestionRunOut",
      "ReleaseOut",
    ]) {
      expect(types).toContain(`Schemas["${name}"]`);
    }
  });
});

describe("P3 contract — D-13 (W3)", () => {
  it("pins exactly the two agent paths (ENT-05) and drops the hand-written block", () => {
    const agentPaths = [...schema.matchAll(/^ {4}"(\/v1\/agent[^"]*)": \{/gm)].map((m) => m[1]);
    expect(agentPaths.sort()).toEqual(["/v1/agent/queries", "/v1/agent/queries/{agent_query_id}"]);
    expect(contractPaths).not.toMatch(/W3Paths/);
  });

  it("derives W3 types from the generated schema", () => {
    for (const name of [
      "AgentQueryOut",
      "AgentQueryCreate",
      "HypothesisOut",
      "WorkPackageProposal",
    ]) {
      expect(types).toContain(`Schemas["${name}"]`);
    }
  });
});

describe("P3 contract — D-14 (W4)", () => {
  it("pins the W4 paths and drops the hand-written block", () => {
    for (const p of [
      "/v1/candidates",
      "/v1/candidates/{candidate_id}/gates",
      "/v1/candidates/{candidate_id}/evidence-packages",
      "/v1/candidates/{candidate_id}/evidence-packages/diff",
      "/v1/gates/{gate_id}/decisions",
    ]) {
      expect(schema).toContain(`"${p}": {`);
    }
    expect(contractPaths).not.toMatch(/W4Paths/);
  });

  it("derives W4 types from the generated schema", () => {
    for (const name of [
      "CandidateOut",
      "GateTracker",
      "GateOut",
      "GateDecisionOut",
      "GateDecisionRequest",
      "EvidenceDiffOut",
      "EvidencePackageSummary",
    ]) {
      expect(types).toContain(`Schemas["${name}"]`);
    }
  });

  it("keeps the gate vocabularies equal to the schema enums", async () => {
    const { GATE_STAGES } = await import("@/lib/demo/types");
    expect([...GATE_STAGES]).toEqual(enumOf("GateOut", "stage"));
  });
});
