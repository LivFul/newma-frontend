import { expect, test } from "../support/test";
import { SLUGS, type Slug } from "../support/hero";

// Plain data (the homepage never imports demo code, and neither do these specs).
const TITLES: Record<Slug, string> = {
  interface: "Interface",
  "agentic-compute": "Agentic Compute",
  "scientific-review": "Scientific Review",
  "wet-lab": "Wet Lab",
  "data-knowledge": "Data & Knowledge",
  "provenance-dlt": "Provenance & DLT",
};
const DEMO_ROUTES: Record<Slug, string> = {
  interface: "/demo",
  "agentic-compute": "/demo/w3-agent",
  "scientific-review": "/demo/w4-gates",
  "wet-lab": "/demo/w5-wet-lab",
  "data-knowledge": "/demo/w2-evidence",
  "provenance-dlt": "/demo/w6-provenance",
};

for (const slug of SLUGS) {
  test(`/ecosystem/${slug} renders its title, sources and demo link`, async ({ page }) => {
    const response = await page.goto(`/ecosystem/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES[slug]);
    await expect(page.getByRole("heading", { level: 2, name: "Sources" })).toBeVisible();
    expect(await page.locator("#sources-heading + ol > li").count()).toBeGreaterThanOrEqual(1);
    const demo = page.getByRole("link", { name: "See it in the demo" });
    await expect(demo).toHaveAttribute("href", "/access");
    await expect(page.locator("#demo-heading").locator("..")).toContainText(DEMO_ROUTES[slug]);
  });

  test(`the home index link for ${slug} resolves with status 200`, async ({ page, request }) => {
    await page.goto("/");
    const href = await page
      .locator(`#components a[href="/ecosystem/${slug}"]`)
      .getAttribute("href");
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
  });

  test(`the demo route ${DEMO_ROUTES[slug]} redirects to /access without a session`, async ({
    request,
  }) => {
    const response = await request.get(DEMO_ROUTES[slug], { maxRedirects: 0 });
    test.skip(
      response.status() === 404,
      "demo mode is off on this target; previews and production run with it on",
    );
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toMatch(/\/access$/);
  });
}

test("an unknown ecosystem slug is a 404", async ({ page }) => {
  const response = await page.goto("/ecosystem/not-a-component");
  expect(response?.status()).toBe(404);
});

test("/access answers 200 with no query string needed", async ({ request }) => {
  const response = await request.get("/access");
  expect(response.status()).toBe(200);
});

test("the provenance page says optional and off-chain above the fold", async ({ page }) => {
  await page.goto("/ecosystem/provenance-dlt");
  const callout = page.getByRole("note");
  await expect(callout).toContainText("optional");
  await expect(callout).toContainText("off-chain");
  await expect(callout).toContainText("Optional, simulated");
  const box = (await callout.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.locator("main")).toContainText(/off-chain/i);
});
