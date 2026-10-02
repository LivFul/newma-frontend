import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
} from "../support/demo";

const ROUTE = "/demo/w1-rights";

async function evaluate(page: Page, status: string, purpose: string, action: string) {
  const asset = page.getByLabel("Asset");
  const value = await asset
    .locator("option", { hasText: `(${status})` })
    .first()
    .getAttribute("value");
  await asset.selectOption(value ?? "");
  await page.getByLabel("Purpose").selectOption(purpose);
  await page.getByLabel("Action").selectOption(action);
  await page.getByRole("button", { name: "Evaluate policy" }).click();
  return page.getByRole("region", { name: "Policy decision" });
}

const decision = (page: Page) => page.getByTestId("policy-decision");

test.describe("W1 rights and policy", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w1 allow with recorded reason", async ({ page }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    const card = await evaluate(page, "valid", "research", "retrieve");
    await expect(decision(page)).toHaveText(/allow/);
    await expect(card).toContainText("rights_valid_for_purpose");
    await expect(page.getByRole("list", { name: "Retrieval cache entries" })).toContainText(
      "Active",
    );
  });

  test("w1 expired holds, commercial denies, withdrawal invalidates cache", async ({ page }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    let card = await evaluate(page, "expired", "research", "retrieve");
    await expect(decision(page)).toHaveText(/hold/);
    await expect(card).toContainText("Remediation:");
    card = await evaluate(page, "purpose restricted", "commercial", "commercialise");
    await expect(decision(page)).toHaveText(/deny/);

    await evaluate(page, "valid", "research", "retrieve");
    await expect(decision(page)).toHaveText(/allow/);
    const validRow = page.getByTestId("rights-row-valid");
    await validRow.getByRole("button", { name: /Withdraw consent/ }).click();
    await page.getByLabel("Reason").fill("The fictional community withdrew consent");
    await page.getByRole("button", { name: "Confirm withdrawal" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    // Review Focus 1: no stale allow survives the withdrawal.
    await expect(decision(page)).toHaveCount(0);
    const cache = page.getByRole("list", { name: "Retrieval cache entries" });
    await expect(cache.locator('[data-invalidated="true"]').first()).toContainText("Invalidated");
    await evaluate(page, "withdrawn", "research", "retrieve");
    await expect(decision(page)).toHaveText(/deny/);
    await expect(page.getByRole("region", { name: "Policy decision" })).toContainText(
      "consent_withdrawn",
    );
  });

  test("w1 page has zero axe violations", async ({ page }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await page
      .getByRole("button", { name: /Withdraw consent/ })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
