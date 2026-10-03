import type { CopyBlock } from "../types";

// About LivFul (assumption A-P4-04). Every block is a [Recommendation]: BC contains no LivFul mission
// or vision statement (IP C-23), so these are re-voiced from BC 1.1 to 1.2 and PRD 1.1 and approved at
// CP-2. The exact source sentence for each lives in docs/CONTENT_MATRIX.md.
const block = (id: string, text: string, claim: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([claim]) });

export const MISSION_HEADING: CopyBlock = Object.freeze({
  id: "about.mission.heading",
  text: "Mission",
  claims: Object.freeze([]),
});
export const VISION_HEADING: CopyBlock = Object.freeze({
  id: "about.vision.heading",
  text: "Vision",
  claims: Object.freeze([]),
});
export const APPROACH_HEADING: CopyBlock = Object.freeze({
  id: "about.approach.heading",
  text: "Approach",
  claims: Object.freeze([]),
});

export const MISSION = block(
  "about.mission",
  "LivFul exists to enable research teams to turn authorized knowledge and authenticated materials into reproducible, experimentally supported decisions, preserving attribution, confidentiality and benefit obligations.",
  "C-26",
);

export const VISION = block(
  "about.vision",
  "A rights-aware evidence system, scientist-supervised computation and an assay feedback loop, built on shared infrastructure.",
  "C-27",
);

export const APPROACH: readonly CopyBlock[] = Object.freeze([
  block(
    "about.approach.evidence",
    "A rights-aware evidence system connects botanical knowledge to authenticated materials and curated structures.",
    "C-28",
  ),
  block(
    "about.approach.computation",
    "Scientist-supervised computation prioritizes the experiments worth running.",
    "C-28",
  ),
  block(
    "about.approach.feedback",
    "An assay feedback loop records confirmed activity, failures and development liabilities.",
    "C-28",
  ),
]);

export const APPROACH_NOTE = block(
  "about.approach.note",
  "These are design goals for a proposed platform, not results achieved.",
  "C-28",
);
