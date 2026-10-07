import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { gotoHeroReady, heroFrame, heroLink, settled } from "../support/hero";

type Recorded = { name: string; [key: string]: unknown };

// Events survive the full-page navigation that follows a click, so they are kept in sessionStorage.
async function recordEvents(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.addEventListener("newma:analytics", (e) => {
      const list = JSON.parse(sessionStorage.getItem("__events") ?? "[]");
      list.push((e as CustomEvent).detail);
      sessionStorage.setItem("__events", JSON.stringify(list));
    });
  });
}
const readEvents = (page: Page): Promise<Recorded[]> =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem("__events") ?? "[]"));

test("the header Access NEWMA click emits one access_newma_click with no properties", async ({
  page,
}) => {
  await recordEvents(page);
  await page.goto("/");
  await page.locator("[data-site-header]").getByRole("link", { name: "Access NEWMA" }).click();
  await expect(page).toHaveURL(/\/access$/);
  expect(await readEvents(page)).toEqual([{ name: "access_newma_click" }]);
});

test("every other link to /access emits the same event", async ({ page }) => {
  await recordEvents(page);
  await page.goto("/ecosystem/wet-lab");
  await page.getByRole("link", { name: "Explore the demo" }).first().click();
  await expect(page).toHaveURL(/\/access$/);
  expect(await readEvents(page)).toEqual([{ name: "access_newma_click" }]);
});

test("an index link emits component_open with only the slug", async ({ page }) => {
  await recordEvents(page);
  await page.goto("/");
  await page.locator('#components a[href="/ecosystem/data-knowledge"]').click();
  await expect(page).toHaveURL(/\/ecosystem\/data-knowledge$/);
  expect(await readEvents(page)).toEqual([{ name: "component_open", slug: "data-knowledge" }]);
});

test("a hero component click emits component_open with the right slug", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "the touch model has its own two-tap spec");
  await recordEvents(page);
  await gotoHeroReady(page);
  await heroFrame(page).hover();
  await settled(page);
  await heroLink(page, "scientific-review").click();
  await expect(page).toHaveURL(/\/ecosystem\/scientific-review$/);
  expect(await readEvents(page)).toEqual([{ name: "component_open", slug: "scientific-review" }]);
});

test("no analytics request is made in the test run (the webdriver gate)", async ({ page }) => {
  const insights: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/_vercel/insights")) insights.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Access NEWMA" }).first().click();
  await page.waitForLoadState("networkidle");
  expect(insights).toEqual([]);
});

test("/access and the demo carry no analytics script", async ({ page }) => {
  for (const path of ["/access", "/demo"]) {
    await page.goto(path);
    await expect(page.locator('script[src*="_vercel/insights"]')).toHaveCount(0);
    const html = await page.content();
    expect(html, path).not.toContain("_vercel/insights");
  }
});
