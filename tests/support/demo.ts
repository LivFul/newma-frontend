// Playwright helpers for the demo spine (P2 Task 6). The @needs-backend specs talk to a real API
// through the BFF and only run when DEMO_E2E=1 (see README "Demo end-to-end run").
import type { Page } from "@playwright/test";
import { test } from "./test";

export const DEMO_ROUTES = ["/demo", "/demo/jobs"] as const;

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
