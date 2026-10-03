import type { CopyBlock } from "../types";

export type Persona = Readonly<{ role: CopyBlock; need: CopyBlock }>;

const persona = (id: string, role: string, need: string): Persona =>
  Object.freeze({
    role: Object.freeze({ id: `${id}.role`, text: role, claims: Object.freeze(["C-25"]) }),
    need: Object.freeze({ id: `${id}.need`, text: need, claims: Object.freeze(["C-25"]) }),
  });

// Paraphrased from PRD 2 (Target Personas). Role names are job roles, never organisations.
export const PERSONAS: readonly Persona[] = Object.freeze([
  persona(
    "home.persona.computational",
    "Computational biologist",
    "Needs reliable chemical identities, reproducible runs and a clear reason a candidate merits testing.",
  ),
  persona(
    "home.persona.wetlab",
    "Wet-lab scientist or CRO",
    "Needs unambiguous materials, protocols and controls, so accepted observations link to the right batch and hypothesis.",
  ),
  persona(
    "home.persona.liaison",
    "Indigenous community liaison",
    "Needs understandable consent, control over disclosure and visible benefit obligations, without exposing confidential knowledge.",
  ),
  persona(
    "home.persona.biopharma",
    "Biopharma partner",
    "Needs secure discovery access and traceable evidence to judge scientific and commercial readiness.",
  ),
]);
