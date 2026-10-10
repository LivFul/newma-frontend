import { expect, test } from "../support/test";
import { SLUGS } from "../support/hero";
import { forceWideFont, horizontalOverflow, overflowingElements } from "../support/reflow";
import { HERO_MIRROR_LINKS, PLATFORM_CTA } from "../../src/content/home/chrome";

test("home responds 200 with one h1 and the page landmarks", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
});

test("hero Explore the Platform link lands on /access", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero").getByRole("link", { name: PLATFORM_CTA.text }).click();
  await expect(page).toHaveURL(/\/access$/);
  await expect(page).toHaveTitle(/Demo sign-in/);
  await expect(page.locator("main#main")).toBeVisible();
});

test("the ecosystem index lists the six detail pages in order", async ({ page }) => {
  await page.goto("/ecosystem");
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

test("How it works navigates to the dedicated page", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero").getByRole("link", { name: HERO_MIRROR_LINKS.how.text }).click();
  await expect(page).toHaveURL(/\/how-it-works$/);
  await expect(page.locator("section#workflow")).toBeVisible();
});

test("legacy homepage hash bookmarks redirect to dedicated routes", async ({ page }) => {
  await page.goto("/#workflow");
  await expect(page).toHaveURL(/\/how-it-works$/);
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
