// Playwright helpers for W4 gate signing, shared by the W4 and W6 specs.
import type { Page } from "@playwright/test";

export const W4_ROUTE = "/demo/w4-gates";

export async function openCandidate(page: Page, rank: number): Promise<string> {
  await page.goto(W4_ROUTE);
  const link = page.locator(`[data-rank="${rank}"]`).getByRole("link");
  const displayId = (await link.textContent())?.trim() ?? "";
  await link.click();
  await page.waitForURL(/\/demo\/w4-gates\/[^/?]+/);
  return displayId;
}

export async function signGate(
  page: Page,
  stage: string,
  displayId: string,
  opts: { doubleClick?: boolean } = {},
) {
  const gate = page.locator(`[data-stage="${stage}"]`);
  await gate.getByRole("button", { name: `Sign ${stage} decision` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Rationale").fill(`Signed ${stage} in the synthetic demo`);
  await dialog.getByLabel(/Demo sign-in step-up/).fill(displayId);
  const submit = dialog.getByRole("button", { name: "Sign decision" });
  if (opts.doubleClick) await submit.dblclick();
  else await submit.click();
  return { dialog, gateId: await gate.getAttribute("data-gate-id") };
}
