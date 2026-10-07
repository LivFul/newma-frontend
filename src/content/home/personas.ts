import type { CopyBlock } from "../types";

export type Persona = Readonly<{ role: CopyBlock; need: CopyBlock }>;

const persona = (id: string, role: string, need: string): Persona =>
  Object.freeze({
    role: Object.freeze({ id: `${id}.role`, text: role, claims: Object.freeze(["C-25"]) }),
    need: Object.freeze({ id: `${id}.need`, text: need, claims: Object.freeze(["C-25"]) }),
  });

export const PERSONAS: readonly Persona[] = Object.freeze([
  persona(
    "home.persona.computational",
    "Computational biologists",
    "Evaluate candidates through curated chemical identities, reproducible analyses and a clear rationale for experimental testing.",
  ),
  persona(
    "home.persona.wetlab",
    "Laboratory scientists and research partners",
    "Work from defined materials, protocols and controls, with results linked to the correct sample and research question.",
  ),
  persona(
    "home.persona.knowledge",
    "Knowledge holders and authorized community representatives",
    "Review permitted uses, disclosure restrictions and benefit obligations while protecting confidential knowledge.",
  ),
  persona(
    "home.persona.biopharma",
    "Biopharma partners",
    "Assess research opportunities through traceable evidence, documented use rights and a clear account of what remains to be established.",
  ),
  persona(
    "home.persona.admin",
    "Administrators and reviewers",
    "Oversee access, review requests, place work on hold and examine the records behind research decisions.",
  ),
]);
