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
    "Six proposed components, each linking to its page. Data & Knowledge and Provenance & DLT form " +
    "the records core. Agentic Compute, Scientific Review and Wet Lab loop around that core. " +
    "Interface sits outside the loop for people and for other applications through an API. " +
    "Provenance & DLT is an optional extension.",
  claims: Object.freeze(["C-48"]),
});
