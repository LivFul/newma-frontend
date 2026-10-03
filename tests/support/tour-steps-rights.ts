// Tour driver, steps 1 to 5 and 14: homepage, rights (W1), custodian view (W10), curation (W2).
import type { Page } from "@playwright/test";
import { EVIDENCE_LABEL_TEXT } from "../../src/lib/evidence";
import { banner, DEMO_BANNER_TEXT } from "./demo";
import { SLOW_MS, type StepRun } from "./tour-context";
import { expect } from "./test";

const W1 = "/demo/w1-rights";
const W2 = "/demo/w2-evidence";
const W10 = "/demo/w10-custodian";
const CONCERN = "The promised yearly report did not arrive this year.";

const decision = (page: Page) => page.getByTestId("policy-decision");

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

export const home: StepRun = async (page) => {
  // The homepage is a plain link outside /demo; its demo sign-in link must exist and resolve.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('a[href="/access"]').first()).toBeAttached();
  expect((await page.request.get("/access")).status()).toBe(200);
  // The visitor signs in from the homepage; this session is already signed in.
  await page.goto("/demo");
  await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
};

export const w1Evaluate: StepRun = async (page) => {
  let card = await evaluate(page, "(valid)", "research", "retrieve");
  await expect(decision(page)).toHaveText(/allow/);
  await expect(card).toContainText("rights_valid_for_purpose");
  await expect(page.getByRole("list", { name: "Retrieval cache entries" })).toContainText("Active");
  card = await evaluate(page, "(expired)", "research", "retrieve");
  await expect(decision(page)).toHaveText(/hold/);
  await expect(card).toContainText("Remediation:");
};

export const w10Concern: StepRun = async (page) => {
  const rows = page.getByTestId("obligation-row");
  await expect(rows.first()).toBeVisible();
  await expect(rows.filter({ hasNotText: /Done|Due|Late/ })).toHaveCount(0);
  const article = page.getByRole("article").first();
  await article.locator("summary").click();
  await article.getByLabel("Tell us what happened").fill(CONCERN);
  await page.getByRole("button", { name: "Send concern" }).first().click();
  await page.waitForURL(/\?raised=/, { timeout: SLOW_MS });
  await expect(page.getByRole("status").filter({ hasText: "Your concern was sent" })).toBeVisible();
};

export const w1Acknowledge: StepRun = async (page) => {
  await expect(page.getByTestId("grievance-indicator").filter({ hasText: "1 open" })).toHaveCount(
    1,
  );
  const queued = page.getByTestId("grievance-row");
  await expect(queued).toHaveCount(1);
  await expect(queued).toContainText(CONCERN);
  await queued.getByRole("button", { name: /Acknowledge/ }).click();
  await expect(queued).toContainText("Acknowledged", { timeout: SLOW_MS });
};

export const w2Curation: StepRun = async (page) => {
  const sources = page.getByRole("list", { name: "Source records" }).getByRole("listitem");
  const cleared = sources.filter({ hasText: "cleared" }).filter({ hasNotText: "uncleared" });
  await cleared.getByRole("button", { name: /^Ingest/ }).click();
  await expect(cleared.getByRole("status")).toContainText("extracted");
  await page
    .locator('[data-status="pending_review"]')
    .first()
    .getByRole("button", { name: /Review claim/ })
    .click();
  await page.getByLabel("Rationale").fill("Statement matches the synthetic source table");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Publish curated release" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Release version" })).toContainText(
    "Release version 1",
  );
  const legend = page.getByRole("list", { name: "Evidence label legend" });
  for (const text of Object.values(EVIDENCE_LABEL_TEXT)) await expect(legend).toContainText(text);
  const uncleared = sources.filter({ hasText: "uncleared" });
  await uncleared.getByRole("button", { name: /^Ingest/ }).click();
  const alert = uncleared.getByRole("alert");
  await expect(alert).toContainText("Rejected before ingestion");
  await expect(alert).toContainText("No claims were created.");
};

export const w1Withdraw: StepRun = async (page, ctx) => {
  const subject = ctx.governingSubject;
  expect(subject, "step 12 recorded the governing subject").toBeTruthy();
  await evaluate(page, `${subject} (valid)`, "research", "retrieve");
  await expect(decision(page)).toHaveText(/allow/);
  const row = page.getByTestId("rights-row-valid").filter({ hasText: subject ?? "" });
  await row.getByRole("button", { name: /Withdraw consent/ }).click();
  await page.getByLabel("Reason").fill("The fictional community withdrew consent");
  await page.getByRole("button", { name: "Confirm withdrawal" }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: SLOW_MS });
  await expect(
    page.getByTestId("rights-row-withdrawn").filter({ hasText: subject ?? "" }),
  ).toHaveCount(1, { timeout: SLOW_MS });
  const cache = page.getByRole("list", { name: "Retrieval cache entries" });
  await expect(cache.locator('[data-invalidated="true"]').first()).toContainText("Invalidated", {
    timeout: SLOW_MS,
  });
};

export const RIGHTS_ROUTES = { W1, W2, W10 } as const;
