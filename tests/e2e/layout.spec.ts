// Layout regressions unit tests cannot see: both depend on real viewport widths (TODOS.md, D4).
import { horizontalOverflow } from "../support/reflow";
import { expect, test } from "../support/test";

// Sizes are set per test, so the device emulation of the mobile projects adds nothing here.
test.skip(({ isMobile }) => isMobile, "layout widths are driven per test from desktop-chromium");

const BLEED_CAP_PX = 1920; // 120rem
const TOLERANCE_PX = 1;

for (const width of [768, 1280]) {
  test(`the About purpose text sits in two columns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const [lede, body] = await page
      .locator("[data-about-purpose] > p")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
    expect(Math.abs(lede.top - body.top)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(body.left).toBeGreaterThan(lede.right);
  });
}

test("the About purpose text stacks below md", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  const [lede, body] = await page
    .locator("[data-about-purpose] > p")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
  expect(body.top).toBeGreaterThanOrEqual(lede.bottom);
  expect(Math.abs(lede.left - body.left)).toBeLessThanOrEqual(TOLERANCE_PX);
});

for (const width of [320, 1280, 1920]) {
  test(`the workflow breakout is min(95vw, 120rem) wide and centred at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    // vw includes a classic scrollbar; the content box the block centres in does not.
    const { box, viewport, content } = await page.locator("#workflow .wf-bleed").evaluate((el) => ({
      box: el.getBoundingClientRect().toJSON() as DOMRect,
      viewport: window.innerWidth,
      content: document.documentElement.clientWidth,
    }));
    const expected = Math.min(viewport * 0.95, BLEED_CAP_PX);
    expect(Math.abs(box.width - expected)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(Math.abs(box.left - (content - box.width) / 2)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}
