// Emulation proxies for docs/A11Y_MANUAL_PASS.md items 3 and 4 and docs/A11Y_MANUAL_PASS_W10.md items 3
// and 4b: forced colours, reduced motion, dark scheme, 200 and 400 percent zoom (640 and 320 CSS px at
// 1280 px) and WCAG 1.4.12 text spacing. Each asserts axe clean, no horizontal page scroll, no clipped
// text and, where it applies, visible focus. Screen-reader rows stay manual.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expectNoAxeViolations, needsBackend, signIn } from "../support/demo";
import { describeFocus, resetFocus } from "../support/keyboard";
import { forceWideFont, horizontalOverflow, overflowingElements } from "../support/reflow";
import {
  applyTextSpacing,
  clippedText,
  overlappingText,
  runningAnimations,
} from "../support/text-fit";
import { expect, test } from "../support/test";

const PUBLIC_PAGES = ["/", "/ecosystem/wet-lab", "/access", "/legal/privacy"] as const;
const W10 = "/demo/w10-custodian";
// 1280 px at 200 and 400 percent zoom.
const ZOOM_WIDTHS = { "200%": 640, "400%": 320 } as const;
const FOCUS_STOPS = 8;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

test.skip(({ isMobile }) => isMobile, "emulations set their own viewport on the desktop project");

async function load(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

async function expectFits(page: Page): Promise<void> {
  expect(await horizontalOverflow(page), (await overflowingElements(page)).join(", ")).toBe(0);
  expect(await clippedText(page)).toEqual([]);
  expect(await overlappingText(page)).toEqual([]);
}

async function expectVisibleFocus(page: Page): Promise<void> {
  await resetFocus(page);
  for (let i = 0; i < FOCUS_STOPS; i += 1) {
    await page.keyboard.press("Tab");
    const stop = await describeFocus(page);
    if (!stop || stop.foreign) break;
    expect(stop.indicator, stop.label).toBe(true);
  }
}

/**
 * Under forced colours the user agent picks every colour, so author contrast does not apply; axe still
 * reads the author colour for some text (a false 1.09:1 on the header logo in Chromium's emulation),
 * hence color-contrast is off here. In its place: computed text and background colours differ.
 */
async function expectForcedColoursClean(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .disableRules(["color-contrast"])
    .analyze();
  expect(results.violations).toEqual([]);
  const invisible = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => !el.closest("svg") && el.children.length === 0 && el.checkVisibility())
      .filter((el) => (el.textContent ?? "").trim().length > 0)
      .filter((el) => {
        let bgEl: HTMLElement | null = el;
        let bg = "rgba(0, 0, 0, 0)";
        while (bgEl && bg === "rgba(0, 0, 0, 0)") {
          bg = getComputedStyle(bgEl).backgroundColor;
          bgEl = bgEl.parentElement;
        }
        return getComputedStyle(el).color === bg;
      })
      .map((el) => el.textContent!.trim().slice(0, 30)),
  );
  expect(invisible).toEqual([]);
}

/** The emulation checks for one page; `go` loads it (W10 signs in first). */
function emulationSuite(path: string, go: (page: Page) => Promise<void>) {
  test(`${path}: forced colours keep focus visible and axe clean @emulation`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await go(page);
    await expectVisibleFocus(page);
    await expectForcedColoursClean(page);
  });

  test(`${path}: reduced motion leaves nothing animating @emulation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await go(page);
    expect(await runningAnimations(page)).toEqual([]);
    await expectNoAxeViolations(page);
  });

  test(`${path}: dark colour scheme stays axe clean @emulation`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await go(page);
    await expectNoAxeViolations(page);
  });

  for (const [zoom, width] of Object.entries(ZOOM_WIDTHS)) {
    test(`${path}: ${zoom} zoom (${width} CSS px) reflows without clipping @emulation`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 720 });
      await go(page);
      await expectFits(page);
      await expectNoAxeViolations(page);
    });
  }

  for (const width of [1280, 320]) {
    test(`${path}: WCAG 1.4.12 text spacing at ${width} px clips nothing @emulation`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 720 });
      await go(page);
      // CI's Linux fallback fonts are wider than a Mac's; force a wide face so both agree.
      await forceWideFont(page);
      await applyTextSpacing(page);
      await expectFits(page);
      await expectNoAxeViolations(page);
    });
  }
}

for (const path of PUBLIC_PAGES) {
  emulationSuite(path, (page) => load(page, path));
}

test.describe("W10 custodian view emulations", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);
  emulationSuite(W10, async (page) => {
    await signIn(page, "community_liaison");
    await load(page, W10);
  });
});

test("the clipping, overlap and animation detectors flag a broken fixture @emulation", async ({
  page,
}) => {
  await page.setContent(`
    <p style="width:80px;height:12px;overflow:hidden">A sentence much longer than its box</p>
    <div><span style="display:inline-block;width:120px">First label</span><span
      style="display:inline-block;width:120px;margin-left:-100px">Second label</span></div>
    <div style="animation:pulse 1s linear infinite">Spinner</div>
    <style>@keyframes pulse { to { opacity: 0.5; } }</style>`);
  expect(await clippedText(page)).toHaveLength(1);
  expect(await overlappingText(page)).toHaveLength(1);
  expect(await runningAnimations(page)).toHaveLength(1);
});
