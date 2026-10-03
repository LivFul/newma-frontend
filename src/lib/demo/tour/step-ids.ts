// Step ids only: the light dock bootstrap validates stored progress against this list without
// loading the step texts (the texts ship with the lazy panel). steps.ts must follow this order.
export const TOUR_STEP_IDS = [
  "home",
  "w1-evaluate",
  "w10-concern",
  "w1-acknowledge",
  "w2-curation",
  "w3-agent",
  "w4-gates",
  "w5-package",
  "w5-import",
  "w5-accept",
  "w6-verify",
  "w8-export",
  "w7-settlement",
  "w1-withdraw",
  "w8-refusal",
  "w9-quota",
] as const;

export type TourStepId = (typeof TOUR_STEP_IDS)[number];
