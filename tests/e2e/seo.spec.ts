import { expect, test } from "../support/test";
import { SLUGS } from "../support/hero";

// The canonical origin is fixed at build time (A-P4-10); the build under test may set it explicitly.
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://newma-frontend.vercel.app").replace(
  /\/+$/,
  "",
);

test("robots.txt is plain text, lists the sitemap and disallows only /api/", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const body = await response.text();
  // A Vercel preview answers Disallow: / (A-P4-10); a local or production build lists the sitemap.
  if (body.includes("Disallow: /\n") || /Disallow: \/\s*$/m.test(body)) {
    expect(body).not.toContain("Sitemap:");
  } else {
    expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
    expect(body).toContain("Disallow: /api/");
    for (const path of ["/access", "/demo", "/primitives"]) {
      expect(body).not.toContain(`Disallow: ${path}`);
    }
  }
});

test("sitemap.xml is XML and lists the home page and six component pages only", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/xml/);
  const body = await response.text();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toEqual([`${ORIGIN}/`, ...SLUGS.map((s) => `${ORIGIN}/ecosystem/${s}`)]);
  expect(body).not.toMatch(/lastmod/);
});

test("Open Graph images are PNGs, found through the page's own og:image tag", async ({
  page,
  request,
}) => {
  for (const path of ["/", "/ecosystem/interface"]) {
    await page.goto(path);
    const content = await page.locator('meta[property="og:image"]').getAttribute("content");
    // The tag is absolute on the canonical origin; fetch the same path from the origin under test.
    const imagePath = new URL(content!).pathname;
    expect(imagePath, path).toMatch(/opengraph-image/);
    const response = await request.get(imagePath);
    expect(response.status(), imagePath).toBe(200);
    expect(response.headers()["content-type"], imagePath).toBe("image/png");
    expect((await response.body()).length, imagePath).toBeGreaterThan(1_000);
  }
});

test("the sign-in, primitives and demo surfaces answer with X-Robots-Tag noindex", async ({
  request,
}) => {
  for (const path of ["/access", "/primitives", "/demo"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["x-robots-tag"], path).toMatch(/noindex/);
  }
});

test("the indexable pages carry no X-Robots-Tag", async ({ request }) => {
  for (const path of ["/", "/ecosystem/interface"]) {
    const response = await request.get(path);
    expect(response.headers()["x-robots-tag"], path).toBeUndefined();
  }
});

for (const page of ["privacy", "terms"]) {
  test(`/legal/${page} is a visible draft and noindex`, async ({ page: browserPage }) => {
    const response = await browserPage.goto(`/legal/${page}`);
    expect(response?.status()).toBe(200);
    await expect(browserPage.locator("main")).toContainText("Draft for review — not legal advice");
    await expect(browserPage.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("the home page has one canonical on the production origin and one JSON-LD per type", async ({
  page,
}) => {
  await page.goto("/");
  // Next prints the root URL without a trailing slash; both spellings are the same canonical URL.
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonical!).href).toBe(`${ORIGIN}/`);
  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
  expect(new URL(ogUrl!).href).toBe(`${ORIGIN}/`);
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toMatch(new RegExp(`^${ORIGIN}/opengraph-image`));
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => JSON.parse(el.textContent ?? "{}")));
  expect(scripts.map((s) => s["@type"]).sort()).toEqual(["Organization", "WebSite"]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
});

test("a component page has its own canonical, title and a single TechArticle", async ({ page }) => {
  await page.goto("/ecosystem/wet-lab");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${ORIGIN}/ecosystem/wet-lab`,
  );
  await expect(page).toHaveTitle("Wet Lab — NEWMA ecosystem");
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => JSON.parse(el.textContent ?? "{}")));
  expect(scripts.map((s) => s["@type"])).toEqual(["TechArticle"]);
  expect(scripts[0].url).toBe(`${ORIGIN}/ecosystem/wet-lab`);
});

test("a trimmed /ecosystem URL redirects to the components list instead of a 404", async ({
  request,
}) => {
  const response = await request.get("/ecosystem", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/#components$/);
});
