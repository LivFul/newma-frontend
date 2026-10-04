import { describe, expect, it } from "vitest";
import { PERSONA_ACTIONS, canAct } from "@/lib/demo/persona-actions";

describe("P5b persona actions (A-P5B-09)", () => {
  it("matches the contract persona column", () => {
    expect(PERSONA_ACTIONS).toMatchObject({
      export_evidence: ["partner"],
      view_exports: ["partner", "tenant_admin"],
      edit_charter: ["tenant_admin"],
      edit_quota: ["tenant_admin"],
      view_custodian: ["community_liaison", "data_steward", "tenant_admin"],
      view_grievances: ["community_liaison", "data_steward", "tenant_admin"],
      raise_grievance: ["community_liaison"],
      acknowledge_grievance: ["data_steward"],
    });
  });

  it("answers per persona", () => {
    expect(canAct("partner", "export_evidence")).toBe(true);
    expect(canAct("tenant_admin", "export_evidence")).toBe(false);
    expect(canAct("tenant_admin", "view_exports")).toBe(true);
    expect(canAct("scientist", "edit_quota")).toBe(false);
    expect(canAct("data_steward", "acknowledge_grievance")).toBe(true);
    expect(canAct("community_liaison", "acknowledge_grievance")).toBe(false);
  });
});
