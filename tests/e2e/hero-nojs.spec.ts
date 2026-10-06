import { expect, test } from "../support/test";
import { heroFrame, heroLink, heroPart, SLUGS } from "../support/hero";

test.use({ javaScriptEnabled: false });

test("without JavaScript the six components are working links inside the svg", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('svg g a[href^="/ecosystem/"]');
  await expect(links).toHaveCount(6);
  for (const slug of SLUGS) {
    await expect(heroLink(page, slug)).toHaveAttribute("aria-label", /\S/);
  }
});

test("without JavaScript every label is visible and each link navigates", async ({ page }) => {
  for (const slug of SLUGS) {
    await page.goto("/");
    // Interface carries three titles (one per face); the first is the part's own.
    const title = page.locator(`svg g[data-slug="${slug}"] text.eco-title`).first();
    await expect(title).toBeVisible();
    await heroLink(page, slug).click();
    await expect(page).toHaveURL(new RegExp(`/ecosystem/${slug}$`));
  }
});

test("without JavaScript hover explodes the diagram by CSS", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover is a desktop input");
  await page.goto("/");
  const y = () =>
    heroPart(page, "wet-lab").evaluate((g) => g.getBoundingClientRect().y + window.scrollY);
  const before = await y();
  await heroFrame(page).hover();
  await expect.poll(y, { timeout: 5_000 }).toBeGreaterThan(before + 20);
});

test("without JavaScript the interactive layer never mounts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-hero-ready="true"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore components" })).toHaveCount(0);
});
