import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../support/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

test("the hero copy stays visible and only the actions run the entrance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  // The copy paints with the first frame: on phones the lede is the LCP node. The tagline is the h1's
  // visible text (brand guide v1), and the lede is the paragraph right after it.
  const copy = page.locator("#hero-heading + p");
  await expect(copy, "the lede follows the h1").toHaveCount(1);
  for (const el of [heading, ...(await copy.all())]) await expect(el).toHaveCSS("opacity", "1");
  await expect(page.locator("#hero .hero-entrance-item")).toHaveCount(2);
});

test("scrolling to a below-the-fold section reveals it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/overview");
  await page.locator("#closing").scrollIntoViewIfNeeded();
  await expect(page.locator("#closing")).toHaveClass(/reveal-in/);
});

test("reduced motion reveals every section without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/overview");
  await expect.poll(() => page.locator("[data-reveal].reveal-in").count()).toBe(2);
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
