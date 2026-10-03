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

const ROUTE = "/demo/w9-campaign";
// next dev compiles the BFF routes on first use and re-renders the page after each write.
const SLOW_MS = 20_000;

const saveThresholds = (page: Page) => page.getByRole("button", { name: "Save thresholds" });
const setQuota = (page: Page) => page.getByRole("button", { name: "Set quota" });
const probe = (page: Page) =>
  page.getByRole("button", { name: /Start a simulated screening job, 10 demo credits/ });
const usageJobs = (page: Page) => page.getByTestId("usage-job");
const status = (page: Page, text: string | RegExp) =>
  page.getByRole("status").filter({ hasText: text });

async function figure(page: Page, label: string): Promise<number> {
  const panel = page.getByRole("region", { name: "Credit quota" });
  const value = await panel
    .locator("dt", { hasText: label })
    .locator("xpath=following-sibling::dd")
    .innerText();
  return Number.parseInt(value, 10);
}

async function editThresholds(page: Page, replicates: string, reason: string) {
  await page.getByLabel("Minimum replicates").fill(replicates);
  await page.getByLabel("Reason for the change").fill(reason);
  await saveThresholds(page).click();
}

async function applyQuota(page: Page, quota: number, reason: string) {
  await page.getByLabel("Credit quota (demo credits)").fill(String(quota));
  await page.getByLabel("Reason for the quota").fill(reason);
  await setQuota(page).click();
  await expect(status(page, `Quota set to ${quota} demo credits`)).toBeVisible({
    timeout: SLOW_MS,
  });
}

test.describe("W9 campaign charter and quotas", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w9 threshold edit after selection creates a new protocol version", async ({ page }) => {
    await signIn(page, "tenant_admin");
    await page.goto(ROUTE);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    await expect(page.getByTestId("lock-badge")).toContainText("Locked");
    await expect(page.getByTestId("lock-badge")).toContainText("4 candidates");
    const original = await page.getByLabel("Minimum replicates").inputValue();
    const changed = original === "5" ? "6" : "5";

    await editThresholds(page, changed, "Tighten the replicate count");
    await expect(status(page, "Protocol version 2 created, version 1 is unchanged")).toBeVisible({
      timeout: SLOW_MS,
    });
    const v2 = page.locator('[data-testid="version-row"][data-version="2"]');
    const v1 = page.locator('[data-testid="version-row"][data-version="1"]');
    await expect(v2).toContainText("Open", { timeout: SLOW_MS });
    await expect(v1).toContainText("Locked");
    await expect(v1).toContainText(`≥ ${original} replicates`);
    await expect(v2).toContainText(`≥ ${changed} replicates`);

    const second = changed === "6" ? "7" : "6";
    await editThresholds(page, second, "Second tweak on the open version");
    await expect(status(page, "Open version 2 updated (revision 2)")).toBeVisible({
      timeout: SLOW_MS,
    });
    await expect(v1).toContainText(`≥ ${original} replicates`);

    await page.getByLabel("Reason for the change").fill("Resubmit the same thresholds");
    await saveThresholds(page).click();
    await expect(status(page, "No change")).toBeVisible({ timeout: SLOW_MS });
  });

  test("w9 quota exhausted refuses the job with a documented code", async ({ page, baseURL }) => {
    await signIn(page, "tenant_admin");
    await page.goto(ROUTE);
    const committed = await figure(page, "Committed");
    await applyQuota(page, committed, "Match what is committed");
    await expect(page.getByTestId("quota-meter")).toContainText("Exhausted", { timeout: SLOW_MS });

    const before = await usageJobs(page).count();
    await probe(page).click();
    const refusal = page.getByRole("alert").filter({ hasText: "quota_exhausted" });
    await expect(refusal).toBeVisible({ timeout: SLOW_MS });
    await expect(refusal).toContainText("Remaining: 0");
    await expect(refusal).toContainText("Requested: 10");
    await expect(refusal).toContainText("No job was created");
    await expect(usageJobs(page)).toHaveCount(before);

    await applyQuota(page, committed + 100, "Raise the quota again");
    await probe(page).click();
    await expect(status(page, "Job started")).toBeVisible({ timeout: SLOW_MS });
    await expect(usageJobs(page).filter({ hasText: "reserved" }).first()).toBeVisible({
      timeout: SLOW_MS,
    });
    expect(await usageJobs(page).count()).toBeGreaterThan(before);

    // Persona check: a scientist sees both forms disabled and a forced PUT is refused.
    const campaignId = (
      (await (await page.request.get("/api/demo/campaigns")).json()) as { items: { id: string }[] }
    ).items[0].id;
    await page.waitForLoadState("networkidle");
    await switchPersona(page, "scientist");
    await page.goto(ROUTE);
    await expect(saveThresholds(page)).toHaveAttribute("aria-disabled", "true");
    await expect(setQuota(page)).toHaveAttribute("aria-disabled", "true");
    const forced = await page.request.put(`/api/demo/campaigns/${campaignId}/quota`, {
      headers: { origin: baseURL ?? "" },
      data: { credit_quota: 5, reason: "forced by a scientist" },
    });
    expect(forced.status()).toBe(403);
    expect((await forced.json()).code).toBe("persona_forbidden");
  });

  test("w9 page has zero axe violations", async ({ page }) => {
    await signIn(page, "tenant_admin");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
  });
});
