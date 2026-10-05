import type { CopyBlock } from "../types";

// Map labels for the survey-sheet hero. They annotate the illustrative hero diagram, so they share its
// claim (C-48). The "Not to scale" label is the on-sheet note that the terrain is illustrative. "Farm to patient"
// is LivFul's positioning phrase and needs its own register row in the copy pass.
const label = (id: string, text: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze(["C-48"]) });

export const SURVEY_LABELS = Object.freeze({
  field: label("survey.field", "Field"),
  patient: label("survey.patient", "Patient"),
  legendHeading: label("survey.legend.heading", "Map key"),
  route: label("survey.legend.route", "Farm to patient"),
  contours: label("survey.legend.contours", "Contours"),
  restricted: label("survey.legend.restricted", "Restricted parcel"),
  scale: label("survey.legend.scale", "Not to scale"),
  sheetRef: label("survey.sheet.ref", "NEWMA field sheet"),
  sheet: label("survey.sheet", "Sheet"),
});
