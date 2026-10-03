#!/usr/bin/env node
// Review screenshots for CP-2 (Task 10): the homepage and two inner pages at desktop and mobile sizes,
// the hero exploded through the Explore components toggle, and a reduced-motion variant.
// Usage: PORT=3100 pnpm screenshots   (dev server or production build on that port)
//        node scripts/screenshots.mjs http://localhost:3100
// Output goes to docs/screenshots/, which is git-ignored. Only the base origin is ever fetched.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEVICES = Object.freeze({
  desktop: Object.freeze({
    name: "Desktop",
    viewport: Object.freeze({ width: 1440, height: 900 }),
  }),
  mobile: Object.freeze({ name: "Pixel 7" }),
});

const ROUTES = Object.freeze(["/", "/ecosystem/provenance-dlt", "/legal/privacy"]);
const OUT_DIR = "docs/screenshots";

const slugOf = (route) =>
  route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "-");

function parseBase(baseUrl) {
  const url = new URL(baseUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`base URL must be http or https, got ${url.protocol}`);
  }
  return url;
}

/** @returns {{ url: string; file: string; device: string; state: string; route: string }[]} */
export function planShots(baseUrl) {
  const base = parseBase(baseUrl);
  const shot = (route, device, state) => ({
    url: new URL(route, base).href,
    file: `${OUT_DIR}/${slugOf(route)}-${device}-${state}.png`,
    device,
    state,
    route,
  });
  const devices = Object.keys(DEVICES);
  return [
    ...ROUTES.flatMap((route) => devices.map((device) => shot(route, device, "full"))),
    ...devices.map((device) => shot("/", device, "exploded")),
    ...devices.map((device) => shot("/", device, "reduced-motion")),
  ];
}

async function contextFor(browser, devices, device, state) {
  const base =
    device === "desktop" ? { viewport: DEVICES.desktop.viewport } : devices[DEVICES.mobile.name];
  return browser.newContext({
    ...base,
    reducedMotion: state === "reduced-motion" ? "reduce" : "no-preference",
  });
}

async function takeShot(page, { url, file, state }) {
  await page.goto(url, { waitUntil: "networkidle" });
  if (state === "exploded") {
    // Wait for the interactive layer, press the toggle, and let the explode settle.
    await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
    await page.getByRole("button", { name: "Explore components" }).click();
    await page.waitForTimeout(1_500);
  }
  const animations = state === "exploded" ? "allow" : "disabled";
  await page.screenshot({ path: file, fullPage: true, animations });
}

/**
 * @param {{ baseUrl: string; plan?: ReturnType<typeof planShots>; launch?: () => Promise<any>; devices?: Record<string, any> }} options
 */
export async function captureShots({ baseUrl, plan = planShots(baseUrl), launch, devices }) {
  const base = parseBase(baseUrl);
  for (const entry of plan) {
    if (new URL(entry.url).origin !== base.origin) {
      throw new Error(`refusing to fetch ${entry.url}: not the base origin ${base.origin}`);
    }
  }
  const playwright = launch ? null : await import("@playwright/test");
  const browser = await (launch ? launch() : playwright.chromium.launch());
  const known = devices ?? playwright?.devices ?? {};
  try {
    mkdirSync(OUT_DIR, { recursive: true });
    for (const entry of plan) {
      const context = await contextFor(browser, known, entry.device, entry.state);
      const page = await context.newPage();
      await takeShot(page, entry);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return plan.map((entry) => path.resolve(entry.file));
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const base = process.argv[2] ?? `http://localhost:${process.env.PORT ?? "3100"}`;
  captureShots({ baseUrl: base })
    .then((files) =>
      process.stdout.write(`screenshots: wrote ${files.length} files to ${OUT_DIR}/\n`),
    )
    .catch((error) => {
      process.stderr.write(`screenshots: ${error.message}\n`);
      process.exit(1);
    });
}
