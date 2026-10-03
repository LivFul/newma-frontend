import { expect, test } from "../support/test";
import { SLUGS } from "../support/hero";
import { warmUp } from "../support/target";

const PAGES = ["/", ...SLUGS.map((slug) => `/ecosystem/${slug}`)];

test("every demo and sign-in link on the home and component pages is plain and resolves", async ({
  page,
  request,
}) => {
  await warmUp(request);
  const hrefs = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    const found = await page
      .locator('a[href^="/demo"], a[href^="/access"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    for (const href of found) hrefs.add(href);
  }
  expect(hrefs.size).toBeGreaterThan(0);
  for (const href of hrefs) {
    // Never a query string or hash: ?next= would be an open-redirect surface.
    expect(href, href).not.toMatch(/[?#]/);
    if (href === "/access") {
      expect((await request.get(href)).status()).toBe(200);
      continue;
    }
    const response = await request.get(href, { maxRedirects: 0 });
    if (response.status() === 404) continue; // demo off on this target (previews and production run it on)
    expect(response.status(), href).toBe(307);
    expect(response.headers()["location"], href).toMatch(/\/access$/);
  }
});

test("the homepage links to /access from the header, hero, product section, footer and demo blocks", async ({
  page,
}) => {
  await page.goto("/");
  expect(await page.locator('a[href="/access"]').count()).toBeGreaterThanOrEqual(4);
  await page.goto("/ecosystem/wet-lab");
  expect(await page.locator('a[href="/access"]').count()).toBeGreaterThanOrEqual(3);
});
