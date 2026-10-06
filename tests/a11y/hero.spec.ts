import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { gotoHeroReady, heroFrame, heroSvg, settled } from "../support/hero";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function expectClean(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(
    results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
  expect(results.violations).toEqual([]);
}

test("hero has zero axe violations assembled", async ({ page }) => {
  await gotoHeroReady(page);
  await expectClean(page);
});

test("hero has zero axe violations exploded by hover or toggle", async ({ page, isMobile }) => {
  await gotoHeroReady(page);
  if (isMobile) {
    await page.getByRole("button", { name: "Explore components" }).click();
  } else {
    await heroFrame(page).hover();
  }
  await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
  await settled(page);
  await expectClean(page);
});

test("hero has zero axe violations pinned", async ({ page }) => {
  await gotoHeroReady(page);
  await page.getByRole("button", { name: "Explore components" }).click();
  await expect(page.getByRole("button", { name: "Explore components" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await settled(page);
  await expectClean(page);
});

test("static layer (reduced motion) has zero axe violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectClean(page);
});
