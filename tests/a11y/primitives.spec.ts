import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("primitives gallery has zero axe violations", async ({ page }) => {
  await page.goto("/primitives");
  await expect(page.getByRole("heading", { level: 1, name: "Primitives" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
  expect(results.violations).toEqual([]);
});

test("dialog opens by keyboard and closes with Escape", async ({ page }) => {
  await page.goto("/primitives");
  await page.getByRole("button", { name: "Open dialog" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Example dialog" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("skip link is the first focusable element and moves focus to main", async ({ page }) => {
  await page.goto("/primitives");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});
