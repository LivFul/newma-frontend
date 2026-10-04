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

const ROUTE = "/demo/w1-rights";
// next dev compiles the BFF route and re-renders the page on the first withdrawal.
const SLOW_MS = 20_000;

async function evaluate(page: Page, optionText: string, purpose: string, action: string) {
  const asset = page.getByLabel("Asset");
  const value = await asset
    .locator("option", { hasText: optionText })
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
    const card = await evaluate(page, "(valid)", "research", "retrieve");
    await expect(decision(page)).toHaveText(/allow/);
    await expect(card).toContainText("rights_valid_for_purpose");
    await expect(page.getByRole("list", { name: "Retrieval cache entries" })).toContainText(
      "Active",
    );
  });

  test("w1 expired holds, commercial denies, withdrawal invalidates cache", async ({ page }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    let card = await evaluate(page, "(expired)", "research", "retrieve");
    await expect(decision(page)).toHaveText(/hold/);
    await expect(card).toContainText("Remediation:");
    card = await evaluate(page, "(purpose restricted)", "commercial", "commercialise");
    await expect(decision(page)).toHaveText(/deny/);

    // Withdraw the first valid subject; the same subject is evaluated before and after.
    const optionLabel = await page
      .getByLabel("Asset")
      .locator("option", { hasText: "(valid)" })
      .first()
      .textContent();
    const subject = (optionLabel ?? "").replace(/ \(valid\)$/, "");
    await evaluate(page, `${subject} (valid)`, "research", "retrieve");
    await expect(decision(page)).toHaveText(/allow/);
    const validRow = page.getByTestId("rights-row-valid").filter({ hasText: subject });
    await validRow.getByRole("button", { name: /Withdraw consent/ }).click();
    await page.getByLabel("Reason").fill("The fictional community withdrew consent");
    await page.getByRole("button", { name: "Confirm withdrawal" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: SLOW_MS });
    // Review Focus 1: no stale allow survives the withdrawal.
    await expect(decision(page)).toHaveCount(0, { timeout: SLOW_MS });
    const cache = page.getByRole("list", { name: "Retrieval cache entries" });
    await expect(cache.locator('[data-invalidated="true"]').first()).toContainText("Invalidated");
    await evaluate(page, `${subject} (withdrawn)`, "research", "retrieve");
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

  test("w1 grievance indicator and queue", async ({ page, baseURL }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    // A fresh tenant: no indicator and an empty queue.
    await expect(page.getByTestId("grievance-indicator").first()).toHaveText("None");
    await expect(page.getByText("No grievances in the queue.")).toBeVisible();

    const records = (await (await page.request.get("/api/demo/rights/records")).json()) as {
      items: { id: string; status: string; subject_display_name: string }[];
    };
    const record = records.items.find((r) => r.status === "valid") ?? records.items[0];
    const raised = await page.request.post("/api/demo/grievances", {
      headers: { origin: baseURL ?? "" },
      form: {
        rights_record_id: record.id,
        category: "obligation_not_met",
        description: "The promised annual report did not arrive.",
        idempotency_key: `e2e-w1-${Date.now()}`,
      },
      maxRedirects: 0,
    });
    expect(raised.status()).toBe(303);

    await page.waitForLoadState("networkidle");
    await switchPersona(page, "data_steward");
    await page.goto(ROUTE);
    const row = page
      .getByTestId("rights-row-valid")
      .filter({ hasText: record.subject_display_name });
    await expect(row.getByTestId("grievance-indicator")).toHaveText("1 open");
    const queued = page.getByTestId("grievance-row");
    await expect(queued).toHaveCount(1);
    await expect(queued).toContainText("Open");
    await queued.getByRole("button", { name: /Acknowledge/ }).click();
    await expect(queued).toContainText("Acknowledged", { timeout: SLOW_MS });
    await expect(row.getByTestId("grievance-indicator")).toHaveText("None", { timeout: SLOW_MS });

    // Persona check: a partner sees the notice and a forced list request is refused.
    await page.waitForLoadState("networkidle");
    await switchPersona(page, "partner");
    await page.goto(ROUTE);
    await expect(page.getByText(/Only .*Data steward.* can do this/).first()).toBeVisible();
    const forced = await page.request.get("/api/demo/grievances");
    expect(forced.status()).toBe(403);
    expect((await forced.json()).code).toBe("persona_forbidden");
  });
});
