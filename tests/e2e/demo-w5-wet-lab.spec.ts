import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
  switchPersona,
} from "../support/demo";
import { openCandidate, signGate } from "../support/w4";

const ROUTE = "/demo/w5-wet-lab";
const RESULTS_TIMEOUT_MS = 120_000;

async function createPackage(page: Page, scenario: "standard" | "missing_sample"): Promise<string> {
  await page.goto(ROUTE);
  await page.getByLabel("Scenario").selectOption(scenario);
  await page.getByRole("button", { name: "Submit work package" }).click();
  await page.waitForURL(/\/demo\/w5-wet-lab\/[^/?]+$/);
  return page.url();
}

const status = (page: Page) => page.getByTestId("work-package-status");
const loop = (page: Page) => page.getByTestId("loop-diagram");

async function waitForResults(page: Page) {
  await expect
    .poll(() => status(page).getAttribute("data-status"), {
      timeout: RESULTS_TIMEOUT_MS,
      intervals: [1000],
    })
    .toMatch(/results_available|in_review/);
}

async function importResults(page: Page) {
  await page.getByRole("button", { name: "Import results" }).click();
  await expect(page.getByTestId("observation-count")).toBeVisible();
}

async function accept(page: Page) {
  await page.getByRole("button", { name: "Accept results" }).click();
  await page.getByLabel("Rationale").fill("Reconciled synthetic replicates are consistent");
  await page.getByRole("button", { name: "Confirm acceptance" }).click();
  await expect(page.getByText("Accepted by NEWMA scientist").first()).toBeVisible();
}

test.describe("W5 closed wet-lab loop", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w5 work package to H2 pass and reviewed update", async ({ page }) => {
    test.setTimeout(RESULTS_TIMEOUT_MS + 120_000);
    await signIn(page, "scientist");
    const url = await createPackage(page, "standard");
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expect(page.getByText("Mock ELN").first()).toBeVisible();
    await waitForResults(page);
    await switchPersona(page, "wet_lab_cro");
    await importResults(page);
    await expect(page.getByTestId("reconciliation-status")).toHaveText("reconciled");
    await switchPersona(page, "scientist");
    await accept(page);
    await expect(page.getByRole("link", { name: /H2 is now decidable/ })).toBeVisible();

    await switchPersona(page, "scientific_approver");
    const displayId = await openCandidate(page, 1);
    const { dialog } = await signGate(page, "H2", displayId);
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-stage="H2"]')).toHaveAttribute("data-status", "PASS");

    await page.goto(url);
    await expect(loop(page)).toHaveAttribute("data-assay-state", "confirmed_hit");
    await expect(loop(page)).toHaveAttribute(
      "data-learning-state",
      /reviewed_update|prioritization|retraining_review/,
    );
    await page.goto("/demo/w4-gates");
    await expect(
      page
        .locator("[data-rank]")
        .getByTestId("last-reviewed-update")
        .filter({ hasNotText: "none" }),
    ).not.toHaveCount(0);
  });

  test("w5 missing sample hold, duplicate import, revision re-review, blocked retraining", async ({
    page,
  }) => {
    test.setTimeout(RESULTS_TIMEOUT_MS + 120_000);
    await signIn(page, "scientist");
    await createPackage(page, "missing_sample");
    await waitForResults(page);
    await switchPersona(page, "wet_lab_cro");
    await importResults(page);
    const count = await page.getByTestId("observation-count").textContent();
    await page.getByRole("button", { name: "Import results" }).click();
    await expect(page.getByText("Duplicate import — no new observations")).toBeVisible();
    await expect(page.getByTestId("observation-count")).toHaveText(count ?? "");
    await expect(page.getByTestId("reconciliation-status")).toHaveText("HOLD");

    await switchPersona(page, "scientist");
    const held = page.locator("tr[data-status]:not([data-status=matched])").first();
    await held.getByRole("button", { name: /Record disposition/ }).click();
    await page
      .getByRole("dialog")
      .getByLabel("Rationale")
      .fill("Sample S-03 was not shipped; excluded");
    await page.getByRole("dialog").getByRole("button", { name: "Record disposition" }).click();
    await expect(page.getByTestId("reconciliation-status")).toHaveText("reconciled");
    await accept(page);

    await switchPersona(page, "wet_lab_cro");
    await page.getByRole("button", { name: "Edit Mock ELN record (correct a value)" }).click();
    await expect(page.getByText("New revision 2 — re-review required").first()).toBeVisible();
    await page.getByRole("button", { name: "Import results" }).click();
    await expect(page.getByText(/re-review required/).first()).toBeVisible();

    const proposal = page.getByTestId("retraining-proposal").first();
    await expect(proposal).toContainText("Blocked pending separate authorization (IP C-04)");
    await proposal.getByRole("button", { name: "Execute retraining" }).click();
    await expect(proposal.getByRole("alert")).toContainText("retraining_not_authorized");
  });

  test("w5 pages have zero axe violations", async ({ page }) => {
    test.setTimeout(RESULTS_TIMEOUT_MS);
    await signIn(page, "scientist");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await createPackage(page, "standard");
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
  });
});
