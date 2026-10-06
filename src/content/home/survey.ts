import type { CopyBlock } from "../types";

// The numbered "Sheet 1 / 6" marker on the route stack. It labels the illustrative hero diagram, so it
// shares that diagram's claim (C-48).
const label = (id: string, text: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze(["C-48"]) });

export const SURVEY_LABELS = Object.freeze({
  sheet: label("survey.sheet", "Sheet"),
});
