import { describe, expect, it } from "vitest";
import { PERSONAS, isPersonaId, personaLabel } from "@/lib/personas";

describe("PERSONAS", () => {
  it("lists the eight personas with the exact ids and labels from the P2 contract", () => {
    expect(PERSONAS.map((p) => [p.id, p.label])).toEqual([
      ["community_liaison", "Community liaison"],
      ["scientist", "Scientist"],
      ["data_steward", "Data steward"],
      ["scientific_approver", "Scientific approver"],
      ["wet_lab_cro", "Wet-lab / CRO"],
      ["partner", "Biopharma partner"],
      ["finance", "Finance"],
      ["tenant_admin", "Tenant admin"],
    ]);
  });
  it("gives every persona a non-empty description", () => {
    for (const persona of PERSONAS) expect(persona.description.length).toBeGreaterThan(0);
  });
  it("is frozen", () => {
    expect(Object.isFrozen(PERSONAS)).toBe(true);
  });
});

describe("isPersonaId", () => {
  it("accepts every persona id and rejects anything else", () => {
    for (const persona of PERSONAS) expect(isPersonaId(persona.id)).toBe(true);
    expect(isPersonaId("admin")).toBe(false);
    expect(isPersonaId(undefined)).toBe(false);
    expect(isPersonaId(42)).toBe(false);
    expect(isPersonaId("__proto__")).toBe(false);
  });
});

describe("personaLabel", () => {
  it("returns the label for a known id", () => {
    expect(personaLabel("wet_lab_cro")).toBe("Wet-lab / CRO");
  });
});
