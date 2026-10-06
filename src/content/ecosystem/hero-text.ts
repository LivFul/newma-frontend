import type { CopyBlock } from "../types";

// Text read by assistive technology for the hero graphic (claim C-48): a design-intent description of
// the TA section 1 flow, with the provenance component named as optional.
export const HERO_SVG_TITLE: CopyBlock = Object.freeze({
  id: "hero.svg.title",
  text: "NEWMA ecosystem diagram",
  claims: Object.freeze(["C-48"]),
});

export const HERO_SVG_DESC: CopyBlock = Object.freeze({
  id: "hero.svg.desc",
  text:
    "Six proposed components, each linking to its page. Interface is the input for people and for " +
    "other applications through an API. Agentic Compute and Scientific Review refine work in a " +
    "loop over the Data and Knowledge records, with Provenance and DLT as an optional extension. " +
    "Wet Lab is the validation step.",
  claims: Object.freeze(["C-48"]),
});

const stage = (id: string, text: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze(["C-48"]) });

/** Column headings for the pipeline frame (claim C-48). Decorative; each column still links by part. */
export const HERO_STAGES = Object.freeze({
  input: stage("hero.stage.input", "Input"),
  core: stage("hero.stage.core", "AI core"),
  validation: stage("hero.stage.validation", "Validation"),
});
