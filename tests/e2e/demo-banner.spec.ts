import { expect, test } from "../support/test";
import { DEMO_BANNER_TEXT, DEMO_ROUTES, needsBackend, signIn } from "../support/demo";

const banner = (page: import("@playwright/test").Page) =>
  page.getByRole("note", { name: "Demo notice" });

test.describe("demo banner", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  for (const route of DEMO_ROUTES) {
    test(`shows the verbatim banner on ${route}`, async ({ page }) => {
      await signIn(page, "scientist");
      await page.goto(route);
      await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
    });
  }

  test("shows the verbatim banner on a job detail page", async ({ page }) => {
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
    await expect(banner(page)).toContainText(DEMO_BANNER_TEXT);
  });
});
