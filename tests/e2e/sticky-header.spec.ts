import type { Page } from "@playwright/test";
import { gotoHeroReady } from "../support/hero";
import { expect, test } from "../support/test";

const SCROLL_POSITIONS = [0, 0.25, 0.5, 0.75, 1] as const;
// The page keeps a paper margin (0.5in = 48px from tablet up, 12px on phones) above the header, so at
// scroll 0 the header sits inside that margin; as soon as the page scrolls it pins flush to the top.
const PAGE_MARGIN_PX = 1;

async function scrollToFraction(page: Page, fraction: number): Promise<void> {
  await page.evaluate((p) => {
    window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * p);
  }, fraction);
  // Let the scroll position settle before measuring.
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const y = window.scrollY;
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.scrollY === y)));
      }),
  );
}

const headerAccess = (page: Page) =>
  page.locator("[data-site-header]").getByRole("link", { name: "Access NEWMA" });

for (const fraction of SCROLL_POSITIONS) {
  test(`D-03: Access NEWMA is visible and clickable at ${fraction * 100}% scroll`, async ({
    page,
  }) => {
    await page.goto("/");
    await scrollToFraction(page, fraction);
    const link = headerAccess(page);
    await expect(link).toBeVisible();
    const box = (await link.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    // Hit test, not only visibility: nothing may sit on top of the link at its centre.
    const hit = await link.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return top === el || el.contains(top);
    });
    expect(hit).toBe(true);
    await link.click();
    await expect(page).toHaveURL(/\/access$/);
    await expect(page).toHaveTitle(/Demo sign-in/);
  });
}

test("D-03: the header stays at the top of the viewport through the whole scroll", async ({
  page,
}) => {
  await page.goto("/");
  for (const fraction of SCROLL_POSITIONS) {
    await scrollToFraction(page, fraction);
    const top = await page
      .locator("[data-site-header]")
      .evaluate((el) => el.getBoundingClientRect().top);
    if (fraction === 0) {
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(PAGE_MARGIN_PX);
    } else expect(top).toBe(0);
  }
});

test("there is no horizontal scroll at 320 px width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(headerAccess(page)).toBeVisible();
  await expect(page.getByRole("link", { name: "NEWMA by LivFul Therapeutics" }).first()).toBeVisible();
});

type FocusState = null | "foreign" | { inHeader: boolean; isSkip: boolean; top: number };

async function focusedState(page: Page): Promise<FocusState> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el.tagName === "NEXTJS-PORTAL") return null;
    // Only the site's own landmarks are measured: a deployment toolbar or other injected widget
    // (Vercel previews add one) can take focus at the end of the tab order and is not ours.
    if (!el.closest("[data-site-header], main, footer")) return "foreign";
    return {
      inHeader: el.closest("[data-site-header]") !== null,
      isSkip: el.textContent === "Skip to content",
      top: el.getBoundingClientRect().top,
    };
  });
}

// Presses `key` up to `presses` times and asserts every focused page element sits fully below the
// sticky header, whatever height the header has at this viewport (one row, or two when it wraps).
async function expectFocusNeverUnderHeader(page: Page, key: string, presses: number) {
  const headerHeight = await page
    .locator("[data-site-header]")
    .evaluate((el) => el.getBoundingClientRect().height);
  let checked = 0;
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press(key);
    const state = await focusedState(page);
    if (!state) break; // Tab left the page content (browser UI, or the dev overlay in `next dev`).
    if (state === "foreign") continue;
    if (state.inHeader || state.isSkip) continue;
    expect(state.top).toBeGreaterThanOrEqual(headerHeight - 1);
    checked += 1;
  }
  expect(checked, "the loop must actually inspect page content").toBeGreaterThan(3);
}

async function tabDownThePage(page: Page) {
  // Start from the settled page. The static hero is replaced by its interactive twin on idle; WebKit drops
  // focus when that swap lands while a hero link is focused, which ends this walk after three or four
  // stops and says nothing about the sticky header. That swap is a separate matter.
  await gotoHeroReady(page);
  await expectFocusNeverUnderHeader(page, "Tab", 40);
}

async function shiftTabUpThePage(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.getByRole("link", { name: "Terms" }).focus();
  await expectFocusNeverUnderHeader(page, "Shift+Tab", 25);
}

test("WCAG 2.4.11: no keyboard-focused element is hidden under the sticky header", async ({
  page,
}) => {
  await tabDownThePage(page);
});

test("the skip link is the first tab stop and moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  // It sits above the sticky header (z-index), so it is actually visible and hit-testable.
  const hit = await skip.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return top === el || el.contains(top);
  });
  expect(hit).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("in-page anchors land below the sticky header", async ({ page, isMobile }) => {
  test.skip(isMobile, "section anchors are shown from md upward (A-P4-18)");
  await page.goto("/");
  const headerHeight = await page
    .locator("[data-site-header]")
    .evaluate((el) => el.getBoundingClientRect().height);
  for (const [name, id] of [
    ["Overview", "product"],
    ["How it works", "workflow"],
    ["Ecosystem", "components"],
    ["About Newma", "about"],
  ] as const) {
    await page.locator("[data-site-header]").getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    // The anchor scroll is instant; poll rather than sleep until the section has settled below the header.
    await expect
      .poll(() => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(headerHeight - 1);
    // ...and not pushed far below it: scroll-padding is the only offset (a second one would double it).
    // The last section cannot reach the top of a short page, so only the product anchor is bounded.
    if (id === "product") {
      const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeLessThanOrEqual(headerHeight + 32);
    }
  }
});

test("on a very short viewport (400% zoom) the header scrolls away instead of taking a quarter of it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 400));
  const position = await page
    .locator("[data-site-header]")
    .evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe("static");
  const top = await page
    .locator("[data-site-header]")
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeLessThan(0);
});

test("WCAG 2.4.11: Shift+Tab back up the page never leaves focus under the sticky header", async ({
  page,
}) => {
  await shiftTabUpThePage(page);
});

// Below 440px the header wraps to two rows (101px instead of 65px), so the focus checks run there too.
// Only the width differs from the mobile project: the height stays Pixel 7's 839px. The workflow
// diagram is a sideways-scroll tab stop on phones, and its height is capped so it can sit below the
// wrapped header. A shorter screen hits the short-viewport rule instead.
test.describe("at 320px (wrapped header)", () => {
  test.use({ viewport: { width: 320, height: 839 } });

  test("WCAG 2.4.11: no keyboard-focused element is hidden under the sticky header at 320px", async ({
    page,
  }) => {
    await tabDownThePage(page);
  });

  test("WCAG 2.4.11: Shift+Tab back up the page never leaves focus under the sticky header at 320px", async ({
    page,
  }) => {
    await shiftTabUpThePage(page);
  });
});
