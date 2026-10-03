import { expect, test } from "../support/test";
import { SLUGS } from "../support/hero";
import { forceWideFont, horizontalOverflow, overflowingElements } from "../support/reflow";

test("home responds 200 with one h1 and the page landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
});

test("both See the demo links land on /access", async ({ page }) => {
  await page.goto("/");
  const links = page.getByRole("link", { name: "See the demo" });
  await expect(links).toHaveCount(2);
  for (let i = 0; i < 2; i += 1) {
    await page.goto("/");
    await page.getByRole("link", { name: "See the demo" }).nth(i).click();
    await expect(page).toHaveURL(/\/access$/);
    // The destination really rendered (a 404 page would also match the URL).
    await expect(page).toHaveTitle(/Demo sign-in/);
    await expect(page.locator("main#main")).toBeVisible();
  }
});

test("the components index lists the six detail pages in order", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("#components").getByRole("link");
  await expect(links).toHaveCount(6);
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(hrefs).toEqual(SLUGS.map((slug) => `/ecosystem/${slug}`));
});

test("there is no horizontal scroll at 320 px width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the viewport never blocks zoom (no maximum-scale, no user-scalable=no)", async ({ page }) => {
  await page.goto("/");
  const content = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(content).toBeTruthy();
  expect(content).not.toMatch(/maximum-scale/i);
  expect(content).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
});

test("the in-page anchors resolve to sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section#product")).toHaveCount(1);
  await expect(page.locator("section#about")).toHaveCount(1);
  await page.getByRole("link", { name: "How it works" }).first().click();
  await expect(page).toHaveURL(/#product$/);
});

for (const path of ["/", "/ecosystem/provenance-dlt", "/legal/privacy"]) {
  test(`${path} does not scroll sideways at 320 px even with a wide fallback font`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    await forceWideFont(page);
    expect(await overflowingElements(page)).toEqual([]);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}
