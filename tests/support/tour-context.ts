// State the tour driver carries between steps (the same things a visitor remembers).
import type { Page } from "@playwright/test";

export type TourContext = {
  /** The W3 "Submit as work package in W5" link (step 6) used by step 8. */
  w5Href?: string;
  /** The work package page created in step 8, used by steps 9 and 10. */
  packageUrl?: string;
  /** The H1 gate signed in step 7, verified in step 11. */
  gateId?: string;
  /** The subject named under "Governing records" on the W8 page (step 12), withdrawn in step 14. */
  governingSubject?: string;
};

export type StepRun = (page: Page, ctx: TourContext) => Promise<void>;

// Dev servers compile routes and re-render after writes; production is far quicker.
export const SLOW_MS = 30_000;
// Simulated jobs at demo speed 8 (A-P5B-22).
export const JOB_TIMEOUT_MS = 150_000;
