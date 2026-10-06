import { expect, test } from "../support/test";

const ICONS: ReadonlyArray<readonly [string, RegExp]> = [
  ["/favicon.ico", /^image\/(x-icon|vnd\.microsoft\.icon)/],
  ["/brand/favicon-32.png", /^image\/png/],
  ["/brand/favicon-48.png", /^image\/png/],
  ["/brand/apple-touch-icon.png", /^image\/png/],
  ["/brand/favicon.svg", /^image\/svg\+xml/],
];

test("favicon assets resolve with the exact expected types", async ({ request }) => {
  for (const [path, type] of ICONS) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"] ?? "", path).toMatch(type);
  }
});

test("the document lists a PNG or ICO icon before the SVG", async ({ page }) => {
  await page.goto("/");
  const icons = await page
    .locator('link[rel="icon"], link[rel="shortcut icon"]')
    .evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute("href") ?? "",
        type: el.getAttribute("type"),
      })),
    );
  const raster = icons.findIndex((icon) => /\.(ico|png)(\?|$)/.test(icon.href));
  const svg = icons.findIndex((icon) => /\.svg(\?|$)/.test(icon.href));
  expect(raster, "a PNG or ICO icon link").toBeGreaterThanOrEqual(0);
  expect(svg, "an SVG icon link").toBeGreaterThan(raster);
  expect(icons.find((icon) => /favicon-32\.png/.test(icon.href))?.type).toBe("image/png");
});
