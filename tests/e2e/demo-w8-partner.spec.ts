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

const ROUTE = "/demo/w8-partner";
// next dev compiles the BFF routes on first use and re-renders the page after each write.
const SLOW_MS = 20_000;

const issue = (page: Page) => page.getByRole("button", { name: "Issue export" });
const issued = (page: Page) => page.getByRole("region", { name: "Export issued" });
const refused = (page: Page) => page.getByRole("alert", { name: "Export refused" });
const registerRows = (page: Page) => page.getByTestId("export-row");

/** The rank-1 asset id from the asset picker link (the rank-1 asset has a released H1 stage). */
async function rankOneAssetId(page: Page): Promise<string> {
  const href = await page.locator('[data-rank="1"] a').getAttribute("href");
  return new URL(href ?? "", "http://localhost").searchParams.get("asset") ?? "";
}

function exportBody(assetId: string) {
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
  return {
    asset_id: assetId,
    purpose: "research",
    recipient: "Partner Biologics A — fictional",
    expires_at: expires,
  };
}

test.describe("W8 partner portal and controlled export", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w8 partner evidence pack and export with withheld field", async ({ page }) => {
    await signIn(page, "partner");
    await page.goto(ROUTE);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expect(
      page.getByRole("navigation", { name: "Stages" }).getByRole("link", { name: /H1/ }),
    ).toContainText("released");
    const location = page.getByTestId("field-withheld").filter({ hasText: "Collection location" });
    await expect(location).toContainText("withheld");
    await expect(location).toContainText("restricted_field");

    await issue(page).click();
    const card = issued(page);
    await expect(card).toBeVisible({ timeout: SLOW_MS });
    await expect(card).toContainText("Active");
    expect(await card.getByTestId("field-disclosed").count()).toBeGreaterThanOrEqual(1);
    await expect(
      card.getByTestId("field-withheld").filter({ hasText: "Collection location" }),
    ).toContainText("restricted_field");
    await expect(card).toContainText("Demo signature, not production key");

    await card.getByRole("link", { name: "Show signed events" }).click();
    await page.waitForURL(/\/demo\/w6-provenance\/policy_decision\//);
    await expect(page.locator('[data-event-type="export.recorded"]')).toHaveCount(1);

    await page.goto(ROUTE);
    await expect(registerRows(page)).toHaveCount(1);
    await expect(registerRows(page).first()).toHaveAttribute("data-status", "active");
  });

  test("w8 export after consent withdrawn is denied with reasons", async ({ page, baseURL }) => {
    await signIn(page, "partner");
    await page.goto(ROUTE);
    const assetId = await rankOneAssetId(page);
    await issue(page).click();
    await expect(issued(page)).toBeVisible({ timeout: SLOW_MS });

    const evidence = await page.request.get(`/api/demo/assets/${assetId}/evidence`);
    const recordId = ((await evidence.json()) as { policy: { rights_record_ids: string[] } }).policy
      .rights_record_ids[0];
    await switchPersona(page, "community_liaison");
    const withdrawn = await page.request.post(`/api/demo/rights/records/${recordId}/withdraw`, {
      headers: { origin: baseURL ?? "" },
      data: { reason: "The fictional community withdrew consent" },
    });
    expect(withdrawn.ok()).toBe(true);

    await switchPersona(page, "partner");
    await page.goto(ROUTE);
    await expect(registerRows(page)).toHaveCount(1);
    await expect(registerRows(page).first()).toHaveAttribute("data-status", "suspended");
    await expect(registerRows(page).first()).toContainText("Suspended");
    await expect(
      page.getByTestId("field-withheld").filter({ hasText: "consent_withdrawn" }).first(),
    ).toBeVisible();

    await issue(page).click();
    await expect(refused(page)).toContainText("consent_withdrawn", { timeout: SLOW_MS });
    await expect(refused(page)).toContainText("No export was created");
    await page.reload();
    await expect(registerRows(page)).toHaveCount(1);
    await expectNoAxeViolations(page);
  });

  test("w8 other personas: tenant admin sees a disabled form, scientist is refused", async ({
    page,
    baseURL,
  }) => {
    await signIn(page, "tenant_admin");
    await page.goto(ROUTE);
    await expect(issue(page)).toHaveAttribute("aria-disabled", "true");
    const assetId = await rankOneAssetId(page);

    await switchPersona(page, "scientist");
    await page.goto(ROUTE);
    await expect(page.getByRole("note").first()).toContainText("Biopharma partner");
    await expect(page.getByRole("alert").first()).toContainText("persona_forbidden");
    const forced = await page.request.post("/api/demo/exports", {
      headers: { origin: baseURL ?? "" },
      data: exportBody(assetId),
    });
    expect(forced.status()).toBe(403);
    expect((await forced.json()).code).toBe("persona_forbidden");
  });

  test("w8 page has zero axe violations with the pack and the issued export", async ({ page }) => {
    await signIn(page, "partner");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    await issue(page).click();
    await expect(issued(page)).toBeVisible({ timeout: SLOW_MS });
    await expectNoAxeViolations(page);
  });
});
