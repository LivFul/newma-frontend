import { expect, test } from "../support/test";

const LINE_TOLERANCE_PX = 3;
const MIN_ICON_GAP_PX = 8;

// Value: protects=each "Who it is for" card shows its leaf inline, left of the role title on the same line; fails_when=the icon is stacked above the title or crowds it; why_new=the leaf was a block above the title and read as a separate row; seam=none
test("each persona icon sits inline, left of its role title", async ({ page }) => {
  await page.goto("/overview");
  const cards = page.locator("#product ul[role='list'] > li").filter({ has: page.locator("svg") });
  await cards.first().scrollIntoViewIfNeeded();
  const count = await cards.count();
  expect(count).toBe(5);

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const [icon, title] = await Promise.all([
      card.locator("svg").first().boundingBox(),
      card.locator("p").first().boundingBox(),
    ]);
    expect(icon && title, `card ${index + 1} boxes`).toBeTruthy();
    const iconMiddle = icon!.y + icon!.height / 2;
    const titleMiddle = title!.y + title!.height / 2;
    expect(Math.abs(iconMiddle - titleMiddle), `card ${index + 1} same line`).toBeLessThanOrEqual(
      LINE_TOLERANCE_PX + title!.height / 2,
    );
    expect(icon!.y, `card ${index + 1} not above`).toBeLessThan(title!.y + title!.height);
    expect(title!.x - (icon!.x + icon!.width), `card ${index + 1} gap`).toBeGreaterThanOrEqual(
      MIN_ICON_GAP_PX,
    );
  }
});
