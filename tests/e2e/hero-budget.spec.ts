import { gzipSync } from "node:zlib";
import type { Page, Response } from "@playwright/test";
import { expect, test } from "../support/test";

// Hero JS budget on the production build: 80 KiB gzip (prompt 3.6, assumption A-P4-14). The hero's
// scripts are the JS fetched on `/` that `/legal/privacy` (same shell, no hero) does not fetch.
const BUDGET_BYTES = 81_920;
const IDLE_SETTLE_MS = 3_000;

type Loaded = Map<string, number>; // url -> gzip bytes

async function loadedScripts(page: Page, path: string, settleMs: number): Promise<Loaded> {
  const bodies: Promise<[string, number]>[] = [];
  const onResponse = (response: Response) => {
    if (response.request().resourceType() !== "script") return;
    bodies.push(
      response.body().then((body): [string, number] => [response.url(), gzipSync(body).length]),
    );
  };
  page.on("response", onResponse);
  await page.goto(path, { waitUntil: "networkidle" });
  // Past the 2 s idle timeout the interactive layer has been requested.
  await page.waitForTimeout(settleMs);
  page.off("response", onResponse);
  return new Map(await Promise.all(bodies));
}

const heroOnly = (home: Loaded, baseline: Loaded): Loaded =>
  new Map([...home].filter(([url]) => !baseline.has(url)));
const total = (loaded: Loaded) => [...loaded.values()].reduce((sum, bytes) => sum + bytes, 0);

test.describe("hero budget", () => {
  test.skip(({ isMobile }) => isMobile, "chunks are identical across projects; measured once");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    test.skip(
      html.includes("hmr-client"),
      "dev-server chunks are unminified; the budget is asserted on the production build",
    );
  });

  test("the JS only the hero loads is at most 80 KiB gzip", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const home = await loadedScripts(await context.newPage(), "/", IDLE_SETTLE_MS);
    const baseline = await loadedScripts(await context.newPage(), "/legal/privacy", 500);
    await context.close();
    const hero = heroOnly(home, baseline);
    expect(hero.size, "the hero must load its own chunks").toBeGreaterThan(0);
    const bytes = total(hero);
    test.info().annotations.push({ type: "hero-gzip-bytes", description: String(bytes) });
    expect(bytes).toBeLessThanOrEqual(BUDGET_BYTES);
  });

  test("reduced motion loads none of the hero chunks", async ({ browser, baseURL }) => {
    const normal = await browser.newContext({ baseURL });
    const home = await loadedScripts(await normal.newPage(), "/", IDLE_SETTLE_MS);
    const baseline = await loadedScripts(await normal.newPage(), "/legal/privacy", 500);
    await normal.close();
    expect(heroOnly(home, baseline).size).toBeGreaterThan(0);

    const reduced = await browser.newContext({ baseURL, reducedMotion: "reduce" });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto("/", { waitUntil: "networkidle" });
    await reducedPage.waitForTimeout(IDLE_SETTLE_MS);
    await expect(reducedPage.locator('[data-hero-ready="true"]')).toHaveCount(0);
    await expect(reducedPage.locator("[data-hero-chunk]")).toHaveCount(0);
    await reduced.close();
  });
});
