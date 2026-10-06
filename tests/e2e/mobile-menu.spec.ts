import { gotoHeroReady } from "../support/hero";
import { expect, test } from "../support/test";

// Value: protects=the mobile section menu is really closed until Menu is pressed, opens with tappable links, and closes when one is chosen; fails_when=the hidden attribute stops hiding the list under the page's CSS, aria-expanded drifts, or a link is smaller than 44 px; why_new=the unit test runs without any CSS and no e2e pressed Menu, so a flex class overriding hidden would pass; seam=none
test("the mobile section menu opens on Menu and closes when a link is chosen", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "the Menu button only shows below the md breakpoint");
  // The Menu button is server-rendered and only works once hydrated: wait for the page's ready hook.
  await gotoHeroReady(page);
  const menu = page.getByRole("button", { name: "Menu" });
  const list = page.locator("#mobile-sections");

  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(list).toBeHidden();

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(list).toBeVisible();
  const links = list.getByRole("link");
  expect(await links.count()).toBeGreaterThan(0);
  const box = await links.first().boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  await links.first().click();
  await expect(list).toBeHidden();
});
