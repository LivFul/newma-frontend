import { expect, test } from "../support/test";
import { heroLink, heroPart, SLUGS } from "../support/hero";

test.use({ reducedMotion: "reduce" });

test("reduced motion shows the exploded labelled diagram with no motion running", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // (`next dev` preloads the lazy chunk by name, so the strict no-hero-chunk check lives in
  // hero-budget.spec.ts against the production build.)
  // Past the 2 s idle timeout the interactive layer would have loaded without the media query.
  await page.waitForTimeout(2_500);
  await expect(page.locator('[data-hero-ready="true"]')).toHaveCount(0);
  await expect(page.locator("[data-hero-chunk]")).toHaveCount(0);
  expect(requested.filter((url) => /motion/i.test(new URL(url).pathname))).toEqual([]);
  for (const slug of SLUGS) {
    const transform = await heroPart(page, slug).evaluate((g) => getComputedStyle(g).transform);
    const exploded = await heroPart(page, slug).evaluate((g) => {
      const style = g.getAttribute("style") ?? "";
      const x = /--ex:\s*([-\d.]+)px/.exec(style)?.[1];
      const y = /--ey:\s*([-\d.]+)px/.exec(style)?.[1];
      return `matrix(1, 0, 0, 1, ${x}, ${y})`;
    });
    expect(transform).toBe(exploded);
    await expect(page.locator(`svg g[data-slug="${slug}"] text.eco-desc`)).toHaveCSS(
      "opacity",
      "1",
    );
  }
  const running = await page.evaluate(
    () => document.querySelector(".eco-figure")!.getAnimations({ subtree: true }).length,
  );
  expect(running).toBe(0);
  await expect(page.getByRole("button", { name: "Explore components" })).toHaveCount(0);
});

test("reduced motion: Tab reaches all six components in order", async ({ page }) => {
  await page.goto("/");
  const seen: string[] = [];
  for (let i = 0; i < 40 && seen.length < 6; i += 1) {
    await page.keyboard.press("Tab");
    const href = await page.evaluate(() =>
      document.activeElement?.closest("svg.eco-svg")
        ? document.activeElement.getAttribute("href")
        : null,
    );
    if (href) seen.push(href);
  }
  expect(seen).toEqual(SLUGS.map((s) => `/ecosystem/${s}`));
  await expect(heroLink(page, "interface")).toBeVisible();
});
