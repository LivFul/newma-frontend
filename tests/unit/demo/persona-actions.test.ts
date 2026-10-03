import { describe, expect, it } from "vitest";
import { PERSONA_ACTIONS, canAct } from "@/lib/demo/persona-actions";
import { PERSONAS } from "@/lib/personas";

describe("persona actions (UI hints mirroring the contract persona column)", () => {
  it("matches the contract matrix", () => {
    expect(PERSONA_ACTIONS).toEqual({
      create_rights_record: ["community_liaison", "data_steward"],
      withdraw_rights: ["community_liaison"],
      ingest_source: ["data_steward"],
      decide_claim: ["data_steward"],
      publish_release: ["data_steward"],
      run_agent_query: ["scientist"],
      decide_gate: ["scientific_approver"],
      create_work_package: ["scientist"],
      import_assay: ["wet_lab_cro"],
      record_disposition: ["scientist"],
      accept_import: ["scientist"],
      edit_eln_record: ["wet_lab_cro"],
      view_reconciliation: ["scientist", "wet_lab_cro", "data_steward"],
    });
  });

  it("answers per persona", () => {
    expect(canAct("scientific_approver", "decide_gate")).toBe(true);
    expect(canAct("scientist", "decide_gate")).toBe(false);
    expect(PERSONAS.filter((p) => canAct(p.id, "withdraw_rights")).map((p) => p.id)).toEqual([
      "community_liaison",
    ]);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(PERSONA_ACTIONS)).toBe(true);
  });
});
