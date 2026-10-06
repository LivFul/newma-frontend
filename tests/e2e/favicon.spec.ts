import { expect, test } from "../support/test";

const ICONS = [
  "/favicon.ico",
  "/brand/favicon-32.png",
  "/brand/favicon-48.png",
  "/brand/apple-touch-icon.png",
  "/brand/favicon.svg",
];

test("favicon assets resolve with the expected types", async ({ request }) => {
  for (const path of ICONS) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const type = response.headers()["content-type"] ?? "";
    if (path.endsWith(".ico")) expect(type).toMatch(/icon|octet-stream|image/);
    if (path.endsWith(".png")) expect(type).toContain("image/png");
    if (path.endsWith(".svg")) expect(type).toMatch(/svg|xml/);
  }
});

test("the document lists a PNG or ICO icon before the SVG", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page
    .locator('link[rel="icon"], link[rel="shortcut icon"]')
    .evaluateAll((els) =>
      els.map((el) => ({
        rel: el.getAttribute("rel"),
        href: el.getAttribute("href"),
        type: el.getAttribute("type"),
      })),
    );
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs[0]?.href).toMatch(/favicon\.ico|favicon-32\.png|favicon-48\.png/);
});
