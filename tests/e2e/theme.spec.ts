import { gotoHeroReady } from "../support/hero";
import { expect, test } from "../support/test";

const STORAGE_KEY = "newma.theme.v1";
const NIGHT_RGB = "rgb(17, 28, 16)";
const PAPER_RGB = "rgb(247, 248, 244)";

test.use({ viewport: { width: 1280, height: 900 } });

test("defaults to light when no preference is stored", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key);
  }, STORAGE_KEY);
  await gotoHeroReady(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("light");
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(PAPER_RGB);
  await expect(page.getByRole("radio", { name: "Light" })).toBeChecked();
});

test("applies stored dark tokens, updates theme-color, and scrolls with header tone", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "dark");
  }, STORAGE_KEY);
  await gotoHeroReady(page);

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(NIGHT_RGB);
  await expect(page.locator("#newma-theme-color")).toHaveAttribute("content", "#1b3319");
  await expect(page.locator("[data-site-header] img.wordmark-light")).toBeHidden();
  await expect(page.locator("[data-site-header] img.wordmark-dark")).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("radio", { name: "Light" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("light");
  await expect(page.locator("#newma-theme-color")).toHaveAttribute("content", "#f7f8f4");

  await page.getByRole("radio", { name: "Dark" }).click();
  await page.locator("#mobile-sections").getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/\/how-it-works$/);
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
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await expect(page.getByRole("link", { name: /NEWMA/i })).toBeVisible();
  await expect(page.locator("img.wordmark-light")).toBeHidden();
  await expect(page.locator("img.wordmark-dark")).toBeVisible();
});
