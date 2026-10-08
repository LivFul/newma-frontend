import { gotoHeroReady } from "../support/hero";
import { expect, test } from "../support/test";

const STORAGE_KEY = "newma.theme.v1";
const NIGHT_RGB = "rgb(4, 27, 33)";

test.use({ viewport: { width: 1280, height: 900 } });

test("applies stored dark tokens, updates theme-color, and scrolls with header tone", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "dark");
  }, STORAGE_KEY);
  await gotoHeroReady(page);

  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("dark");
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(NIGHT_RGB);
  await expect(page.locator("#newma-theme-color")).toHaveAttribute("content", "#06242b");
  await expect(
    page.locator("[data-site-header] img.wordmark-light"),
  ).toBeHidden();
  await expect(page.locator("[data-site-header] img.wordmark-dark")).toBeVisible();

  await page.getByRole("radio", { name: "Light" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("light");
  await expect(page.locator("#newma-theme-color")).toHaveAttribute("content", "#f1f6f1");

  await page.getByRole("radio", { name: "Dark" }).click();
  await page
    .locator("[data-site-header]")
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page).toHaveURL(/#workflow$/);
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector("[data-site-header]")?.getAttribute("data-tone")),
    )
    .toMatch(/light|dark/);
});

test("access shell keeps a stored dark theme", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "dark");
  }, STORAGE_KEY);
  await page.goto("/access");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("dark");
  await expect(page.getByRole("link", { name: /NEWMA/i })).toBeVisible();
});
