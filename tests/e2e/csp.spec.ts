// Content-Security-Policy-Report-Only (A-P4-16): key pages load with zero `securitypolicyviolation`
// events. Against this build the header must be present. Against a deployment that predates it, set
// CSP_INJECT=1 to add the policy from src/lib/security/csp.ts to the document response instead (for
// example PLAYWRIGHT_BASE_URL=https://demo.newmalabs.com CSP_INJECT=1 DEMO_E2E=1).
import type { Page } from "@playwright/test";
import { WORKFLOW_CONTROLS } from "../../src/content/home/workflow";
import { buildCsp } from "../../src/lib/security/csp";
import { needsBackend, signIn } from "../support/demo";
import { expect, test } from "../support/test";

const HEADER = "content-security-policy-report-only";
const PUBLIC_PAGES = ["/", "/ecosystem/wet-lab", "/access", "/legal/privacy"] as const;
// Long enough for the idle-loaded hero, analytics and any lazy chunk to arrive.
const SETTLE_MS = 3_000;

type Violation = Readonly<{ directive: string; blocked: string; source: string }>;

async function collectViolations(page: Page): Promise<() => Promise<Violation[]>> {
  await page.addInitScript(() => {
    const store: unknown[] = [];
    (window as unknown as { __csp: unknown[] }).__csp = store;
    document.addEventListener("securitypolicyviolation", (e) => {
      store.push({ directive: e.violatedDirective, blocked: e.blockedURI, source: e.sourceFile });
    });
  });
  if (process.env.CSP_INJECT) {
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") return route.fallback();
      const response = await route.fetch();
      const headers = { ...response.headers(), [HEADER]: buildCsp({ nodeEnv: "production" }) };
      return route.fulfill({ response, headers });
    });
  }
  return () => page.evaluate(() => (window as unknown as { __csp: Violation[] }).__csp);
}

async function visit(page: Page, path: string, read: () => Promise<Violation[]>) {
  const response = await page.goto(path);
  expect(response?.headers()[HEADER] ?? "", `${path} sends the report-only CSP`).toContain(
    "default-src 'self'",
  );
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(SETTLE_MS);
  expect(await read(), `${path} has no CSP violations`).toEqual([]);
}

for (const path of PUBLIC_PAGES) {
  test(`${path} loads with zero CSP violations @csp`, async ({ page }) => {
    const read = await collectViolations(page);
    await visit(page, path, read);
  });
}

test("the hero's interactive view and motion run with zero CSP violations @csp", async ({
  page,
}) => {
  const read = await collectViolations(page);
  await visit(page, "/", read);
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
  await page.locator('svg.eco-svg a[href^="/ecosystem/"]').first().focus();
  await page.waitForTimeout(500);
  expect(await read()).toEqual([]);
});

test("the three.js workflow view runs with zero CSP violations @csp", async ({ page }) => {
  const read = await collectViolations(page);
  await visit(page, "/", read);
  await page.getByRole("button", { name: WORKFLOW_CONTROLS.explore.text }).click();
  const viewer = page.locator("[data-workflow-viewer]");
  await expect(viewer).toHaveAttribute("data-phase", /^(ready|failed|unavailable)$/, {
    timeout: 30_000,
  });
  test.skip((await viewer.getAttribute("data-phase")) !== "ready", "no WebGL in this browser");
  await page.waitForTimeout(500);
  expect(await read()).toEqual([]);
});

test.describe("@needs-backend", () => {
  test("/demo/tour loads with zero CSP violations @csp", async ({ page }) => {
    needsBackend();
    const read = await collectViolations(page);
    await signIn(page, "scientist");
    await visit(page, "/demo/tour", read);
  });
});
