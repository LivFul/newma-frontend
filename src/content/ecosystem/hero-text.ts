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
    "Six proposed components drawn as stacked slabs, each linking to its page. Interface passes " +
    "requests to Agentic Compute, which sends results to Scientific Review and work to Wet Lab; " +
    "Wet Lab results return to Scientific Review. Every component relies on Data & Knowledge for " +
    "authoritative records. Provenance & DLT is an optional extension.",
  claims: Object.freeze(["C-48"]),
});
