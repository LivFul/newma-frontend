import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
} from "../support/demo";

const ROUTE = "/demo/w3-agent";
// Prompt §3.6: the full W3 sequence finishes within 3 minutes at demo speed.
const W3_BUDGET_MS = 180_000;

async function ask(page: Page, budget: string) {
  await page.goto(ROUTE);
  await page.getByLabel("Budget (demo credits)").fill(budget);
  await page.getByRole("button", { name: "Ask the simulated agent" }).click();
  await page.waitForURL(/\/demo\/w3-agent\?query=/);
}

const status = (page: Page) => page.getByTestId("agent-status");

test.describe("W3 scripted agent", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w3 full sequence within 3 minutes", async ({ page }) => {
    test.setTimeout(W3_BUDGET_MS + 60_000);
    await signIn(page, "scientist");
    const start = Date.now();
    await ask(page, "60");
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expect
      .poll(() => status(page).getAttribute("data-status"), {
        timeout: W3_BUDGET_MS,
        intervals: [1000],
      })
      .toBe("completed");
    expect(Date.now() - start).toBeLessThanOrEqual(W3_BUDGET_MS);
    await expect(
      page.getByRole("list", { name: "Ranked hypotheses" }).getByRole("listitem").first(),
    ).toContainText("Synthetic");
    await expect(page.getByText("Retried after simulated failure")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Submit as work package in W5" })).toBeVisible();
    await expect(page.getByText("Simulated workflow engine").first()).toBeVisible();
    await expect(page.getByText("Simulated compute").first()).toBeVisible();
  });

  test("w3 over-budget held and restricted evidence withheld", async ({ page }) => {
    await signIn(page, "scientist");
    await ask(page, "10");
    await expect
      .poll(() => status(page).getAttribute("data-status"), { timeout: 30_000 })
      .toBe("held");
    const hold = page.getByRole("region", { name: "Budget hold" });
    await expect(hold).toContainText("Held");
    await expect(hold).toContainText("No simulated jobs were submitted.");
    await expect(
      page.getByRole("list", { name: "Withheld subjects" }).getByTestId("withheld").first(),
    ).toContainText("withheld");
    await expect(page.getByRole("button", { name: /approve/i })).toHaveCount(0);
  });

  test("w3 page has zero axe violations", async ({ page }) => {
    await signIn(page, "scientist");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await ask(page, "10");
    await expect
      .poll(() => status(page).getAttribute("data-status"), { timeout: 30_000 })
      .toBe("held");
    await expectNoAxeViolations(page);
  });
});
