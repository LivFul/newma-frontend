// Keyboard-only proxies for docs/A11Y_MANUAL_PASS.md item 1 and docs/A11Y_MANUAL_PASS_W10.md item 1.
// Tab, Shift+Tab, Enter and Escape only: every tabbable element is reached in both directions, each
// stop shows a focus indicator and is not hidden behind the sticky header, the walk leaves the page
// (no trap), the skip link moves focus into main, and a dialog traps and restores focus.
import type { Page } from "@playwright/test";
import { needsBackend, PERSONA_LABELS } from "../support/demo";
import {
  describeFocus,
  focusEnd,
  focusInside,
  markTabbables,
  resetFocus,
  tabTo,
  walk,
} from "../support/keyboard";
import { expect, test } from "../support/test";

const PUBLIC_PAGES = ["/", "/ecosystem/wet-lab", "/access"] as const;
const W10 = "/demo/w10-custodian";

test.skip(({ isMobile }) => isMobile, "keyboard walks run on the desktop project");

async function ready(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  // The interactive hero replaces the static one on idle; walk the elements that stay.
  if (path === "/") await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
}

/** Forward and backward walks reach every tabbable element with a visible, unobscured indicator. */
async function expectFullWalk(page: Page): Promise<void> {
  const total = await markTabbables(page);
  expect(total).toBeGreaterThan(0);
  await resetFocus(page);
  const forward = await walk(page, "Tab", total);
  expect(forward.escaped, "Tab leaves the page or wraps: no trap").toBe(true);
  const missing = (seen: readonly { idx: number }[]) =>
    Array.from({ length: total }, (_, i) => i).filter((i) => !seen.some((s) => s.idx === i));
  expect(missing(forward.stops), "every tabbable element is reached by Tab").toEqual([]);
  expect(forward.stops.filter((s) => !s.indicator).map((s) => s.label)).toEqual([]);
  expect(forward.stops.filter((s) => s.obscured).map((s) => s.label)).toEqual([]);

  await focusEnd(page);
  const backward = await walk(page, "Shift+Tab", total);
  expect(backward.escaped, "Shift+Tab leaves the page or wraps: no trap").toBe(true);
  expect(missing(backward.stops), "every tabbable element is reached by Shift+Tab").toEqual([]);
  expect(backward.stops.filter((s) => s.obscured).map((s) => s.label)).toEqual([]);
}

async function expectSkipLink(page: Page): Promise<void> {
  await resetFocus(page);
  await page.keyboard.press("Tab");
  const first = await describeFocus(page);
  expect(first?.label).toContain("Skip to content");
  expect(first?.indicator).toBe(true);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect(await focusInside(page, "main"), "the next Tab after the skip link lands in main").toBe(
    true,
  );
}

for (const path of PUBLIC_PAGES) {
  test(`${path}: keyboard-only walk reaches everything with visible focus @keyboard`, async ({
    page,
  }) => {
    await ready(page, path);
    await expectFullWalk(page);
  });

  test(`${path}: the skip link is the first stop and moves focus to main @keyboard`, async ({
    page,
  }) => {
    await ready(page, path);
    await expectSkipLink(page);
  });
}

test("hero: Escape keeps focus on the component; Enter opens it @keyboard", async ({ page }) => {
  await ready(page, "/");
  await resetFocus(page);
  const component = await tabUntilInside(page, "svg.eco-svg");
  await page.keyboard.press("Escape");
  expect((await describeFocus(page))?.label).toBe(component);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/ecosystem\//);
});

async function tabUntilInside(page: Page, selector: string): Promise<string> {
  for (let i = 0; i < 60; i += 1) {
    if (await focusInside(page, selector)) return (await describeFocus(page))!.label;
    await page.keyboard.press("Tab");
  }
  throw new Error(`no keyboard stop inside ${selector}`);
}

test("dialog: Enter opens it, Tab stays inside, Escape closes and restores focus @keyboard", async ({
  page,
}) => {
  await ready(page, "/primitives");
  await resetFocus(page);
  const trigger = await tabTo(page, (s) => /open dialog/i.test(s.label));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await focusInside(page, "[role=dialog]")).toBe(true);
  for (const key of ["Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    expect(await focusInside(page, "[role=dialog]"), `${key} stays in the dialog`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await describeFocus(page))?.label).toBe(trigger.label);
});

test.describe("W10 custodian view, keyboard only", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  /** Signs in from /access by keyboard: Tab to the persona button, Enter. */
  async function signInByKeyboard(page: Page): Promise<void> {
    await ready(page, "/access");
    await resetFocus(page);
    await tabTo(page, (s) => s.label.includes(PERSONA_LABELS.community_liaison));
    await page.keyboard.press("Enter");
    await page.waitForURL("**/demo");
  }

  test("w10: walk, skip link, open the concern form and Tab through it @keyboard", async ({
    page,
  }) => {
    await signInByKeyboard(page);
    await ready(page, W10);
    await expectSkipLink(page);
    await expectFullWalk(page);

    await resetFocus(page);
    await tabTo(page, (s) => s.label.startsWith('summary "Raise a concern'));
    await page.keyboard.press("Enter");
    const article = page.getByRole("article").first();
    await expect(article.locator("details")).toHaveAttribute("open", "");
    const order: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press("Tab");
      order.push((await describeFocus(page))?.label ?? "body");
    }
    expect(order[0]).toMatch(/^select/);
    expect(order[1]).toMatch(/^select/);
    expect(order[2]).toMatch(/^textarea/);
    expect(order[3]).toContain("Send concern");
    // The open form adds stops; the walk still leaves the page in both directions.
    await expectFullWalk(page);
  });
});
