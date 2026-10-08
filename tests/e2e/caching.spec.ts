// public/sw.js caches build chunks only when the response says `immutable`. A host or CDN change that
// rewrote Cache-Control would silently turn off chunk caching, and with it the offline page's CSS and JS.
import { runsAgainstNextDev } from "../support/target";
import { expect, test } from "../support/test";

test("build chunks are served with an immutable Cache-Control", async ({ page, request }) => {
  test.skip(runsAgainstNextDev(), "next dev serves unhashed chunks without immutable");
  await page.goto("/");
  const chunk = await page.locator('script[src*="/_next/static/"]').first().getAttribute("src");
  expect(chunk, "the home page loads at least one build chunk").toBeTruthy();
  const response = await request.get(chunk!);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"] ?? "").toMatch(/\bimmutable\b/i);
});
