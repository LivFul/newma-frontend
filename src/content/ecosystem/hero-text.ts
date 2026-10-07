import type { CopyBlock } from "../types";

export const HERO_SVG_TITLE: CopyBlock = Object.freeze({
  id: "hero.svg.title",
  text: "NEWMA ecosystem diagram",
  claims: Object.freeze(["C-48"]),
});

export const HERO_SVG_DESC: CopyBlock = Object.freeze({
  id: "hero.svg.desc",
  text: "NEWMA\u2019s proposed discovery pathway connects authorized medicinal plant knowledge, computational hypotheses, material confirmation, approved experiments and reviewed results. Evidence checkpoints guide advancement, while access restrictions protect knowledge and materials outside the authorized research scope.",
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
