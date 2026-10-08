import { expect, test } from "../support/test";
import {
  center,
  focusedHref,
  gotoHeroReady,
  heroFrame,
  heroLink,
  heroPart,
  heroSvg,
  partY,
  settled,
  SLUGS,
  tabToFirstComponent,
} from "../support/hero";

test.describe("mouse", () => {
  test.skip(({ isMobile }) => isMobile, "mouse model is covered on the desktop project");

  test("hover explodes the diagram and leaving puts it back", async ({ page }) => {
    await gotoHeroReady(page);
    const assembled = await settled(page);
    await heroFrame(page).hover();
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    expect(await settled(page)).toBeGreaterThan(assembled + 20);
    await page.mouse.move(2, 2);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
    expect(await settled(page)).toBeCloseTo(assembled, 0);
  });

  for (const slug of SLUGS) {
    test(`clicking ${slug} opens /ecosystem/${slug}`, async ({ page }) => {
      await gotoHeroReady(page);
      await heroFrame(page).hover();
      await settled(page);
      await heroLink(page, slug).click();
      await expect(page).toHaveURL(new RegExp(`/ecosystem/${slug}$`));
    });
  }
});

test.describe("keyboard", () => {
  test("Tab reaches the first component, arrows walk all six, Home and End jump, Enter opens", async ({
    page,
  }) => {
    await gotoHeroReady(page);
    await tabToFirstComponent(page);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    const visited: (string | null)[] = [await focusedHref(page)];
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("ArrowRight");
      visited.push(await focusedHref(page));
    }
    expect(visited).toEqual(SLUGS.map((s) => `/ecosystem/${s}`));
    await page.keyboard.press("ArrowRight");
    expect(await focusedHref(page)).toBe("/ecosystem/provenance-dlt");
    await page.keyboard.press("Home");
    expect(await focusedHref(page)).toBe("/ecosystem/interface");
    await page.keyboard.press("End");
    expect(await focusedHref(page)).toBe("/ecosystem/provenance-dlt");
    await page.keyboard.press("ArrowUp");
    expect(await focusedHref(page)).toBe("/ecosystem/data-knowledge");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/ecosystem\/data-knowledge$/);
  });

  for (const [index, slug] of SLUGS.entries()) {
    test(`${slug} is reachable and opens by keyboard`, async ({ page }) => {
      await gotoHeroReady(page);
      await tabToFirstComponent(page);
      for (let i = 0; i < index; i += 1) await page.keyboard.press("ArrowDown");
      expect(await focusedHref(page)).toBe(`/ecosystem/${slug}`);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/ecosystem/${slug}$`));
    });
  }

  test("Escape reassembles the diagram, keeps focus, and a new arrow explodes it again", async ({
    page,
  }) => {
    await gotoHeroReady(page);
    await tabToFirstComponent(page);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    await page.keyboard.press("Escape");
    await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
    expect(await focusedHref(page)).toBe("/ecosystem/interface");
    await page.keyboard.press("ArrowRight");
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
  });

  test("Tab leaves the figure and the diagram reassembles; the toggle is operable by keyboard", async ({
    page,
  }) => {
    await gotoHeroReady(page);
    await tabToFirstComponent(page);
    for (let i = 0; i < 5; i += 1) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Tab");
    const toggle = page.getByRole("button", { name: "Explore components" });
    await expect(toggle).toBeFocused();
    await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
  });
});

test.describe("touch", () => {
  test.use({ hasTouch: true });

  test("the first tap explodes without navigating, the second tap opens", async ({ page }) => {
    await gotoHeroReady(page);
    const assembled = await settled(page);
    await page.touchscreen.tap(
      ...(Object.values(await center(heroLink(page, "provenance-dlt"))) as [number, number]),
    );
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    await expect(page).toHaveURL(/\/$/);
    expect(await settled(page)).toBeGreaterThan(assembled + 20);
    const target = await center(heroLink(page, "wet-lab"));
    await page.touchscreen.tap(target.x, target.y);
    await expect(page).toHaveURL(/\/ecosystem\/wet-lab$/);
  });

  for (const slug of SLUGS) {
    test(`tap, tap opens ${slug}`, async ({ page }) => {
      await gotoHeroReady(page);
      const first = await center(heroLink(page, "provenance-dlt"));
      await page.touchscreen.tap(first.x, first.y);
      await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
      await settled(page);
      await heroLink(page, slug).tap();
      await expect(page).toHaveURL(new RegExp(`/ecosystem/${slug}$`));
    });
  }

  test("Explore components explodes without tapping a part and a tap outside does not close it", async ({
    page,
  }) => {
    await gotoHeroReady(page);
    const toggle = page.getByRole("button", { name: "Explore components" });
    const box = await center(toggle);
    await page.touchscreen.tap(box.x, box.y);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    await page.touchscreen.tap(2, 2);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    const again = await center(toggle);
    await page.touchscreen.tap(again.x, again.y);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
  });

  test("a tap outside collapses a touch-opened view", async ({ page }) => {
    await gotoHeroReady(page);
    const first = await center(heroLink(page, "provenance-dlt"));
    await page.touchscreen.tap(first.x, first.y);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
    await page.touchscreen.tap(2, 2);
    await expect(heroSvg(page)).toHaveAttribute("data-view", "assembled");
    expect(await partY(page, "interface")).toBeGreaterThan(0);
    await expect(heroPart(page, "interface")).toBeVisible();
  });

  test("the toggle is at least 44 by 44 CSS pixels", async ({ page }) => {
    await gotoHeroReady(page);
    const box = await page.getByRole("button", { name: "Explore components" }).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
