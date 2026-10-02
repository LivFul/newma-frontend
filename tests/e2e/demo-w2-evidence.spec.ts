import { expect, test } from "../support/test";
import {
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
} from "../support/demo";
import { EVIDENCE_LABEL_TEXT } from "../../src/lib/evidence";

const ROUTE = "/demo/w2-evidence";
const TABS = ["taxa", "compounds", "observations", "curation"] as const;

test.describe("W2 evidence and curation", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("w2 six evidence labels and curated release", async ({ page }) => {
    await signIn(page, "data_steward");
    await page.goto(ROUTE);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    const legend = page.getByRole("list", { name: "Evidence label legend" });
    for (const text of Object.values(EVIDENCE_LABEL_TEXT)) await expect(legend).toContainText(text);
    // The data itself carries labels too (observations tab).
    await page.goto(`${ROUTE}?tab=observations`);
    await expect(
      page.getByRole("table", { name: "Observations" }).getByTestId("evidence-label").first(),
    ).toBeVisible();

    await page.goto(`${ROUTE}?tab=curation`);
    const cleared = page
      .getByRole("list", { name: "Source records" })
      .getByRole("listitem")
      .filter({ hasText: "cleared" })
      .filter({ hasNotText: "uncleared" });
    await cleared.getByRole("button", { name: /^Ingest/ }).click();
    await expect(cleared.getByRole("status")).toContainText("extracted");

    const pending = page.locator('[data-status="pending_review"]').first();
    await pending.getByRole("button", { name: /Review claim/ }).click();
    await page.getByLabel("Rationale").fill("Statement matches the synthetic source table");
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(/[1-9]\d* approved claims? ready for release/)).toBeVisible();
    await page.getByRole("button", { name: "Publish curated release" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Release version" })).toContainText(
      "Release version 1",
    );
  });

  test("w2 quarantine and uncleared source", async ({ page }) => {
    await signIn(page, "data_steward");
    await page.goto(`${ROUTE}?tab=curation`);
    const quarantined = page.locator('[data-status="quarantined"]').first();
    await quarantined.getByRole("button", { name: /Review claim/ }).click();
    await page.getByLabel("Rationale").fill("Attempting approval");
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText("claim_quarantined");
    await page.getByRole("button", { name: "Close" }).click();

    const uncleared = page
      .getByRole("list", { name: "Source records" })
      .getByRole("listitem")
      .filter({ hasText: "uncleared" });
    const queueSize = await page
      .getByRole("list", { name: "Curation queue" })
      .getByRole("listitem")
      .count();
    await uncleared.getByRole("button", { name: /^Ingest/ }).click();
    const alert = uncleared.getByRole("alert");
    await expect(alert).toContainText("Rejected before ingestion");
    await expect(alert).toContainText("No claims were created.");
    await page.reload();
    await expect(
      page.getByRole("list", { name: "Curation queue" }).getByRole("listitem"),
    ).toHaveCount(queueSize);

    await page.goto(`${ROUTE}?tab=observations`);
    await expect(page.getByLabel(/^withheld: /).first()).toHaveText("withheld");
  });

  for (const tab of TABS) {
    test(`w2 ${tab} tab has zero axe violations`, async ({ page }) => {
      await signIn(page, "data_steward");
      await page.goto(`${ROUTE}?tab=${tab}`);
      await page.waitForLoadState("networkidle");
      await expectNoAxeViolations(page);
    });
  }
});
