import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../support/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

test("the hero copy stays visible and only the actions run the entrance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  // The copy paints with the first frame: on phones the lede is the LCP node.
  const copy = page.locator("#hero-heading + div p");
  await expect(copy, "the tagline and lede follow the h1").toHaveCount(2);
  for (const el of [heading, ...(await copy.all())]) await expect(el).toHaveCSS("opacity", "1");
  await expect(page.locator("#hero .hero-entrance-item")).toHaveCount(2);
});

test("scrolling to the product section reveals it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#product").scrollIntoViewIfNeeded();
  await expect(page.locator("#product")).toHaveClass(/reveal-in/);
});

test("reduced motion reveals every section without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect.poll(() => page.locator("[data-reveal].reveal-in").count()).toBe(5);
});

test("the example dialog opens, is named, and closes", async ({ page }) => {
  await page.goto("/primitives");
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog", { name: "Example dialog" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/dialog-panel/);
  await expect(page.locator(".dialog-overlay")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
