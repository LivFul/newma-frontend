import { expect, test } from "../support/test";
import {
  WORKFLOW_ROUTES,
  banner,
  DEMO_BANNER_TEXT,
  expectNoAxeViolations,
  needsBackend,
  signIn,
} from "../support/demo";

// One place that scans the six workflow entry pages (the e2e specs also scan their dialogs and
// detail pages). Needs the local API behind the BFF (README "Demo end-to-end run").
test.describe("demo workflow pages axe sweep", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  for (const route of WORKFLOW_ROUTES) {
    test(`${route} has zero axe violations and the banner`, async ({ page }) => {
      await signIn(page, "scientist");
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
      await expectNoAxeViolations(page);
    });
  }
});
