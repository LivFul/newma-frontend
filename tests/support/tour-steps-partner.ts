// Tour driver, steps 12, 13, 15 and 16: partner export (W8), settlement (W7), refusal, quota (W9).
import type { Page } from "@playwright/test";
import { SLOW_MS, type StepRun } from "./tour-context";
import { expect } from "./test";
import { W7_ROUTE, bff } from "./w7";

const W8 = "/demo/w8-partner";
const W9 = "/demo/w9-campaign";
const issue = (page: Page) => page.getByRole("button", { name: "Issue export" });
const status = (page: Page, text: string | RegExp) =>
  page.getByRole("status").filter({ hasText: text });

async function rankOnePack(page: Page): Promise<void> {
  await page.goto(W8);
  const href = await page.locator('[data-rank="1"] a').getAttribute("href");
  await page.goto(href ?? W8);
}

export const w8Export: StepRun = async (page, ctx) => {
  await rankOnePack(page);
  const governing = await page.getByText(/^Governing records:/).innerText();
  ctx.governingSubject = governing
    .replace(/^Governing records:\s*/, "")
    .split(",")[0]
    ?.trim();
  expect(ctx.governingSubject, "the pack names a governing record").toBeTruthy();
  await issue(page).click();
  const card = page.getByRole("region", { name: "Export issued" });
  await expect(card).toBeVisible({ timeout: SLOW_MS });
  await expect(card).toContainText("Active");
  await expect(
    card.getByTestId("field-withheld").filter({ hasText: "Collection location" }),
  ).toContainText("restricted_field");
  await expect(card).toContainText("Demo signature, not production key");
};

export const w7Settlement: StepRun = async (page) => {
  const list = await bff(page, "GET", "/api/demo/settlements");
  const seeded = list.body.items.find((s: { display_id: string }) => s.display_id === "DEMO-S-001");
  expect(seeded, "the seeded settlement exists").toBeTruthy();
  await page.goto(`${W7_ROUTE}/settlements/${seeded.id}`);
  const row = (state: string) =>
    page.locator(`[data-testid="receipt-row"][data-status="${state}"]`);
  await expect(page.locator('#state-heading [data-state="disputed"]')).toBeVisible();
  await expect(row("disputed")).toContainText("held — not payable");
  await expect(page.getByText("No payout: nothing has been posted")).toBeVisible();

  await page.goto(W7_ROUTE);
  const toggle = page.getByRole("switch", { name: "Simulate chain outage (demo)" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("outage-status")).toContainText(
    "Chain outage simulated — new anchors stay pending",
  );
  await expect(page.getByText("Optional, simulated").first()).toBeVisible();
  // Leave the demo as it was found: later steps must not inherit the outage.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
};

export const w8Refusal: StepRun = async (page) => {
  await rankOnePack(page);
  const rows = page.getByTestId("export-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-status", "suspended");
  await issue(page).click();
  const refused = page.getByRole("alert", { name: "Export refused" });
  await expect(refused).toContainText("consent_withdrawn", { timeout: SLOW_MS });
  await expect(refused).toContainText("No export was created");
};

async function committed(page: Page): Promise<number> {
  const panel = page.getByRole("region", { name: "Credit quota" });
  const value = await panel
    .locator("dt", { hasText: "Committed" })
    .locator("xpath=following-sibling::dd")
    .innerText();
  return Number.parseInt(value, 10);
}

export const w9Quota: StepRun = async (page) => {
  await page.goto(W9);
  const original = await page.getByLabel("Minimum replicates").inputValue();
  await page.getByLabel("Minimum replicates").fill(original === "5" ? "6" : "5");
  await page.getByLabel("Reason for the change").fill("Tighten the replicate count");
  await page.getByRole("button", { name: "Save thresholds" }).click();
  await expect(status(page, "Protocol version 2 created, version 1 is unchanged")).toBeVisible({
    timeout: SLOW_MS,
  });

  const amount = await committed(page);
  await page.getByLabel("Credit quota (demo credits)").fill(String(amount));
  await page.getByLabel("Reason for the quota").fill("Match what is committed");
  await page.getByRole("button", { name: "Set quota" }).click();
  await expect(status(page, `Quota set to ${amount} demo credits`)).toBeVisible({
    timeout: SLOW_MS,
  });
  await page
    .getByRole("button", { name: /Start a simulated screening job, 10 demo credits/ })
    .click();
  const refusal = page.getByRole("alert").filter({ hasText: "quota_exhausted" });
  await expect(refusal).toBeVisible({ timeout: SLOW_MS });
  await expect(refusal).toContainText("No job was created");
};
