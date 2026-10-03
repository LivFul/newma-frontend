import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { SLUGS } from "../support/hero";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const PAGES = ["/", ...SLUGS.map((s) => `/ecosystem/${s}`), "/legal/privacy", "/legal/terms"];

async function expectClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(
    results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
  expect(results.violations).toEqual([]);
}

for (const path of PAGES) {
  test(`${path} has zero axe violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectClean(page);
  });
}

for (const path of ["/", "/ecosystem/provenance-dlt"]) {
  test(`${path} reflows at 320 px with no horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("forced colours keep a visible outline on the six components and the header button", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  // Wait for the idle swap, so the sampled elements are the ones that stay.
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
  for (const slug of SLUGS) {
    const link = page.locator(`svg.eco-svg a[href="/ecosystem/${slug}"]`);
    await link.focus();
    const stroke = await link.locator(".eco-hit").evaluate((el) => ({
      stroke: getComputedStyle(el).stroke,
      width: getComputedStyle(el).strokeWidth,
    }));
    expect(stroke.stroke, slug).not.toBe("none");
    expect(stroke.stroke, slug).not.toBe("rgba(0, 0, 0, 0)");
    expect(parseFloat(stroke.width), slug).toBeGreaterThanOrEqual(3);
  }
  const access = page.locator("[data-site-header]").getByRole("link", { name: "Access NEWMA" });
  await access.focus();
  const outline = await access.evaluate((el) => ({
    style: getComputedStyle(el).outlineStyle,
    width: parseFloat(getComputedStyle(el).outlineWidth),
  }));
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});
