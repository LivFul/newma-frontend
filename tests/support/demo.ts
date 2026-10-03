// Playwright helpers for the demo spine (P2 Task 6). The @needs-backend specs talk to a real API
// through the BFF and only run when DEMO_E2E=1 (see README "Demo end-to-end run").
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./test";

export const WORKFLOW_ROUTES = [
  "/demo/w1-rights",
  "/demo/w2-evidence",
  "/demo/w3-agent",
  "/demo/w4-gates",
  "/demo/w5-wet-lab",
  "/demo/w6-provenance",
  "/demo/w7-settlement",
] as const;

// P5b workflow pages (W8-W10).
export const P5B_ROUTES = ["/demo/w8-partner", "/demo/w9-campaign", "/demo/w10-custodian"] as const;

// The guided-tour entry (D-20); the dock and its steps are driven by tests/e2e/demo-tour.spec.ts.
export const TOUR_ROUTE = "/demo/tour";

export const DEMO_ROUTES = [
  "/demo",
  "/demo/jobs",
  ...WORKFLOW_ROUTES,
  ...P5B_ROUTES,
  TOUR_ROUTE,
] as const;

export const PERSONA_LABELS = {
  community_liaison: "Community liaison",
  scientist: "Scientist",
  data_steward: "Data steward",
  scientific_approver: "Scientific approver",
  wet_lab_cro: "Wet-lab / CRO",
  partner: "Biopharma partner",
  finance: "Finance",
  tenant_admin: "Tenant admin",
} as const;

export type PersonaId = keyof typeof PERSONA_LABELS;

export { DEMO_BANNER_TEXT } from "../../src/lib/demo/banner";

export const needsBackend = () =>
  test.skip(!process.env.DEMO_E2E, "Set DEMO_E2E=1 with a local API behind the BFF to run.");

/** Signs in through the /access form; the browser never sees the session id. */
export async function signIn(page: Page, persona: PersonaId): Promise<void> {
  await page.goto("/access");
  await page.getByRole("button", { name: PERSONA_LABELS[persona] }).click();
  await page.waitForURL("**/demo");
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/access");
}

export const currentPersona = (page: Page) => page.getByTestId("current-persona");

/** Switches persona through the header select and waits for the refreshed header. */
export async function switchPersona(page: Page, persona: PersonaId): Promise<void> {
  await page.getByLabel("Persona").selectOption(persona);
  await expect(currentPersona(page)).toHaveText(PERSONA_LABELS[persona]);
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Zero axe violations on the current page (no serious ones, and none at all). */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

export const banner = (page: Page) => page.getByRole("note", { name: "Demo notice" });
