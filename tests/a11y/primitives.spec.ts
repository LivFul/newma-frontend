import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const NARROW_VIEWPORT = { width: 320, height: 640 };

async function expectNoAxeViolations(page: Page, disableRules: string[] = []): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .disableRules(disableRules)
    .analyze();
  expect(
    results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
  expect(results.violations).toEqual([]);
}

test("primitives gallery has zero axe violations", async ({ page }) => {
  await page.goto("/primitives");
  await expect(page.getByRole("heading", { level: 1, name: "Primitives" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("gallery with the dialog open has zero axe violations", async ({ page }) => {
  await page.goto("/primitives");
  await page.getByRole("button", { name: "Open dialog" }).click();
  await expect(page.getByRole("dialog", { name: "Example dialog" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("gallery with the tooltip shown by keyboard focus has zero axe violations", async ({
  page,
}) => {
  await page.goto("/primitives");
  await page.getByRole("button", { name: "Hover or focus me" }).focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  // `region` (best-practice) exempts dialogs but not transient tooltip overlays, which Radix
  // portals to <body>; the rule still runs in every other scan of this page.
  await expectNoAxeViolations(page, ["region"]);
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

test("gallery has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize(NARROW_VIEWPORT);
  await page.goto("/primitives");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(NARROW_VIEWPORT.width);
});
