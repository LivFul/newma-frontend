// Sprint-review demo script, step 5 (docs/DEMO_SCRIPT.md): the closed wet-lab loop with a missing
// sample, reconciliation, acceptance, a corrected ELN value and the blocked retraining proposal.
import type { Page } from "@playwright/test";
import { switchPersona } from "./demo";
import { expect } from "./test";
import type { TourContext } from "./tour-context";
import { STEP_RUNS } from "./tour-driver";

/** The CRO corrects a value in the Mock ELN: revision 2 needs re-review, retraining stays blocked. */
async function correctElnValue(page: Page, ctx: TourContext): Promise<void> {
  await switchPersona(page, "wet_lab_cro");
  await page.goto(ctx.packageUrl ?? "/demo/w5-wet-lab");
  await page.getByRole("button", { name: "Edit Mock ELN record (correct a value)" }).click();
  await expect(page.getByText("New revision 2 — re-review required").first()).toBeVisible();
  await page.getByRole("button", { name: "Import results" }).click();
  await expect(page.getByText(/re-review required/).first()).toBeVisible();
  const proposal = page.getByTestId("retraining-proposal").first();
  await expect(proposal).toContainText("Blocked pending separate authorization");
  await proposal.getByRole("button", { name: "Execute retraining" }).click();
  await expect(proposal.getByRole("alert")).toContainText("retraining_not_authorized");
}

/** Step 5: scientist submits the package, CRO imports, scientist reconciles and accepts, CRO edits. */
export async function wetLab(page: Page, ctx: TourContext): Promise<void> {
  await switchPersona(page, "scientist");
  await STEP_RUNS["w5-package"](page, ctx);
  await switchPersona(page, "wet_lab_cro");
  await STEP_RUNS["w5-import"](page, ctx);
  await switchPersona(page, "scientist");
  await STEP_RUNS["w5-accept"](page, ctx);
  await correctElnValue(page, ctx);
}
