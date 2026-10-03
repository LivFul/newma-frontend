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

const ROUTE = "/demo/w10-custodian";
// next dev compiles the BFF route on first use and re-renders the page after each post.
const SLOW_MS = 20_000;

const concerns = (page: Page) => page.getByTestId("agreement-grievance");
const sendConcern = (page: Page) => page.getByRole("button", { name: "Send concern" });

/** Opens the first agreement's form and fills the description (an empty one is allowed). */
async function openForm(page: Page, description: string, promiseText?: string) {
  const article = page.getByRole("article").first();
  await article.locator("summary").click();
  if (promiseText) {
    await article
      .getByLabel("Which promise is it about? (optional)")
      .selectOption({ label: promiseText });
  }
  await article.getByLabel("Tell us what happened").fill(description);
  return article;
}

test.describe("W10 custodian view", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w10 plain-language view and grievance reaches the rights queue", async ({ page }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    const articles = page.getByRole("article");
    expect(await articles.count()).toBeGreaterThanOrEqual(1);
    await expect(articles.first().getByRole("list", { name: "What is allowed" })).toBeVisible();
    // Every obligation shows a status in words; the seed has done, due and late promises.
    const rows = page.getByTestId("obligation-row");
    await expect(rows.filter({ hasText: "Done" }).first()).toBeVisible();
    await expect(rows.filter({ hasText: "Due" }).first()).toBeVisible();
    await expect(rows.filter({ hasText: "Late" }).first()).toBeVisible();

    const article = await openForm(page, "The promised yearly report did not arrive this year.");
    const subject = (await article.getByRole("heading", { level: 2 }).innerText()).replace(
      /\s*Synthetic\s*$/,
      "",
    );
    await sendConcern(page).first().click();
    await page.waitForURL(/\?raised=/, { timeout: SLOW_MS });
    await expect(
      page.getByRole("status").filter({ hasText: "Your concern was sent" }),
    ).toBeVisible();
    await expect(concerns(page).first()).toContainText("The promised yearly report did not arrive");
    await expect(concerns(page).first()).toContainText("Open");

    await switchPersona(page, "data_steward");
    await page.goto("/demo/w1-rights");
    const indicator = page.getByTestId("grievance-indicator").filter({ hasText: "1 open" });
    await expect(indicator).toHaveCount(1);
    const queued = page.getByTestId("grievance-row");
    await expect(queued).toHaveCount(1);
    await expect(queued).toContainText("The promised yearly report did not arrive");
    expect(subject.length).toBeGreaterThan(0);
    await queued.getByRole("button", { name: /Acknowledge/ }).click();
    await expect(queued).toContainText("Acknowledged", { timeout: SLOW_MS });

    await page.goto(ROUTE);
    await expect(concerns(page).first()).toContainText("Acknowledged");
  });

  test("w10 empty concern is refused and other personas are blocked", async ({ page, baseURL }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    await openForm(page, "");
    await sendConcern(page).first().click();
    await page.waitForURL(/\?error=validation_error/, { timeout: SLOW_MS });
    await expect(page.getByRole("alert")).toContainText(
      "Please describe your concern in at least 10 characters",
    );
    await expect(concerns(page)).toHaveCount(0);

    // A scientist sees the persona notice and no agreements.
    const recordId = (
      (await (await page.request.get("/api/demo/rights/records")).json()) as {
        items: { id: string }[];
      }
    ).items[0].id;
    await switchPersona(page, "scientist");
    await page.goto(ROUTE);
    await expect(page.getByRole("note").filter({ hasText: "Community liaison" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);

    // A forced post as partner redirects with an error code and creates nothing.
    await switchPersona(page, "partner");
    const forced = await page.request.post("/api/demo/grievances", {
      headers: { origin: baseURL ?? "" },
      form: {
        rights_record_id: recordId,
        category: "other",
        description: "A forced concern from the wrong persona.",
        idempotency_key: `e2e-w10-${Date.now()}`,
      },
      maxRedirects: 0,
    });
    expect(forced.status()).toBe(303);
    expect(forced.headers().location).toContain("/demo/w10-custodian?error=persona_forbidden");
    await switchPersona(page, "data_steward");
    const queue = (await (await page.request.get("/api/demo/grievances")).json()) as {
      items: unknown[];
    };
    expect(queue.items).toHaveLength(0);
  });

  test("w10 page has zero axe violations with the form closed and open", async ({ page }) => {
    await signIn(page, "community_liaison");
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
    for (const summary of await page.locator("details > summary").all()) await summary.click();
    await expectNoAxeViolations(page);
  });
});
